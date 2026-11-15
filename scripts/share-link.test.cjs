const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const configPath = path.resolve(__dirname, "../tsconfig.json");
const { options } = ts.convertCompilerOptionsFromJson(
  ts.readConfigFile(configPath, ts.sys.readFile).config.compilerOptions,
  path.dirname(configPath),
);
options.module = ts.ModuleKind.CommonJS;
delete options.outDir;
const loaded = new Map();
function load(file) {
  if (loaded.has(file)) return loaded.get(file).exports;
  const module = { exports: {} };
  loaded.set(file, module);
  const { outputText } = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: options,
    fileName: file,
  });
  const localRequire = (spec) => {
    if (!spec.startsWith(".")) return require(spec);
    const base = path.resolve(path.dirname(file), spec);
    return load(
      [base, base + ".ts", base + ".js"].find(
        (f) => fs.existsSync(f) && fs.statSync(f).isFile(),
      ),
    );
  };
  new Function("exports", "require", "module", outputText)(
    module.exports,
    localRequire,
    module,
  );
  return module.exports;
}
const MAIN = path.resolve(__dirname, "../src/js/components/main");
const share = load(path.join(MAIN, "utility/share/shareLink.ts"));
const brotliCodec = load(path.join(MAIN, "utility/share/brotli.js"));
const zlib = require("node:zlib");
const drives = load(path.join(MAIN, "utility/filesystem/drives.ts"));

const u8 = (s) => new Uint8Array(Buffer.from(s, "utf8"));
const CRLF = String.fromCharCode(13, 10);
const BASE = "https://masm.isas.dev/";
const content = (files, extra = {}) => ({
  name: "alice",
  open: "",
  folders: [],
  files,
  ...extra,
});
const file = (p, bytes) => ({
  path: p,
  bytes: typeof bytes === "string" ? u8(bytes) : bytes,
});

test("a link carries every byte, and the same files give the same link", async () => {
  const utf16 = new Uint8Array([
    0xff, 0xfe, 0x41, 0x00, 0x0d, 0x00, 0x0a, 0x00, 0x42, 0x00,
  ]);
  const cp1252 = new Uint8Array([
    0x43, 0x61, 0x66, 0xe9, 0x0d, 0x0a, 0x93, 0x71, 0x94,
  ]);
  const original = content(
    [
      file("lab3/main.asm", "INCLUDE Irvine32.inc" + CRLF + ".code" + CRLF),
      file("lab3/latin.txt", cp1252),
      file("wide.txt", utf16),
      file("empty.inc", ""),
    ],
    { open: "lab3/main.asm", folders: ["lab3/empty", "日本"] },
  );
  const link = await share.makeLink(BASE, original);
  assert.ok(link.startsWith(BASE + "#share="));
  assert.equal(await share.makeLink(BASE, original), link);
  const back = await share.readLink(link);
  assert.equal(back.problem, undefined);
  assert.equal(back.value.name, "alice");
  assert.equal(back.value.open, "lab3/main.asm");
  assert.deepEqual(back.value.folders, ["lab3/empty", "日本"]);
  assert.deepEqual(
    back.value.files.map((f) => f.path),
    original.files.map((f) => f.path),
  );
  back.value.files.forEach((f, i) =>
    assert.deepEqual(f.bytes, original.files[i].bytes, f.path),
  );
  // white space (a link broken over lines) is removed; the part from "#share=" on is enough
  const data = link.slice(link.indexOf("#"));
  const broken = data.slice(0, 20) + CRLF + "  " + data.slice(20);
  assert.equal((await share.readLink(broken)).problem, undefined);
  assert.equal(
    (await share.readLink("http://localhost:3000/index.html" + data)).problem,
    undefined,
  );
});

test("damaged, oversized and foreign links are refused with their reason", async () => {
  const good = await share.makeLink(
    BASE,
    content([file("a.asm", "mov eax, 1" + CRLF)]),
  );
  const data = good.slice(good.indexOf("=") + 1);
  // a compression bomb: 65 MiB of zeros unpacks past the 64 MiB limit, stopped while streaming
  const bomb = await share.makeLink(
    BASE,
    content([file("big.txt", new Uint8Array(65 * 1024 * 1024))]),
  );
  assert.ok(bomb.length < 100000, "the bomb is small: " + bomb.length);
  assert.match((await share.readLink(bomb)).problem, /more than 64 MiB/);
  // one character changed in the middle of the data
  const mid = Math.floor(data.length / 2);
  const changed =
    BASE +
    "#share=" +
    data.slice(0, mid) +
    (data[mid] === "A" ? "B" : "A") +
    data.slice(mid + 1);
  assert.ok((await share.readLink(changed)).problem);
  // cut off
  assert.match(
    (
      await share.readLink(
        BASE + "#share=" + data.slice(0, Math.floor(data.length / 2)),
      )
    ).problem,
    /damaged|cut off|characters/,
  );
  // characters a link cannot have
  assert.match(
    (await share.readLink(BASE + "#share=abc$def")).problem,
    /not a share link/,
  );
  assert.match(
    (await share.readLink("hello world")).problem,
    /not a share link/,
  );
  assert.match((await share.readLink("")).problem, /empty/);
  // longer than the longest link a browser opens
  assert.match(
    share.linkData("#share=" + "A".repeat(share.MAX_LINK_TEXT)).problem,
    /longer than 2,097,152/,
  );
  assert.equal(
    share.linkData(
      ("#share=" + "A".repeat(share.MAX_LINK_TEXT)).slice(
        0,
        share.MAX_LINK_TEXT,
      ),
    ).problem,
    undefined,
  );
  // the container: a newer version, trailing bytes, invalid UTF-8, too many entries
  const packed = share.encodeContainer(content([file("a.asm", "x")]));
  const newer = packed.slice();
  newer[1] = 2;
  assert.match(share.decodeContainer(newer).problem, /newer version/);
  assert.match(
    share.decodeContainer(new Uint8Array([0x50, 1, 0, 0, 0, 0])).problem,
    /not a share link/,
  );
  const trailing = new Uint8Array(packed.length + 1);
  trailing.set(packed);
  assert.match(share.decodeContainer(trailing).problem, /damaged/);
  assert.match(
    share.decodeContainer(packed.slice(0, packed.length - 1)).problem,
    /damaged/,
  );
  assert.match(
    share.decodeContainer(new Uint8Array([0x4d, 1, 1, 0xff, 0, 0, 0])).problem,
    /damaged/,
  );
  const many = await share.makeLink(
    BASE,
    content(
      Array.from({ length: 2001 }, (_, i) => file("f" + i + ".txt", "x")),
    ),
  );
  assert.match((await share.readLink(many)).problem, /more than 2000 entries/);
  const junk =
    BASE + "#share=" + share.toBase64Url(await share.deflate(trailing));
  assert.match((await share.readLink(junk)).problem, /damaged/);
});

// a zlib or Brotli stream of `total` zero bytes, made without holding them (a compression bomb)
const bombOf = (make, total) =>
  new Promise((resolve, reject) => {
    const stream = make(), parts = [];
    stream.on("data", (b) => parts.push(b));
    stream.on("end", () => resolve(new Uint8Array(Buffer.concat(parts))));
    stream.on("error", reject);
    const zeros = Buffer.alloc(1 << 20);
    let left = total;
    const write = () => {
      while (left > 0) {
        left -= zeros.length;
        if (!stream.write(zeros)) return stream.once("drain", write);
      }
      stream.end();
    };
    write();
  });
const v1Link = async (c) => share.shareUrl(BASE, share.toBase64Url(await share.deflate(share.encodeContainer(c))));
const v2Of = (brotliBytes) => {
  const outer = new Uint8Array(2 + brotliBytes.length);
  outer[0] = 0x4d;
  outer[1] = 2;
  outer.set(brotliBytes, 2);
  return share.shareUrl(BASE, share.toBase64Url(share.zlibStored(outer)));
};
// the previous release's reader: inflate (8 MiB) and the container of version 1
const previousReadLink = async (text) => {
  const data = share.linkData(text);
  const raw = await share.inflate(share.fromBase64Url(data.value), 8 * 1024 * 1024);
  return raw.problem ? raw : share.decodeContainer(raw.value);
};

test("version-2 links: Brotli in stored blocks, older links still read, older readers say a newer version made it", async () => {
  // the wrapper is a plain zlib stream: Node's zlib reads it, for every block count
  for (const n of [0, 1, 65535, 65536, 200000]) {
    const bytes = new Uint8Array(n).map((_, i) => (i * 31 + 7) & 255);
    const stored = share.zlibStored(bytes);
    assert.equal(stored.length, 2 + 5 * Math.max(1, Math.ceil(n / 65535)) + n + 4);
    assert.deepEqual(new Uint8Array(zlib.inflateSync(stored)), bytes, n + " bytes");
    assert.deepEqual((await share.inflate(stored)).value, bytes);
  }
  const c = content([file("lab/main.asm", "INCLUDE Irvine32.inc" + CRLF + "main PROC" + CRLF), file("lab/data.bin", new Uint8Array(256).map((_, i) => i))], { open: "lab/main.asm" });
  const link = await share.makeLink(BASE, c);
  const raw = (await share.inflate(share.fromBase64Url(link.slice(link.indexOf("=") + 1)))).value;
  assert.deepEqual([raw[0], raw[1]], [0x4d, 2]);
  assert.deepEqual(new Uint8Array(zlib.brotliDecompressSync(raw.subarray(2))), share.encodeContainer(c));
  // a version-1 link (deflate, as the previous release made it) reads as before
  const old = await share.readLink(await v1Link(c));
  assert.equal(old.problem, undefined);
  old.value.files.forEach((f, i) => assert.deepEqual(f.bytes, c.files[i].bytes));
  // the previous release, given a version-2 link
  assert.match((await previousReadLink(link)).problem, /made by a newer version of the app/);
  // shorter than deflate: snake.asm
  const snake = content([file("snake/snake.asm", fs.readFileSync(path.resolve(__dirname, "../Boxedwine/harness/stress/snake.asm")))]);
  const v2 = await share.makeLink(BASE, snake), v1 = await v1Link(snake);
  assert.ok(v2.length <= 5600 && v2.length < v1.length * 0.9, "v2 " + v2.length + ", v1 " + v1.length);
  // the module's decoder gives the same bytes as the browser's, and refuses what it does
  const brotliBytes = new Uint8Array(zlib.brotliCompressSync(share.encodeContainer(snake)));
  assert.deepEqual(await brotliCodec.decompressBrotli(brotliBytes, 1 << 20, true), share.encodeContainer(snake));
  await assert.rejects(brotliCodec.decompressBrotli(brotliBytes.subarray(0, brotliBytes.length >> 1), 1 << 20, true));
  const trailing = new Uint8Array(brotliBytes.length + 3);
  trailing.set(brotliBytes);
  await assert.rejects(brotliCodec.decompressBrotli(trailing, 1 << 20, true));
  assert.equal(await brotliCodec.decompressBrotli(brotliBytes, 1000, true), null);
  // a link of maxLength stops before compressing everything that cannot fit
  const random = content([file("r.bin", new Uint8Array(require("node:crypto").randomBytes(400000)))]);
  assert.equal(await share.makeLink(BASE, random, 100000), null);
  assert.ok((await share.makeLink(BASE, random, 2000000)).length <= 2000000);
});

test("bombs, a wrapper longer than its link and a cut Brotli stream are refused before 64 MiB", async () => {
  const GiB = 1024 * 1024 * 1024;
  // a version-2 link whose Brotli stream unpacks to 1 GiB, through both decoders
  const brotliBomb = await bombOf(() => zlib.createBrotliCompress({ params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 1 } }), GiB);
  assert.match((await share.readLink(v2Of(brotliBomb))).problem, /more than 64 MiB/);
  assert.equal(await brotliCodec.decompressBrotli(brotliBomb, share.MAX_CONTAINER, true), null);
  // a version-1 link whose deflate stream unpacks to 1 GiB
  const deflateBomb = await bombOf(() => zlib.createDeflate({ level: 9 }), GiB);
  const v1Bomb = share.shareUrl(BASE, share.toBase64Url(deflateBomb));
  assert.ok(v1Bomb.length <= share.MAX_LINK_TEXT, "the bomb fits a link: " + v1Bomb.length);
  assert.match((await share.readLink(v1Bomb)).problem, /more than 64 MiB/);
  // version 2 compressed instead of stored: longer than its own link, so damaged
  const fat = new Uint8Array(2 + 300000);
  fat[0] = 0x4d;
  fat[1] = 2;
  const fatLink = share.shareUrl(BASE, share.toBase64Url(await share.deflate(fat)));
  assert.match((await share.readLink(fatLink)).problem, /damaged/);
  // the Brotli stream cut in half inside a valid wrapper
  const good = new Uint8Array(zlib.brotliCompressSync(share.encodeContainer(content([file("a.asm", "mov eax, 1".repeat(500))]))));
  assert.match((await share.readLink(v2Of(good.subarray(0, good.length >> 1)))).problem, /damaged or cut off/);
  // a Brotli stream of something that is not a version-1 container
  assert.match((await share.readLink(v2Of(new Uint8Array(zlib.brotliCompressSync(Buffer.from("hello")))))).problem, /not a share link/);
});

test("an import refuses hostile names and keeps every other entry, whatever it holds", () => {
  const mz = new Uint8Array(512);
  mz.set([0x4d, 0x5a, 0x90, 0x00, 0x03]);
  const checked = share.checkLink(
    content(
      [
        file("../escape.asm", "x"),
        file("C:/files/assemble.bat", "@echo off"),
        file("readme\u202etxt.asm", "x"),
        file("CON.asm", "x"),
        file("tool.asm", mz),
        file("run.bat", "del *.*"),
        file("Main.asm", "a"),
        file("main.asm", "b"),
        file("ok.asm", "mov eax, 1"),
      ],
      { open: "../escape.asm", folders: ["..", "empty"] },
    ),
  );
  assert.deepEqual(
    checked.files.map((f) => f.path),
    ["tool.asm", "run.bat", "ok.asm"],
  );
  assert.deepEqual(checked.files[0].bytes, mz);
  assert.deepEqual(checked.folders, ["empty"]);
  assert.equal(checked.open, "ok.asm");
  const reasons = Object.fromEntries(
    checked.skipped.map((s) => [s.name, s.reason]),
  );
  assert.match(reasons["../escape.asm"], /outside/);
  assert.match(reasons["C:/files/assemble.bat"], /absolute/);
  assert.match(reasons["readme\u202etxt.asm"], /invisible/);
  assert.match(reasons["CON.asm"], /reserved/);
  assert.match(reasons["Main.asm"], /letter case/);
  assert.match(reasons["main.asm"], /letter case/);
  assert.match(reasons["../"], /outside/);
  assert.equal(checked.skipped.length, 7);
  assert.equal(checked.bytes, 512 + "del *.*".length + "mov eax, 1".length);
  // a name used as a file and as a folder: both refused (which one was meant cannot be known)
  const clash = share.checkLink(
    content(
      [
        file("lab", "a file named lab"),
        file("lab/x.asm", "x"),
        file("a.asm", "x"),
        file("keep.asm", "x"),
      ],
      { folders: ["a.asm/sub", "LAB/deeper"] },
    ),
  );
  assert.deepEqual(
    clash.files.map((f) => f.path),
    ["keep.asm"],
  );
  assert.deepEqual(clash.folders, []);
  assert.deepEqual(clash.skipped.map((s) => s.name).sort(), [
    "LAB/deeper/",
    "a.asm",
    "a.asm/sub/",
    "lab",
    "lab/x.asm",
  ]);
  const bidi = share.checkLink(
    content([
      file("trojan.asm", "; \u202e comment"),
      file("plain.asm", "mov eax, 1"),
    ]),
  );
  assert.deepEqual(bidi.warnings, ["trojan.asm"]);
});

test("every file type travels byte for byte: binary, batch, no extension, text, build outputs", async () => {
  const bin = new Uint8Array(256).map((_, i) => i);
  const exe = new Uint8Array(1024).map((_, i) => (i * 7) & 255);
  exe.set([0x4d, 0x5a]);
  const kit = {
    "kit/data.bin": bin,
    "kit/build.bat": u8(
      "@echo off" + CRLF + "call C:\\files\\assemble prog" + CRLF,
    ),
    "kit/README": u8("no extension" + CRLF),
    "kit/notes.txt": u8("notes" + CRLF),
    "kit/bin/prog.exe": exe,
  };
  const plan = share.planShare(
    { files: [], folders: ["kit"] },
    Object.keys(kit),
    ["kit", "kit/bin"],
    (p) => kit[p],
    "alice",
    "",
  );
  assert.equal(plan.problem, null);
  assert.deepEqual(plan.left, []);
  const read = await share.readLink(await share.makeLink(BASE, plan.content));
  const checked = share.checkLink(read.value);
  assert.deepEqual(checked.skipped, []);
  assert.deepEqual(
    checked.files.map((f) => f.path).sort(),
    Object.keys(kit).sort(),
  );
  for (const f of checked.files) assert.deepEqual(f.bytes, kit[f.path], f.path);
});

test("Keep Both: <name>-imported-<YYYYMMDD>-<HHMMSS>-<xxxx><ext>, within the name and path limits", () => {
  const now = new Date(2026, 10, 14, 9, 5, 7);
  assert.equal(
    share.keepBothName("lab3/main.asm", now, "k7q2"),
    "lab3/main-imported-20261114-090507-k7q2.asm",
  );
  assert.equal(
    share.keepBothName("README", now, "ab12"),
    "README-imported-20261114-090507-ab12",
  );
  assert.equal(
    share.keepBothName(".config", now, "ab12"),
    ".config-imported-20261114-090507-ab12",
  );
  const long = share.keepBothName("x".repeat(250) + ".asm", now, "k7q2");
  assert.ok(
    Buffer.byteLength(long) <= 255 &&
      long.endsWith("-imported-20261114-090507-k7q2.asm"),
    long,
  );
  const wide = share.keepBothName(
    "\u{1F680}".repeat(100) + ".inc",
    now,
    "k7q2",
  );
  assert.ok(
    Buffer.byteLength(wide) <= 255 && !/[\ud800-\udbff]-imported/.test(wide),
    wide,
  );
  const deep = share.keepBothName(
    "d".repeat(200) + "/" + "f".repeat(40) + ".asm",
    now,
    "k7q2",
  );
  assert.ok(
    3 + deep.length <= 259 && deep.startsWith("d".repeat(200) + "/f"),
    deep.length,
  );
  assert.deepEqual(share.mergeStep({ all: null }, "keepBoth"), {
    replace: false,
    keepBoth: true,
    stop: false,
    state: { all: null },
  });
  assert.deepEqual(share.mergeStep({ all: "no" }, null), {
    replace: false,
    stop: false,
    state: { all: "no" },
  });
});

test("the base route: the page's path without index.html", () => {
  assert.equal(share.baseRoute("/"), "/");
  assert.equal(share.baseRoute("/index.html"), "/");
  assert.equal(share.baseRoute("/app/INDEX.HTML"), "/app/");
  assert.equal(share.baseRoute("/guide/"), "/guide/");
});

test("a share takes every file of one drive and checks what the programs include", () => {
  const E = "drive:0123456789abcdef";
  const main =
    "INCLUDE Irvine32.inc" +
    CRLF +
    "INCLUDE D:\\lab3\\macros.inc ; the macros" +
    CRLF +
    "INCLUDE \\common\\io.inc" +
    CRLF +
    "include <missing.inc>" +
    CRLF +
    "INCLUDELIB mylib.lib" +
    CRLF +
    "INCLUDELIB kernel32.lib" +
    CRLF +
    ".code" +
    CRLF;
  const drawer = {
    "lab3/main.asm": u8(main),
    "lab3/macros.inc": u8("PrintIt MACRO" + CRLF + "ENDM" + CRLF),
    "common/io.inc": u8("; io" + CRLF),
    "lab3/bin/main.exe": (() => {
      const b = new Uint8Array(64);
      b.set([0x4d, 0x5a, 0, 0]);
      return b;
    })(),
    "lab3/run.bat": u8("@echo off"),
    "lab3/mylib.lib": (() => {
      const b = new Uint8Array(64);
      b.set([0x21, 0x3c, 0x61, 0x72, 0x63, 0x68, 0x3e, 0x0a, 0, 0, 1]);
      return b;
    })(),
    [E + "/other.asm"]: u8("x"),
  };
  const allFiles = Object.keys(drawer),
    allFolders = ["lab3", "lab3/bin", "lab3/empty", "common"];
  const read = (p) => drawer[p];
  const plan = share.planShare(
    { files: [], folders: ["lab3"] },
    allFiles,
    allFolders,
    read,
    "alice",
    "lab3/main.asm",
  );
  assert.equal(plan.problem, null);
  assert.equal(plan.root, "");
  assert.deepEqual(
    plan.content.files.map((f) => f.path),
    [
      "lab3/bin/main.exe",
      "lab3/macros.inc",
      "lab3/main.asm",
      "lab3/mylib.lib",
      "lab3/run.bat",
    ],
  );
  assert.deepEqual(plan.content.folders, ["lab3/empty"]);
  assert.equal(plan.content.open, "lab3/main.asm");
  assert.deepEqual(plan.left, []);
  const driveFiles = allFiles.filter((p) => !p.startsWith("drive:"));
  const findings = share.checkIncludes(plan.content, driveFiles, "D");
  assert.deepEqual(
    findings.map((f) => [f.argument, f.kind, f.target]),
    [
      ["Irvine32.inc", "toolchain", ""],
      ["D:\\lab3\\macros.inc", "letter", "lab3/macros.inc"],
      ["\\common\\io.inc", "outside", "common/io.inc"],
      ["missing.inc", "missing", ""],
      ["mylib.lib", "shared", "lab3/mylib.lib"],
      ["kernel32.lib", "toolchain", ""],
    ],
  );
  const copy = share.dropLetters(plan.content, findings);
  const after = Buffer.from(copy.files[2].bytes).toString("latin1");
  assert.equal(
    after,
    main.replace("D:\\lab3\\macros.inc", "\\lab3\\macros.inc"),
  );
  assert.deepEqual(copy.files[1].bytes, plan.content.files[1].bytes);
  // a binary .asm is never read for INCLUDE lines; a .lib not shared is a file left out, as any other
  const binary = new Uint8Array(64);
  binary.set(u8("INCLUDE x.inc"), 8);
  assert.deepEqual(
    share.checkIncludes(
      { name: "", open: "", folders: [], files: [file("b.asm", binary)] },
      ["b.asm", "x.inc"],
      "D",
    ),
    [],
  );
  assert.deepEqual(
    share
      .checkIncludes(
        {
          name: "",
          open: "",
          folders: [],
          files: [file("a.asm", "INCLUDELIB my.lib" + CRLF)],
        },
        ["a.asm", "my.lib"],
        "D",
      )
      .map((f) => f.kind),
    ["outside"],
  );
  assert.deepEqual(
    drawer["lab3/main.asm"],
    u8(main),
    "the sender's own file is unchanged",
  );
  assert.match(
    share.planShare(
      { files: ["lab3/main.asm", E + "/other.asm"], folders: [] },
      allFiles,
      allFolders,
      read,
      "alice",
      "",
    ).problem,
    /one drive at a time/,
  );
  assert.match(
    share.planShare(
      { files: [], folders: [] },
      allFiles,
      allFolders,
      read,
      "alice",
      "",
    ).problem,
    /Nothing/,
  );
  const onE = share.planShare(
    { files: [E + "/other.asm"], folders: [] },
    allFiles,
    allFolders,
    read,
    "alice",
    "",
  );
  assert.equal(onE.root, E);
  assert.deepEqual(
    onE.content.files.map((f) => f.path),
    ["other.asm"],
  );
  assert.equal(onE.content.open, "other.asm");
  // a relative include beside the includer comes before the toolchain's copy
  const shadow = share.checkIncludes(
    {
      name: "",
      open: "",
      folders: [],
      files: [file("a/x.asm", "INCLUDE Irvine32.inc" + CRLF)],
    },
    ["a/x.asm", "a/Irvine32.inc"],
    "D",
  );
  assert.deepEqual(
    shadow.map((f) => [f.kind, f.target]),
    [["outside", "a/Irvine32.inc"]],
  );
});

test("an import compares with a drive of the same label, and Merge asks as Windows does", () => {
  const drive = { "lab3/main.asm": u8("old"), "old.txt": u8("keep") };
  const link = share.checkLink(
    content([
      file("lab3/MAIN.asm", "new"),
      file("lab3/util.inc", "u"),
      file("old.txt", "keep"),
    ]),
  );
  const cmp = share.compareWithDrive(link, Object.keys(drive), (p) => drive[p]);
  assert.deepEqual(cmp.added, ["lab3/util.inc"]);
  assert.deepEqual(cmp.changed, [
    {
      path: "lab3/MAIN.asm",
      existing: "lab3/main.asm",
      existingSize: 3,
      incomingSize: 3,
    },
  ]);
  assert.deepEqual(cmp.same, ["old.txt"]);
  assert.deepEqual(cmp.driveOnly, []);
  const withExtra = share.compareWithDrive(
    link,
    Object.keys(drive).concat(["notes/extra.txt"]),
    (p) => drive[p] || u8("e"),
  );
  assert.deepEqual(withExtra.driveOnly, ["notes/extra.txt"]);
  const run = (answers, count) => {
    let state = { all: null };
    const out = [];
    for (let i = 0; i < count; i++) {
      const step = share.mergeStep(state, state.all ? null : answers.shift());
      if (step.stop) {
        out.push("stop");
        break;
      }
      out.push(step.replace ? "replace" : "skip");
      state = step.state;
    }
    return out;
  };
  assert.deepEqual(run(["yes", "no", "yes"], 3), [
    "replace",
    "skip",
    "replace",
  ]);
  assert.deepEqual(run(["no", "yesAll"], 4), [
    "skip",
    "replace",
    "replace",
    "replace",
  ]);
  assert.deepEqual(run(["noAll"], 3), ["skip", "skip", "skip"]);
  assert.deepEqual(run(["yes", "cancel", "yes"], 3), ["replace", "stop"]);
});

test("link lists split at new lines and commas, and link lengths are placed", () => {
  assert.deepEqual(share.splitLinks("a" + CRLF + "b,c\n\n \"d\" ,a, 'e'\r"), [
    "a",
    "b",
    "c",
    "d",
    "e",
  ]);
  assert.deepEqual(share.splitLinks(""), []);
  assert.equal(share.reachOf(2000), "chat");
  assert.equal(share.reachOf(2001), "email");
  assert.equal(share.reachOf(32768), "email");
  assert.equal(share.reachOf(32769), "browser");
  assert.equal(share.reachOf(1000000), "browser");
  assert.equal(share.reachOf(1000001), "notFirefox");
  assert.equal(share.reachOf(2000000), "notFirefox");
  assert.equal(share.reachOf(2000001), "none");
});

test("the unpacked size is known before a link is made, and a link of 9 MiB of zeros imports", async () => {
  const many = Array.from({ length: 300 }, (_, i) =>
    file("d" + (i % 7) + "/f" + i + ".bin", new Uint8Array(i * 37)),
  );
  for (const c of [
    content([]),
    content([file("a.asm", "x")], { name: "", open: "a.asm" }),
    content([file("日本/ü.txt", "é")], { folders: ["e/" + "x".repeat(200)] }),
    content(many, { folders: Array.from({ length: 150 }, (_, i) => "empty" + i) }),
    content([file("big.bin", new Uint8Array(3 * 1024 * 1024))]),
  ])
    assert.equal(share.containerSize(c), share.encodeContainer(c).length);
  // what the share window refuses: past the 64 MiB an import takes (the zip import's limit)
  assert.equal(share.MAX_CONTAINER, 64 * 1024 * 1024);
  const over = content([file("bin/data.bin", new Uint8Array(65 * 1024 * 1024))]);
  assert.ok(share.containerSize(over) > share.MAX_CONTAINER);
  const nine = content([file("bin/data.bin", new Uint8Array(9 * 1024 * 1024))]);
  assert.ok(share.containerSize(nine) <= share.MAX_CONTAINER);
  const back = await share.readLink(await share.makeLink(BASE, nine));
  assert.equal(back.problem, undefined);
  assert.equal(back.value.files[0].bytes.length, 9 * 1024 * 1024);
});

test("workspace names: <adjective>-<animal>, valid labels", () => {
  const { adjectives, animals } = share.WORD_LISTS;
  for (const list of [adjectives, animals]) {
    assert.equal(list.length, 64);
    assert.equal(new Set(list).size, 64);
    for (const word of list) assert.match(word, /^[a-z]{2,10}$/);
  }
  for (let i = 0; i < 300; i++) {
    const name = share.workspaceNameFrom(
      new Uint8Array(
        Array.from({ length: 2 }, () => Math.floor(Math.random() * 256)),
      ),
    );
    assert.match(name, /^[a-z]+-[a-z]+$/);
    assert.equal(drives.labelProblem(name), null, name);
  }
  assert.equal(share.workspaceNameFrom(new Uint8Array([0, 0])), "agile-badger");
  assert.equal(
    share.workspaceNameFrom(new Uint8Array([63, 63])),
    "witty-zebra",
  );
});
