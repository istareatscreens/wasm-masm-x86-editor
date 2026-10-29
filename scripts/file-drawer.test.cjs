const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { binaryCorpus } = require("./file-drawer.corpus.cjs");

// The file drawer's pure model (src/js/components/main/utility/filesystem/*.ts and
// filedrawer/model/tree.ts), compiled with the app's own tsconfig options (ES5 +
// downlevelIteration) except the module format.
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
const paths = load(path.join(MAIN, "utility/filesystem/paths.ts"));
const archive = load(path.join(MAIN, "utility/filesystem/archive.ts"));
const { isBinary } = load(path.join(MAIN, "utility/filesystem/binaryDetect.ts"));
const enc = load(path.join(MAIN, "utility/filesystem/textEncoding.ts"));
const tree = load(path.join(MAIN, "filedrawer/model/tree.ts"));

test("paths: splitting, ancestry and moves", () => {
  assert.deepEqual(paths.splitPath("a/b/c.asm"), ["a", "b", "c.asm"]);
  assert.deepEqual(paths.splitPath(""), []);
  assert.equal(paths.parentOf("a/b/c.asm"), "a/b");
  assert.equal(paths.parentOf("c.asm"), "");
  assert.equal(paths.baseOf("a/b/c.asm"), "c.asm");
  assert.deepEqual(paths.ancestorsOf("a/b/c.asm"), ["a", "a/b"]);
  assert.equal(paths.rebase("a/b/c.asm", "a/b", "x"), "x/b/c.asm");
  assert.equal(paths.rebase("a/b", "a/b", ""), "b");
  assert.equal(paths.rebase("a.asm", "a.asm", "lab1"), "lab1/a.asm");
  assert.ok(paths.isWithin("a/b/c", "a") && paths.isWithin("a", "a") && paths.isWithin("x", ""));
  assert.ok(!paths.isWithin("ab/c", "a"));
  assert.equal(paths.guestPath("lab 1/part a/main.asm"), "D:\\lab 1\\part a\\main.asm");
});

test("paths: build outputs go to the bin folder beside the source", () => {
  assert.equal(paths.outputPath("main.asm", ".exe"), "bin/main.exe");
  assert.equal(paths.outputPath("lab1/io/main.asm", ".obj"), "lab1/io/bin/main.obj");
  assert.equal(paths.outputPath("lab1/MAIN.ASM", ".exe"), "lab1/bin/MAIN.exe");
  assert.equal(paths.outputPath("my prog.asm", ""), "bin/my prog");
  assert.equal(paths.outputPath("\u30d7\u30ed/\u30d7\u30ed\u30b0\u30e9\u30e0.asm", ".exe"), "\u30d7\u30ed/bin/\u30d7\u30ed\u30b0\u30e9\u30e0.exe");
  // only the .asm extension is replaced
  assert.equal(paths.outputPath("a/x.asm.asm", ".exe"), "a/bin/x.asm.exe");
});

test("paths: names in every script, Windows rules and the size limits", () => {
  for (const ok of ["café.asm", "日本語のフォルダ", "программа.asm", "🚀rocket.asm", "İstanbul.asm", "my program.asm"]) assert.equal(paths.segmentProblem(ok), null, ok);
  for (const bad of ["con", "aux.asm", "a:b", "lab1.", " x", "a*b", "", "a\u0001"]) assert.notEqual(paths.segmentProblem(bad), null, JSON.stringify(bad));
  assert.equal(paths.segmentProblem("é".repeat(127)), null); // 254 bytes
  assert.match(paths.segmentProblem("é".repeat(128)), /255 bytes/); // 256 bytes
  assert.equal(paths.segmentProblem("語".repeat(85)), null); // 255 bytes
  assert.match(paths.segmentProblem("語".repeat(100)), /255 bytes/); // 300 bytes
  const deep = (n) => Array.from({ length: n }, () => "x".repeat(49)).join("/");
  assert.equal(paths.pathProblem(deep(5) + "/a"), null); // 3 + 249 + 2 = 254
  const long = deep(5) + "/" + "y".repeat(6); // 3 + 249 + 7 = 259
  assert.equal(paths.guestPath(long).length, 259);
  assert.equal(paths.pathProblem(long), null);
  assert.match(paths.pathProblem(long + "z"), /too long/);
  assert.equal(paths.normalizeName("e\u0301"), "\u00e9");
});

test("paths: siblings clash case-insensitively; a case-only rename is allowed", () => {
  const existing = ["lab1", "lab1/Main.asm", "test.asm"];
  assert.match(paths.nameProblem("MAIN.ASM", "lab1", existing), /already exists/);
  assert.match(paths.nameProblem("LAB1", "", existing), /already exists/);
  assert.equal(paths.nameProblem("main.asm", "", existing), null);
  assert.equal(paths.nameProblem("main.asm", "lab1", existing, "lab1/Main.asm"), null);
});

test("paths: the list is stored as ASCII JSON that earlier builds parse", () => {
  const list = { "日本語/プログラム.asm": "k1", "café.asm": "k2", "🚀.asm": "k3", "plain.asm": "k4" };
  const text = paths.toAsciiJson(list);
  assert.match(text, /^[\x00-\x7e]*$/);
  assert.deepEqual(JSON.parse(Buffer.from(Buffer.from(text, "latin1").toString("base64"), "base64").toString("latin1")), list);
});

const sample = () => tree.indexTree(["test.asm", "lab1/main.asm", "lab1/io/print.inc"], ["notes"]);

test("tree: Explorer rows, order, guides and boxes", () => {
  const rows = tree.buildRows(sample(), new Set(["lab1", "lab1/io"]), false);
  assert.deepEqual(rows.map((r) => r.name), ["(D:)", "lab1", "io", "print.inc", "main.asm", "notes", "test.asm"]);
  const by = Object.fromEntries(rows.map((r) => [r.path, r]));
  assert.deepEqual([by.lab1.kind, by.lab1.depth, by.lab1.expanded, by.lab1.hasChildren, by.lab1.isLast], ["folder", 1, true, true, false]);
  assert.deepEqual(by["lab1/io/print.inc"].guides, [true, true]); // lab1 and io both have later siblings
  assert.equal(by["lab1/io/print.inc"].isLast, true);
  assert.deepEqual([by.notes.hasChildren, by.notes.expanded], [false, false]);
  assert.equal(by["test.asm"].isLast, true);
  const collapsed = tree.buildRows(sample(), new Set(), false);
  assert.deepEqual(collapsed.map((r) => r.name), ["(D:)", "lab1", "notes", "test.asm"]);
});

test("tree: the .asm-only view keeps every folder", () => {
  const index = tree.indexTree(["test.asm", "test.exe", "lab1/notes.txt"], []);
  const rows = tree.buildRows(index, new Set(["lab1"]), true);
  assert.deepEqual(rows.map((r) => r.name), ["(D:)", "lab1", "test.asm"]);
  assert.equal(rows[1].hasChildren, false);
});

test("tree: tri-state checkboxes and the entries a selection stands for", () => {
  const index = sample();
  let checked = tree.toggleChecked("lab1", "folder", true, new Set(), index, false);
  assert.equal(tree.checkState("lab1", "folder", checked, index, false), "checked");
  assert.deepEqual(tree.resolveTargets(checked, index, false), { files: [], folders: ["lab1"] });
  checked = tree.toggleChecked("lab1/main.asm", "file", false, checked, index, false);
  assert.equal(tree.checkState("lab1", "folder", checked, index, false), "mixed");
  assert.equal(tree.checkState("lab1/io", "folder", checked, index, false), "checked");
  assert.deepEqual(tree.resolveTargets(checked, index, false), { files: [], folders: ["lab1/io"] });
  const empty = tree.toggleChecked("notes", "folder", true, new Set(), index, false);
  assert.equal(tree.checkState("notes", "folder", empty, index, false), "checked");
  assert.deepEqual(tree.resolveTargets(empty, index, false), { files: [], folders: ["notes"] });
});

test("tree: moves are refused into themselves, onto clashes, beyond MAX_PATH", () => {
  const index = tree.indexTree(["a.asm", "A2.asm", "lab1/main.asm", "lab1/io/print.inc", "course/a.ASM"], ["course"]);
  assert.match(tree.planMove(["lab1"], "lab1/io", index).problem, /into itself/);
  assert.match(tree.planMove(["lab1"], "lab1", index).problem, /into itself/);
  assert.match(tree.planMove(["a.asm"], "course", index).problem, /already exists/);
  assert.match(tree.planMove(["lab1/main.asm"], "lab1", index).problem, /Already in/);
  assert.deepEqual(tree.planMove(["lab1", "lab1/main.asm", "A2.asm"], "course", index), { moves: ["lab1", "A2.asm"], problem: null });
  const twins = tree.indexTree(["x/a.asm", "y/A.asm"], ["z"]);
  assert.match(tree.planMove(["x/a.asm", "y/A.asm"], "z", twins).problem, /already exists/);
  const deep = tree.indexTree(["d/" + "q".repeat(200) + "/f.asm"], ["e".repeat(60)]);
  assert.match(tree.planMove(["d"], "e".repeat(60), deep).problem, /too long/);
});

test("tree: rows are drawn in pages of 100", () => {
  assert.equal(tree.PAGE_ROWS, 100);
  assert.deepEqual([0, 1, 100, 101, 1054].map(tree.pageCount), [1, 1, 1, 2, 11]);
  assert.deepEqual([0, 99, 100, 199, 200, 1053].map(tree.pageOf), [0, 0, 1, 1, 2, 10]);
  const files = Array.from({ length: 300 }, (_, i) => "f" + String(i).padStart(3, "0") + ".asm");
  const rows = tree.buildRows(tree.indexTree(files, []), new Set(), false);
  assert.equal(rows.length, 301); // (D:) and 300 files: four pages, the root on the first
  assert.equal(tree.pageOf(rows.findIndex((row) => row.path === "f099.asm")), 1);
});

test("tree: rows that did not change keep their identity", () => {
  const index = tree.indexTree(["a/x.asm", "a/y.asm", "b/z.asm", "top.asm"], []);
  const before = tree.buildRows(index, new Set(), false);
  const byPath = new Map(before.map((row) => [row.path, row]));
  const after = tree.reuseRows(byPath, tree.buildRows(index, new Set(["a"]), false));
  const same = (path) => after.find((row) => row.path === path) === byPath.get(path);
  assert.equal(same(""), true);
  assert.equal(same("a"), false); // expanded now
  assert.equal(same("b"), true);
  assert.equal(same("top.asm"), true);
  assert.deepEqual(after.map((row) => row.path), ["", "a", "a/x.asm", "a/y.asm", "b", "top.asm"]);
});

test("archive: entry names are made safe or skipped with a reason", () => {
  const s = archive.sanitizeEntryPath;
  assert.deepEqual(s("ok/good.asm"), { path: "ok/good.asm", dir: false });
  assert.deepEqual(s("a\\b\\c.asm"), { path: "a/b/c.asm", dir: false });
  assert.deepEqual(s("./x/"), { path: "x", dir: true });
  assert.deepEqual(s("e\u0301/x.asm"), { path: "\u00e9/x.asm", dir: false });
  assert.match(s("../evil.asm").skip, /outside/);
  assert.match(s("C:/x.asm").skip, /absolute/);
  assert.match(s("/etc/passwd").skip, /absolute/);
  assert.match(s("ok/aux.asm").skip, /reserved/);
  assert.match(s("__MACOSX/._a").skip, /macOS/);
  assert.match(s("x/.DS_Store").skip, /macOS/);
  assert.deepEqual(s("/".replace("/", "")), { ignore: true });
});

test("archive: legacy names decode as CP437, UTF-8 names as UTF-8", () => {
  assert.equal(archive.decodeEntryName(Buffer.from("R\x82sum\x82.txt", "latin1")), "Résumé.txt");
  assert.equal(archive.decodeEntryName(Array.from(Buffer.from("日本語.asm", "utf8"))), "日本語.asm");
  assert.equal(archive.decodeEntryName("\x9c5.txt"), "£5.txt");
});

test("archive: import plans merge case-insensitively and refuse bombs", () => {
  const plan = archive.planImport(
    [
      { name: "LAB1/x.asm", dir: false, size: 10 },
      { name: "Main.ASM", dir: false, size: 5 },
      { name: "notes/", dir: true, size: 0 },
      { name: "deep/er/", dir: true, size: 0 },
      { name: "test.asm/inner.asm", dir: false, size: 1 },
      { name: "lab1", dir: false, size: 1 },
      { name: "lab1/X.asm", dir: false, size: 1 },
      { name: "../evil.asm", dir: false, size: 1 },
    ],
    "",
    ["main.asm", "test.asm", "lab1/old.asm"],
    [],
  );
  assert.equal(plan.refused, null);
  assert.deepEqual(plan.files, [{ index: 0, path: "lab1/x.asm" }, { index: 1, path: "main.asm" }]);
  assert.deepEqual(plan.folders, ["notes", "deep", "deep/er"]); // shallowest first, then archive order
  assert.deepEqual(plan.skipped.map((s) => s.name), ["test.asm/inner.asm", "lab1", "lab1/X.asm", "../evil.asm"]);
  const target = archive.planImport([{ name: "proj/a.asm", dir: false, size: 1 }], "notes", [], ["notes"]);
  assert.deepEqual([target.folders, target.files], [["notes/proj"], [{ index: 0, path: "notes/proj/a.asm" }]]);
  assert.match(archive.planImport(Array.from({ length: 2001 }, (_, i) => ({ name: i + ".txt", dir: false, size: 1 })), "", [], []).refused, /2001 entries/);
  assert.match(archive.planImport([{ name: "big.bin", dir: false, size: 64 * 1048576 + 1 }], "", [], []).refused, /MiB/);
});

test("archive: an export keeps folders, empty ones included", () => {
  const index = tree.indexTree(["test.asm", "lab1/main.asm", "lab1/io/print.inc", "lab1/main.exe"], ["lab1/empty"]);
  const all = [index.files, Array.from(index.folders)];
  assert.deepEqual(archive.planExport({ files: [], folders: ["lab1"] }, ...all), {
    files: ["lab1/io/print.inc", "lab1/main.asm", "lab1/main.exe"],
    folders: ["lab1", "lab1/empty", "lab1/io"],
    name: "lab1",
  });
  assert.equal(archive.planExport({ files: ["test.asm"], folders: ["lab1"] }, ...all).name, null);
});

// isbinaryfile 6.0.0's own results for file-drawer.corpus.cjs (recorded with the real
// library under Node; openspec change improve-file-drawer, reference/binary-corpus.json).
const ISBINARYFILE_6_0_0 = {
  "empty": false, "ascii-asm": false, "utf8-cjk-emoji": false, "utf8-bom": false,
  "utf16le-bom": false, "utf16be-bom": false, "utf16le-nobom": false, "utf16be-nobom": false,
  "cp1252-text": true, "cp1251-text": true, "ascii-few-latin1": false, "control-chars": true,
  "pe-exe": true, "coff-obj": true, "png": true, "pdf": true, "protobuf-like": true,
  "random-1k": true, "utf8-split-at-512": false, "short-binary": true, "tabs-newlines": false,
};

test("binary detection matches isbinaryfile 6.0.0 on the corpus", () => {
  const corpus = binaryCorpus();
  assert.deepEqual(corpus.map(([name]) => name).sort(), Object.keys(ISBINARYFILE_6_0_0).sort());
  for (const [name, bytes] of corpus) {
    assert.equal(isBinary(new Uint8Array(bytes)), ISBINARYFILE_6_0_0[name], name);
    assert.equal(isBinary(new Uint8Array(bytes.subarray(0, 515))), ISBINARYFILE_6_0_0[name], name + " (prefix)");
  }
});

test("text encodings: detection and exact round trips", () => {
  const u8 = (b) => new Uint8Array(b);
  const text = "; 你好 мир γειά שלום नमस्ते 🚀 €\r\nmov eax, 1\n";
  assert.equal(enc.detectEncoding(u8(Buffer.from(text, "utf8"))), "utf-8");
  assert.equal(enc.detectEncoding(u8([0xef, 0xbb, 0xbf, 0x41])), "utf-8-bom");
  assert.equal(enc.detectEncoding(u8([0xff, 0xfe, 0x41, 0])), "utf-16le");
  assert.equal(enc.detectEncoding(u8([0xfe, 0xff, 0, 0x41])), "utf-16be");
  assert.equal(enc.detectEncoding(u8([0x43, 0x61, 0x66, 0xe9])), "windows-1252");
  assert.equal(enc.detectEncoding(u8([])), "utf-8");
  for (const name of ["utf-8", "utf-8-bom", "utf-16le", "utf-16be"]) {
    const bytes = enc.encodeText(text, name);
    assert.equal(enc.detectEncoding(bytes), name);
    assert.equal(enc.decodeText(bytes, name), text, name);
    assert.deepEqual(enc.encodeText(enc.decodeText(bytes, name), name), bytes, name);
  }
  const all = u8(Array.from({ length: 512 }, (_, i) => i & 0xff));
  assert.deepEqual(enc.encodeText(enc.decodeText(all, "windows-1252"), "windows-1252"), all);
  const old = u8(Buffer.from([0x43, 0x61, 0x66, 0xe9, 0x20, 0x93, 0x71, 0x94]));
  assert.equal(enc.decodeText(old, "windows-1252"), "Café “q”");
  assert.equal(enc.canEncode("Café “q”", "windows-1252"), true);
  assert.equal(enc.canEncode("日本", "windows-1252"), false);
  assert.throws(() => enc.encodeText("日本", "windows-1252"));
  const big = u8(Array.from({ length: 200000 }, (_, i) => (i * 31) & 0xff));
  assert.deepEqual(enc.base64ToBytes(enc.bytesToBase64(big)), big);
  assert.equal(enc.bytesToBase64(big), Buffer.from(big).toString("base64"));
});

test("text encodings: an assembler source loses its byte order mark, as ML requires", () => {
  for (const name of ["a.asm", "lab/X.INC", "deep/日本/x.Asm", "Irvine32.inc"]) assert.ok(enc.ASSEMBLER_SOURCE.test(name), name);
  for (const name of ["a.txt", "asm", "a.asm.txt", "x.inc.bak", "notes.asmx"]) assert.ok(!enc.ASSEMBLER_SOURCE.test(name), name);
  const text = "; 日本語 🚀 é" + String.fromCharCode(13, 10) + "msg BYTE \"Привет\", 0" + String.fromCharCode(13, 10);
  const plain = new Uint8Array(Buffer.from(text, "utf8"));
  assert.equal(enc.byteOrderMark(plain), null);
  assert.equal(enc.byteOrderMark(new Uint8Array([0xef, 0xbb])), null);
  assert.equal(enc.byteOrderMark(new Uint8Array([])), null);
  for (const name of ["utf-8-bom", "utf-16le", "utf-16be"]) {
    const stored = enc.bytesToBase64(enc.encodeText(text, name));
    // the first four base64 characters (three bytes) are enough to see the mark
    const mark = enc.byteOrderMark(enc.base64ToBytes(stored.slice(0, 4)));
    assert.equal(mark, name);
    assert.deepEqual(enc.encodeText(enc.decodeText(enc.base64ToBytes(stored), mark), "utf-8"), plain, name);
  }
  assert.equal(enc.byteOrderMark(enc.base64ToBytes(enc.bytesToBase64(new Uint8Array([0xff, 0xfe])).slice(0, 4))), "utf-16le");
});
