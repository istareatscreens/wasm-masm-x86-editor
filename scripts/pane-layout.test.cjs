const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const sass = require("sass");
const postcss = require("postcss");

// The layout's pure modules (src/js/components/main/layout/*.ts, paths.ts), compiled with the app's
// own tsconfig options except the module format, as file-drawer.test.cjs does.
const configPath = path.resolve(__dirname, "../tsconfig.json");
const { options } = ts.convertCompilerOptionsFromJson(ts.readConfigFile(configPath, ts.sys.readFile).config.compilerOptions, path.dirname(configPath));
options.module = ts.ModuleKind.CommonJS;
delete options.outDir;
const loaded = new Map();
function load(file) {
  if (loaded.has(file)) return loaded.get(file).exports;
  const module = { exports: {} };
  loaded.set(file, module);
  const { outputText } = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: options, fileName: file });
  const localRequire = (spec) => {
    if (!spec.startsWith(".")) return require(spec);
    const base = path.resolve(path.dirname(file), spec);
    return load([base, base + ".ts", base + ".js"].find((f) => fs.existsSync(f) && fs.statSync(f).isFile()));
  };
  new Function("exports", "require", "module", outputText)(module.exports, localRequire, module);
  return module.exports;
}
const MAIN = path.resolve(__dirname, "../src/js/components/main");
const viewMode = load(path.join(MAIN, "layout/viewMode.ts"));
const storage = load(path.join(MAIN, "layout/layoutStorage.ts"));
const place = load(path.join(MAIN, "layout/terminalPlace.ts"));
const paths = load(path.join(MAIN, "utility/filesystem/paths.ts"));

// The page takes its height from the initial containing block: no viewport unit may size the page or
// the grid (vh is the large viewport on phones, dvh moves with their toolbars); windows are bounded by
// their fixed containing block.
test("no viewport unit in the page's height chain or the grid, windows bounded by percentages", () => {
  const css = sass.compile(path.resolve(__dirname, "../src/css/main.scss")).css;
  const viewport = /\b\d*\.?\d+(vh|svh|lvh|dvh)\b/;
  const checked = [];
  postcss.parse(css).walkRules((rule) => {
    const selectors = rule.selector.split(",").map((s) => s.trim());
    const chain = selectors.some((s) => s === "html" || s === "body" || s === "#root");
    const grid = selectors.some((s) => /^\.app-layout(--[\w-]+)?$/.test(s));
    if (chain || grid) {
      rule.walkDecls((decl) => {
        if (chain && decl.prop !== "height") return;
        assert.doesNotMatch(decl.value, viewport, `${rule.selector} { ${decl.prop}: ${decl.value} }`);
        checked.push(rule.selector + " " + decl.prop);
      });
    }
    if (selectors.includes(".window")) {
      rule.walkDecls((decl) => {
        if (decl.prop === "max-width" || decl.prop === "max-height") {
          assert.equal(decl.value, "calc(100% - 16px)", `.window ${decl.prop}`);
          checked.push(".window " + decl.prop);
        }
      });
    }
  });
  for (const must of ["html height", "body height", "#root height", ".app-layout height", ".app-layout grid-template-rows", ".window max-width", ".window max-height"]) {
    assert.ok(checked.includes(must), "checked " + must);
  }
});

let compiled = null;
const stylesheet = () => (compiled = compiled || postcss.parse(sass.compile(path.resolve(__dirname, "../src/css/main.scss")).css));

// The hidden terminal keeps its box but has no area in the template: its implicit tracks are sized 0, so it
// takes no height from the panes.
test("implicit grid tracks take no space", () => {
  const found = {};
  stylesheet().walkRules(".app-layout", (rule) => rule.walkDecls(/^grid-auto-(rows|columns)$/, (decl) => { found[decl.prop] = decl.value; }));
  assert.deepEqual(found, { "grid-auto-rows": "0", "grid-auto-columns": "0" });
});

test("the view switch table", () => {
  const { modifierFor, withPane, DEFAULT_VIEW, ZEN_VIEW, ONLY_TERMINAL_VIEW } = viewMode;
  const table = [
    [[0, 0, 0], null],
    [[0, 0, 1], null],
    [[0, 1, 0], "only-cmd"],
    [[0, 1, 1], "no-editor"],
    [[1, 0, 0], "only-editor"],
    [[1, 0, 1], "no-cmd"],
    [[1, 1, 0], "no-file-drawer"],
    [[1, 1, 1], ""],
  ];
  for (const [[editor, cmd, drawer], modifier] of table) {
    assert.equal(modifierFor({ editor: !!editor, cmd: !!cmd, drawer: !!drawer }), modifier, `${editor}${cmd}${drawer}`);
  }
  assert.equal(modifierFor(DEFAULT_VIEW), "");
  assert.equal(modifierFor(ZEN_VIEW), "only-editor");
  assert.equal(modifierFor(ONLY_TERMINAL_VIEW), "only-cmd");
  // refused: the terminal hidden while the editor is hidden, and the editor hidden while the terminal is
  const noEditor = withPane(DEFAULT_VIEW, "editor", false);
  assert.deepEqual(noEditor, { editor: false, cmd: true, drawer: true });
  assert.equal(withPane(noEditor, "cmd", false), noEditor);
  const noCmd = withPane(DEFAULT_VIEW, "cmd", false);
  assert.equal(withPane(noCmd, "editor", false), noCmd);
  assert.deepEqual(withPane(noCmd, "cmd", true), DEFAULT_VIEW);
  assert.deepEqual(withPane(ZEN_VIEW, "cmd", true), { editor: true, cmd: true, drawer: false });
});

test("stored splitter positions and terminal places", () => {
  const { parseLayout, serializeLayout, DEFAULT_LAYOUT, LAYOUT_KEY, LAYOUT_VERSION } = storage;
  assert.equal(LAYOUT_KEY, "layout");
  assert.equal(LAYOUT_VERSION, 1);
  assert.deepEqual(DEFAULT_LAYOUT, { wide: { x: 0.6, y: 0.4, terminal: "right" }, narrow: { x: 0.7, y: 0.5, terminal: "bottom" } });
  assert.deepEqual(parseLayout(null), DEFAULT_LAYOUT, "missing");
  assert.deepEqual(parseLayout('{"version":1,"wide":{"x":"abc"'), DEFAULT_LAYOUT, "corrupt");
  assert.deepEqual(parseLayout(JSON.stringify({ version: 2, wide: { x: 0.3, y: 0.3, terminal: "left" } })), DEFAULT_LAYOUT, "another version");
  assert.deepEqual(parseLayout("[1,2]"), DEFAULT_LAYOUT, "not an object");
  const partial = parseLayout(JSON.stringify({ version: LAYOUT_VERSION, wide: { x: 0.45, y: 1.5 }, narrow: { x: -1, y: 0.3 } }));
  assert.deepEqual(partial, { wide: { x: 0.45, y: 0.4, terminal: "right" }, narrow: { x: 0.7, y: 0.3, terminal: "bottom" } }, "out of range values take their defaults");
  // a record written before the terminal could move keeps its shares and takes the default places
  const older = parseLayout(JSON.stringify({ version: 1, wide: { x: 0.45, y: 0.3 }, narrow: { x: 0.7, y: 0.5 } }));
  assert.deepEqual(older, { wide: { x: 0.45, y: 0.3, terminal: "right" }, narrow: { x: 0.7, y: 0.5, terminal: "bottom" } }, "version 1 without places");
  const odd = parseLayout(JSON.stringify({ version: 1, wide: { x: 0.5, y: 0.5, terminal: "top" }, narrow: { x: 0.5, y: 0.5, terminal: 3 } }));
  assert.deepEqual([odd.wide.terminal, odd.narrow.terminal], ["right", "bottom"], "an unknown place takes the default");
  const layout = { wide: { x: 0.45, y: 0.3, terminal: "left" }, narrow: { x: 0.65, y: 0.55, terminal: "right" } };
  assert.deepEqual(parseLayout(serializeLayout(layout)), layout, "round trip");
  assert.equal(JSON.parse(serializeLayout(layout)).version, LAYOUT_VERSION);
});

// The splitters each layout has unshifted (by breakpoint): what the default places give.
test("the default places give the unshifted splitters", () => {
  const EDITOR = ["editor", "editor-pane"], DRAWER = ["file drawer", "file-drawer-pane"], TERMINAL = ["terminal", "terminal-pane"];
  const unshifted = {
    "": { wide: { x: [EDITOR, "file drawer and terminal"], y: [DRAWER, "terminal"] }, narrow: { x: [EDITOR, "file drawer"], y: [["editor and file drawer", "editor-pane"], "terminal"] } },
    "no-editor": { wide: { x: [TERMINAL, "file drawer"] }, narrow: { x: [TERMINAL, "file drawer"] } },
    "no-cmd": { wide: { x: [EDITOR, "file drawer"] }, narrow: { x: [EDITOR, "file drawer"] } },
    "no-file-drawer": { wide: { x: [EDITOR, "terminal"] }, narrow: { y: [EDITOR, "terminal"] } },
    "only-editor": { wide: {}, narrow: {} },
    "only-cmd": { wide: {}, narrow: {} },
  };
  for (const [modifier, byBreakpoint] of Object.entries(unshifted)) {
    for (const breakpoint of ["wide", "narrow"]) {
      assert.deepEqual(place.splittersFor(modifier, place.DEFAULT_PLACE[breakpoint]), byBreakpoint[breakpoint], `${modifier || "default"} ${breakpoint}`);
    }
  }
  for (const modifier of ["no-editor", "no-cmd", "only-editor", "only-cmd"]) {
    for (const p of place.PLACES) assert.deepEqual(place.splittersFor(modifier, p), unshifted[modifier].wide, `${modifier} ${p}: the place does not matter`);
    assert.equal(place.placeMatters(modifier), false, modifier);
  }
  assert.equal(place.placeMatters(""), true);
  assert.equal(place.placeMatters("no-file-drawer"), true);
});

// Every place offers exactly the two others, so every move is undone with one click and none is a dead
// end; each button lies on a splitter of its place's template.
test("move buttons: no dead end, each on its splitter", () => {
  const areas = {};
  stylesheet().walkRules((rule) => {
    const m = /^\.app-layout(?:\[data-terminal="?(\w+)"?\])?$/.exec(rule.selector);
    if (!m || rule.parent.type !== "root") return;
    rule.walkDecls("grid-template-areas", (decl) => {
      areas[m[1] || "right"] = decl.value.match(/"[^"]*"/g).map((row) => row.slice(1, -1).trim().split(/\s+/));
    });
  });
  assert.deepEqual(Object.keys(areas).sort(), ["bottom", "left", "right"]);
  for (const p of place.PLACES) {
    const moves = place.MOVES[p];
    assert.deepEqual(moves.map((m) => m.to).sort(), place.PLACES.filter((q) => q !== p).sort(), `${p} offers the two other places`);
    const splitters = place.splittersFor("", p);
    for (const m of moves) {
      assert.ok(splitters[m.on], `${p} -> ${m.to}: its splitter exists`);
      assert.equal(areas[p][m.row - 1][m.column - 1], m.on === "x" ? "vsplit" : "hsplit", `${p} -> ${m.to}: row ${m.row} column ${m.column}`);
      assert.ok(place.MOVE_NAMES[m.to], `${p} -> ${m.to}: a name`);
    }
  }
  assert.equal(new Set(Object.values(place.MOVE_NAMES)).size, 3, "three distinct names");
});

test("MASM sources are .asm and .inc files only", () => {
  for (const name of ["a.asm", "lab/A.ASM", "Irvine32.inc", "macros.INC", "x.Inc"]) assert.equal(paths.isMasmSource(name), true, name);
  for (const name of ["notes.txt", "bin/a.lst", "bin/a.map", "go.bat", "README", "a.asm.txt", "a.incx", "bin/a.exe"]) assert.equal(paths.isMasmSource(name), false, name);
});
