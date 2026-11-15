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
const drives = load(path.join(MAIN, "utility/filesystem/drives.ts"));
const resetKeys = load(path.join(MAIN, "banner/about/resetKeys.ts"));
const storeSync = load(path.join(MAIN, "utility/filesystem/storeSync.ts"));

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
  assert.deepEqual(tree.resolveTargets(checked, index, false), { files: [], folders: ["lab1"], drives: [] });
  checked = tree.toggleChecked("lab1/main.asm", "file", false, checked, index, false);
  assert.equal(tree.checkState("lab1", "folder", checked, index, false), "mixed");
  assert.equal(tree.checkState("lab1/io", "folder", checked, index, false), "checked");
  assert.deepEqual(tree.resolveTargets(checked, index, false), { files: [], folders: ["lab1/io"], drives: [] });
  const empty = tree.toggleChecked("notes", "folder", true, new Set(), index, false);
  assert.equal(tree.checkState("notes", "folder", empty, index, false), "checked");
  assert.deepEqual(tree.resolveTargets(empty, index, false), { files: [], folders: ["notes"], drives: [] });
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

// --- drives (E: to Y:) -------------------------------------------------------------------------------
const ID1 = "0123456789abcdef", ID2 = "fedcba9876543210";
const registry = [
  { id: ID2, label: "bob", letter: "f", createdAt: 2 },
  { id: ID1, label: "alice", letter: "E", createdAt: 1 },
];

test("drives: paths, routing and letters", () => {
  assert.deepEqual(drives.splitDrive("drive:" + ID1 + "/lab3/main.asm"), { id: ID1, rel: "lab3/main.asm" });
  assert.deepEqual(drives.splitDrive("drive:" + ID1), { id: ID1, rel: "" });
  assert.deepEqual(drives.splitDrive("lab3/main.asm"), { id: null, rel: "lab3/main.asm" });
  assert.equal(drives.rootOf("drive:" + ID1 + "/a/b"), "drive:" + ID1);
  assert.equal(drives.rootOf("a/b"), "");
  assert.ok(drives.isRootPath("") && drives.isRootPath("drive:" + ID1) && !drives.isRootPath("drive:" + ID1 + "/a") && !drives.isRootPath("a"));
  assert.equal(drives.guestPathOf("lab3/main.asm"), "/mnt/drive_d/lab3/main.asm");
  assert.equal(drives.guestPathOf(""), "/mnt/drive_d/");
  assert.equal(drives.guestPathOf("drive:" + ID1 + "/lab3/main.asm"), "/mnt/bw_drives/" + ID1 + "/lab3/main.asm");
  assert.equal(drives.guestPathOf("drive:" + ID1), "/mnt/bw_drives/" + ID1);
  assert.equal(drives.nativePathOf("lab3/x.inc"), "/d_drive/lab3/x.inc");
  assert.equal(drives.nativePathOf("drive:" + ID1 + "/x.inc"), "/bw_drives/" + ID1 + "/x.inc");
  drives.setDriveLetters(drives.parseRegistry(registry));
  assert.equal(drives.letterOf("drive:" + ID1 + "/a"), "E");
  assert.equal(drives.letterOf("drive:" + ID2), "F");
  assert.equal(drives.letterOf("a"), "D");
  assert.equal(paths.guestPath("drive:" + ID1 + "/lab3/main.asm"), "E:\\lab3\\main.asm");
  assert.equal(paths.folderLabel("drive:" + ID2), "F:\\");
  assert.equal(paths.folderLabel(""), "D:\\");
  assert.equal(drives.exportPath("drive:" + ID1 + "/lab3/main.asm", false), "lab3/main.asm");
  assert.equal(drives.exportPath("drive:" + ID1 + "/lab3/main.asm", true), "E/lab3/main.asm");
  assert.equal(drives.exportPath("lab3/main.asm", true), "D/lab3/main.asm");
  assert.equal(drives.newDriveId(new Uint8Array([0, 1, 2, 171, 205, 239, 16, 255, 9])), "000102abcdef10ff");
  assert.ok(drives.isDriveId(ID1) && !drives.isDriveId("0123") && !drives.isDriveId(ID1.toUpperCase()) && !drives.isDriveId(5));
});

test("drives: the registry is checked, letters run from E: to Y:, and a drive may have none", () => {
  const parsed = drives.parseRegistry([...registry, { id: "zz", label: "x", letter: "g" }, { id: ID1, label: "dup", letter: "h" },
    { id: "1111111111111111", label: "c", letter: "c" }, { id: "2222222222222222", label: "d drive", letter: "d" },
    { id: "3333333333333333", label: "bad label", letter: "g" }, { id: "4444444444444444", label: "x", letter: "f" },
    { id: "5555555555555555", label: "Able", letter: "", createdAt: 3, usedAt: 9 }, null, "x"]);
  // with a letter by letter, then without one by label; a bad letter, or one taken, becomes none
  assert.deepEqual(parsed.map((d) => [d.letter, d.label]), [["e", "alice"], ["f", "bob"], ["g", "drive"], ["", "Able"], ["", "c"], ["", "drive"], ["", "x"]]);
  assert.deepEqual(parsed.map((d) => d.usedAt), [1, 2, 0, 9, 0, 0, 0], "usedAt defaults to createdAt");
  assert.deepEqual(drives.parseRegistry("not a list"), []);
  assert.equal(drives.DRIVE_LETTERS.length, 21);
  assert.equal(drives.DRIVE_LETTERS[0], "e");
  assert.equal(drives.DRIVE_LETTERS[20], "y");
  const all = drives.DRIVE_LETTERS.map((letter, i) => ({ id: ("0000000000000000" + i.toString(16)).slice(-16), label: "d" + i, letter, createdAt: 0 }));
  assert.equal(drives.freeLetter(all.slice(0, 20)), "y");
  assert.equal(drives.freeLetter(all), null);
  assert.equal(drives.freeLetter(all.filter((d) => d.letter !== "h")), "h");
  assert.equal(drives.driveName({ label: "alice", letter: "e" }), "alice (E:)");
  assert.equal(drives.driveName({ label: "alice", letter: "" }), "alice");
  assert.equal(drives.D_NAME, "(D:)");
});

test("drives: a drive without a letter takes a free one, else the least recently used drive's", () => {
  const d = (i, letter, usedAt) => ({ id: ("000000000000000" + i.toString(16)).slice(-16), label: "d" + i, letter, createdAt: 0, usedAt });
  const id = (i) => ("000000000000000" + i.toString(16)).slice(-16);
  const some = [d(1, "e", 50), d(2, "", 10), d(3, "g", 5)];
  assert.deepEqual(drives.chooseLetter(some, []), { letter: "f", from: null });
  // all 21 letters in use: the oldest use gives its letter up
  const full = drives.DRIVE_LETTERS.map((letter, i) => d(i + 1, letter, 100 + i)).concat([d(40, "", 1)]);
  full[7].usedAt = 3; // L:
  assert.deepEqual(drives.chooseLetter(full, []), { letter: "l", from: id(8) });
  // the open file's drive and the last build's keep theirs: the next oldest gives it up
  assert.deepEqual(drives.chooseLetter(full, [id(8), id(1)]), { letter: "f", from: id(2) });
  // the same use time: the lower id
  const tie = drives.DRIVE_LETTERS.map((letter, i) => d(i + 1, letter, 7));
  assert.deepEqual(drives.chooseLetter(tie, []), { letter: "e", from: id(1) });
  // nothing may give one up
  assert.equal(drives.chooseLetter(tie, tie.map((x) => x.id)), null);
  // display paths: a drive without a letter by its label; lengths count it as a letter
  drives.setDriveLetters([{ id: ID1, label: "alice", letter: "", createdAt: 1, usedAt: 1 }]);
  assert.equal(drives.letterOf("drive:" + ID1 + "/a"), "");
  assert.equal(paths.guestPath("drive:" + ID1 + "/lab3/main.asm"), "alice:\\lab3\\main.asm");
  assert.equal(drives.exportPath("drive:" + ID1 + "/lab3/main.asm", true), "alice/lab3/main.asm");
  assert.equal(paths.pathProblem("drive:" + ID1 + "/" + "x".repeat(254) + "/y"), null);
  assert.match(paths.pathProblem("drive:" + ID1 + "/" + "x".repeat(254) + "/yy"), /too long/);
  drives.setDriveLetters(drives.parseRegistry(registry));
});

test("drives: labels have no spaces (underscores), and Create new names fit 32 characters", () => {
  assert.equal(drives.normalizeLabel("  my labs  "), "my_labs");
  assert.equal(drives.normalizeLabel("Lab 3 Alice"), "Lab_3_Alice");
  assert.equal(drives.labelFor("Lab 3 Alice", "shared"), "Lab_3_Alice");
  assert.equal(drives.labelFor("", "shared"), "shared");
  assert.equal(drives.labelFor("a:b", "shared"), "shared");
  assert.equal(drives.labelFor("x".repeat(33), "shared"), "shared");
  assert.equal(drives.labelProblem("alice_2026"), null);
  assert.equal(drives.labelProblem("café-日本"), null);
  assert.match(drives.labelProblem("a b"), /space/);
  assert.match(drives.labelProblem("a\u202eb"), /invisible/);
  assert.match(drives.labelProblem("a\u200bb"), /invisible/);
  assert.match(drives.labelProblem("a*b"), /cannot contain/);
  assert.match(drives.labelProblem(""), /enter/);
  assert.match(drives.labelProblem("x".repeat(33)), /32/);
  const now = new Date(2026, 10, 13, 9, 5);
  assert.equal(drives.createNewLabel("alice", now, "k7q2"), "alice_2026-11-13_k7q2");
  const long = drives.createNewLabel("a-very-long-workspace-name-indeed", now, "k7q2");
  assert.equal(long.length, 32);
  assert.ok(long.endsWith("_2026-11-13_k7q2"));
  assert.equal(drives.labelProblem(long), null);
  const astral = drives.createNewLabel("abcdefghijklmno\u{1F680}xyz", now, "abcd");
  assert.ok(!/[\ud800-\udbff]_/.test(astral) && astral.length <= 32, astral);
  assert.equal(drives.randomSuffix(new Uint8Array([0, 35, 36, 252, 255, 7])), "a9ah");
  assert.equal(drives.randomSuffix(new Uint8Array([253, 254, 1])), null);
});

test("drives: D: and drive roots in paths and the tree", () => {
  drives.setDriveLetters(drives.parseRegistry(registry));
  const E = "drive:" + ID1, F = "drive:" + ID2;
  assert.equal(paths.depthOf(E), 0);
  assert.equal(paths.depthOf(E + "/a/b.asm"), 2);
  assert.deepEqual(paths.ancestorsOf(E + "/a/b/c.asm"), [E + "/a", E + "/a/b"]);
  assert.deepEqual(paths.ancestorsOf(E + "/c.asm"), []);
  assert.ok(paths.isWithin(E + "/a", E) && !paths.isWithin(E + "/a", "") && paths.isWithin("a", "") && !paths.isWithin(F + "/a", E));
  assert.equal(paths.pathProblem(E + "/lab3/main.asm"), null);
  assert.match(paths.pathProblem(E + "/bad:name"), /cannot contain/);
  assert.equal(paths.nameProblem("main.asm", E, [E + "/MAIN.ASM"]), "an item with that name already exists here");
  assert.equal(paths.nameProblem("main.asm", E, ["main.asm", F + "/main.asm"]), null);
  assert.equal(paths.outputPath(E + "/main.asm", ".exe"), E + "/bin/main.exe");
  const roots = [{ path: "", name: "ws (D:)", label: "ws" }, { path: E, name: "alice (E:)", label: "alice" }, { path: F, name: "bob (F:)", label: "bob" }];
  const files = ["d.asm", E + "/lab3/main.asm", E + "/notes.txt", F + "/f.asm"];
  const index = tree.indexTree(files, [E + "/empty", F], roots);
  assert.ok(!index.folders.has(E) && !index.folders.has(F) && index.folders.has(E + "/lab3") && index.folders.has(E + "/empty"));
  const rows = tree.buildRows(index, new Set([E + "/lab3"]), false);
  assert.deepEqual(rows.map((r) => [r.kind, r.name, r.depth]), [
    ["root", "ws (D:)", 0], ["file", "d.asm", 1],
    ["root", "alice (E:)", 0], ["folder", "empty", 1], ["folder", "lab3", 1], ["file", "main.asm", 2], ["file", "notes.txt", 1],
    ["root", "bob (F:)", 0], ["file", "f.asm", 1],
  ]);
  assert.equal(rows[2].label, "alice");
  const everything = tree.checkAll(true, index, false);
  assert.equal(tree.selectAllState(everything, index, false), "checked");
  assert.deepEqual(tree.resolveTargets(everything, index, false), { files: ["d.asm", E + "/notes.txt", F + "/f.asm"], folders: [E + "/empty", E + "/lab3"], drives: [E, F] });
  const onlyE = tree.toggleChecked(E, "root", true, new Set(), index, false);
  assert.equal(tree.selectAllState(onlyE, index, false), "mixed");
  assert.deepEqual(tree.resolveTargets(onlyE, index, false), { files: [E + "/notes.txt"], folders: [E + "/empty", E + "/lab3"], drives: [E] });
  // an empty drive is ticked on its own, and Select All ticks it; D: is never a drive to delete
  const G = "drive:00112233445566ff";
  const withEmpty = tree.indexTree(files, [], roots.concat([{ path: G, name: "empty (G:)", label: "empty" }]));
  const gTicked = tree.toggleChecked(G, "root", true, new Set(), withEmpty, false);
  assert.equal(tree.checkState(G, "root", gTicked, withEmpty, false), "checked");
  assert.deepEqual(tree.resolveTargets(gTicked, withEmpty, false), { files: [], folders: [], drives: [G] });
  // every file of a drive ticked one by one: those files go, the drive stays
  const fOnly = tree.toggleChecked(F + "/f.asm", "file", true, new Set(), index, false);
  assert.equal(tree.checkState(F, "root", fOnly, index, false), "checked");
  assert.deepEqual(tree.resolveTargets(fOnly, index, false), { files: [F + "/f.asm"], folders: [], drives: [] });
  const all = tree.checkAll(true, withEmpty, false);
  assert.equal(tree.selectAllState(all, withEmpty, false), "checked");
  assert.deepEqual(tree.resolveTargets(all, withEmpty, false).drives, [E, F, G]);
  assert.equal(tree.checkState("", "root", tree.toggleChecked("", "root", true, new Set(), index, false), index, false), "checked");
  assert.deepEqual(tree.resolveTargets(tree.toggleChecked("", "root", true, new Set(), index, false), index, false), { files: ["d.asm"], folders: [], drives: [] });
  assert.equal(tree.selectAllState(new Set(), index, false), "unchecked");
  assert.deepEqual(tree.planMove(["d.asm"], E, index), { moves: ["d.asm"], problem: null });
  assert.equal(tree.planMove([E + "/lab3"], "", index).problem, null);
  assert.equal(tree.planMove([E + "/notes.txt"], F, index).problem, null);
  assert.match(tree.planMove(["d.asm"], "drive:aaaaaaaaaaaaaaaa", index).problem, /no longer exists/);
  assert.match(tree.planMove([F + "/f.asm"], E, tree.indexTree(files.concat([E + "/F.ASM"]), [], roots)).problem, /already exists in E:\\/);
});

test("a plain Hard Reset's localStorage keys never include a drawer or drive key, the settings or the layout", () => {
  for (const key of ["bw-runtime-pref", "bw-storage-v", "bwsnapmark|abc"]) assert.ok(resetKeys.isResetKey(key), key);
  const listKey = "6f1c2e04-5a2b-4c3d-9e8f-0a1b2c3d4e5f";
  const kept = ["/", "settings", "layout", "fileDrawerExpanded", listKey, listKey + ":folders", drives.registryKey(listKey),
    drives.driveListKey(listKey, ID1), drives.driveFoldersKey(listKey, ID1), "a1b2c3d4-0000-4000-8000-000000000000"];
  for (const key of kept) assert.ok(!resetKeys.isResetKey(key), key);
  // the drawer's random ids are UUIDs (hex digits and dashes): never "bw-..." nor "layout"
  for (let i = 0; i < 200; i++) {
    const id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => ((c === "x" ? Math.random() * 16 : 8 + Math.random() * 4) | 0).toString(16));
    assert.ok(!resetKeys.isResetKey(id) && !resetKeys.isResetKey(drives.registryKey(id)) && !resetKeys.isResetKey(drives.driveListKey(id, ID2)), id);
  }
});

test("tabs: a list written over another tab's change keeps both", () => {
  const { mergeFileMap, mergeNames } = storeSync;
  // nothing changed meanwhile: what this tab wrote
  assert.deepEqual(mergeFileMap({ a: "1" }, { a: "1", b: "2" }, { a: "1" }), { a: "1", b: "2" });
  // added here and there, deleted here, changed here
  assert.deepEqual(mergeFileMap({ a: "1", b: "2" }, { a: "1", c: "3" }, { a: "1", b: "2", d: "4" }), { a: "1", c: "3", d: "4" });
  assert.deepEqual(mergeFileMap({ a: "1" }, { a: "5" }, { a: "1", d: "4" }), { a: "5", d: "4" });
  // deleted here, but changed (replaced) there meanwhile: theirs stays
  assert.deepEqual(mergeFileMap({ a: "1" }, {}, { a: "9" }), { a: "9" });
  // deleted there: not brought back by an unrelated change here
  assert.deepEqual(mergeFileMap({ a: "1", b: "2" }, { a: "1", b: "2", c: "3" }, { b: "2" }), { b: "2", c: "3" });
  // first write of a list another tab created meanwhile
  assert.deepEqual(mergeFileMap(null, { x: "1" }, { y: "2" }), { x: "1", y: "2" });
  assert.deepEqual(mergeNames(["a", "b"], ["a", "c"], ["a", "b", "d"]), ["a", "c", "d"]);
  assert.deepEqual(mergeNames(null, ["b"], ["a"]), ["a", "b"]);
  assert.deepEqual(mergeNames(["a"], [], null), []);
});

test("tabs: drives added in two tabs at once get letters of their own", () => {
  const { mergeDrives } = storeSync;
  const d = (id, letter, label = "x") => ({ id, label, letter, createdAt: 1 });
  const ID3 = "00112233445566ff";
  // both took E:: the one added here moves to F:
  assert.deepEqual(mergeDrives([], [d(ID1, "e", "mine")], [d(ID2, "e", "theirs")]), [d(ID2, "e", "theirs"), d(ID1, "f", "mine")]);
  // deleted here stays deleted; relabelled here but deleted there stays deleted
  assert.deepEqual(mergeDrives([d(ID1, "e"), d(ID2, "f")], [d(ID2, "f")], [d(ID1, "e"), d(ID2, "f"), d(ID3, "g")]), [d(ID2, "f"), d(ID3, "g")]);
  assert.deepEqual(mergeDrives([d(ID1, "e")], [d(ID1, "e", "renamed")], [d(ID3, "g")]), [d(ID3, "g")]);
  assert.deepEqual(mergeDrives([d(ID1, "e")], [d(ID1, "e", "renamed")], [d(ID1, "e"), d(ID3, "g")]), [d(ID1, "e", "renamed"), d(ID3, "g")]);
  // every letter taken: the drive added here is kept without a letter
  const full = drives.DRIVE_LETTERS.map((letter, i) => d(("0000000000000000" + i.toString(16)).slice(-16), letter));
  assert.deepEqual(mergeDrives([], [d(ID1, "e")], full), full.concat([d(ID1, "")]));
  // both tabs gave E: to a drive that had none: the store's keeps it, this tab's takes the next free letter
  assert.deepEqual(mergeDrives([d(ID1, ""), d(ID2, "")], [d(ID1, "e"), d(ID2, "")], [d(ID1, ""), d(ID2, "e")]), [d(ID2, "e"), d(ID1, "f")]);
  // ... or none when none is free
  const others = full.slice(1);
  assert.deepEqual(mergeDrives([d(ID1, "")].concat(others), [d(ID1, "e")].concat(others), [d(ID1, "")].concat(full.slice(0, 1), others)).filter((x) => x.id === ID1), [d(ID1, "")]);
  // a field changed here, another there: both kept
  assert.deepEqual(mergeDrives([d(ID1, "e", "a")], [d(ID1, "e", "renamed")], [d(ID1, "g", "a")]), [d(ID1, "g", "renamed")]);
  // this tab took a drive's letter for another (least recently used): the order is by letter, then by label
  assert.deepEqual(mergeDrives([d(ID1, "e", "old"), d(ID2, "", "new")], [d(ID1, "", "old"), d(ID2, "e", "new")], [d(ID1, "e", "old"), d(ID2, "", "new")]), [d(ID2, "e", "new"), d(ID1, "", "old")]);
  // a drive deleted in another tab, and a new drive created here before this tab caught up: the deleted drive stays
  // deleted, the new one takes the letter that is free
  assert.deepEqual(mergeDrives([d(ID1, "e", "New_Drive")], [d(ID1, "e", "New_Drive"), d(ID2, "f", "New_Drive_2")], []), [d(ID2, "f", "New_Drive_2")]);
  // deleted here, then a drive of the same label created here: the new drive, never the deleted one
  assert.deepEqual(mergeDrives([d(ID1, "e", "New_Drive")], [d(ID2, "e", "New_Drive")], [d(ID1, "e", "New_Drive")]), [d(ID2, "e", "New_Drive")]);
});

test("tree: a selection rectangle ticks the rows it touches, Ctrl toggles them", () => {
  const index = sample();
  const rows = tree.buildRows(index, new Set(["lab1", "lab1/io"]), false);
  const byPath = (...p) => rows.filter((r) => p.includes(r.path));
  const files = rows.filter((r) => r.kind === "file").map((r) => r.path);
  // two files: those ticked, nothing else
  const two = tree.marqueeTicks(byPath(files[0], files[1]), false, new Set([files[2]]), index, false);
  assert.deepEqual(Array.from(two).sort(), [files[0], files[1]].sort());
  // Ctrl: the touched rows switch from the start
  const ctrl = tree.marqueeTicks(byPath(files[1], files[2]), true, new Set([files[0], files[1]]), index, false);
  assert.deepEqual(Array.from(ctrl).sort(), [files[0], files[2]].sort());
  // an expanded folder is left to its rows; a collapsed one stands for all it holds
  const open = tree.marqueeTicks(byPath("lab1"), false, new Set(), index, false);
  assert.equal(open.size, 0);
  const closedRows = tree.buildRows(index, new Set(), false);
  const closed = tree.marqueeTicks(closedRows.filter((r) => r.path === "lab1"), false, new Set(), index, false);
  assert.equal(tree.checkState("lab1", "folder", closed, index, false), "checked");
});

test("tabs: what another tab changed, as the terminal and the drawer apply it", () => {
  const { diffViews } = storeSync;
  const E = drives.driveRoot(ID1), F = drives.driveRoot(ID2);
  const file = (key, data) => ({ key, meta: "m" + key, data });
  const before = {
    files: { "a.asm": file("k1", "A"), "lab/b.asm": file("k2", "B"), "old.asm": file("k3", "C"), [E + "/e.asm"]: file("k4", "E"), [F + "/f.asm"]: file("k5", "F") },
    folders: ["lab", "gone", "gone/deep", E + "/x", F + "/y"],
    drives: [{ id: ID1, label: "alice", letter: "e", createdAt: 1 }, { id: ID2, label: "bob", letter: "f", createdAt: 1 }],
  };
  const after = {
    files: { "a.asm": file("k1", "A2"), "lab/b.asm": file("k2", "B"), "new/old.asm": file("k3", "C"), [E + "/e.asm"]: file("k4", "E"), "n.asm": file("k6", "N") },
    folders: ["lab", "new", E + "/x"],
    drives: [{ id: ID1, label: "alice2", letter: "e", createdAt: 1 }],
  };
  const delta = diffViews(before, after);
  assert.deepEqual(delta.drivesRemoved.map((drive) => drive.id), [ID2]);
  assert.deepEqual(delta.drivesMapped.map((drive) => drive.label), ["alice2"]);
  // bob's file and folder go with bob
  assert.deepEqual(delta.filesDeleted, ["old.asm"]);
  assert.deepEqual(delta.filesWritten.sort(), ["a.asm", "n.asm", "new/old.asm"]);
  assert.deepEqual(delta.foldersRemoved, ["gone/deep", "gone"]);
  assert.deepEqual(delta.foldersMade, ["new"]);
  assert.deepEqual(delta.moved, { "old.asm": "new/old.asm" });
  assert.equal(delta.changed, true);
  assert.equal(diffViews(after, after).changed, false);
});
