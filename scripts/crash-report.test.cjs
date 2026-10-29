const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// The crash notice's instruction check (src/js/components/main/crash/*.ts, compiled with the
// app's tsconfig options except the module format) with the decoder the page loads
// (src/js/boxedwine/iced_x86.js + src/wasm/iced_x86_bg.wasm, Boxedwine/decoder-src/build-iced.sh).
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
const CRASH = path.resolve(__dirname, "../src/js/components/main/crash");
const { classifyInvalidOpcode, EMULATED_FEATURES, hexBytes } = load(path.join(CRASH, "invalidOpcode.ts"));
const { invalidOpcodeIssue, emulatorCrashIssue, ISSUES_URL } = load(path.join(CRASH, "bugReport.ts"));

// the classic script as the page runs it: a global `wasm_bindgen`, initialised with the wasm
const context = vm.createContext({ TextDecoder, TextEncoder, WebAssembly, BigInt });
vm.runInContext(fs.readFileSync(path.resolve(__dirname, "../src/js/boxedwine/iced_x86.js"), "utf8") + "\n;globalThis.__iced = wasm_bindgen;", context);
const iced = context.__iced;
iced.initSync(fs.readFileSync(path.resolve(__dirname, "../src/wasm/iced_x86_bg.wasm")));

// 15 bytes at the address, as the emulator reports them (the rest is what followed)
const at = (hex) => (hex + "90".repeat(15)).slice(0, 30);
const classify = (hex) => classifyInvalidOpcode(iced, 0x401000, at(hex));

test("every feature of the emulated CPU is an iced CpuidFeature", () => {
  for (const f of EMULATED_FEATURES) assert.equal(typeof iced.CpuidFeature[f], "number", f);
});

test("bytes that are not an instruction are data", () => {
  assert.deepEqual(classify("ffff"), { kind: "data", bytes: "FF FF 90 90" });
  assert.equal(classify("f001d8").kind, "data"); // lock add eax,ebx: LOCK on a register destination
  assert.equal(classify("0f05").kind, "missing-feature"); // syscall (AMD), not data
});

test("UD0, UD1 and UD2 always raise the exception", () => {
  assert.deepEqual(classify("0f0b"), { kind: "undefined", text: "ud2", bytes: "0F 0B" });
  assert.equal(classify("0fb9c0").kind, "undefined");
});

test("an extension the Pentium 4 does not have is named", () => {
  assert.deepEqual(classify("f20f7cc1"), { kind: "missing-feature", text: "haddps xmm0,xmm1", bytes: "F2 0F 7C C1", features: ["SSE3"] });
  assert.deepEqual(classify("c5f058c2").features, ["AVX"]);
  assert.deepEqual(classify("f30fb8c1").features, ["POPCNT"]);
  assert.deepEqual(classify("0f34").features, ["SEP"]); // sysenter: the emulated CPUID has no SEP
});

test("an instruction the Pentium 4 runs is an emulator bug", () => {
  assert.deepEqual(classify("0f02c3"), { kind: "emulator-bug", text: "lar eax,ebx", bytes: "0F 02 C3", features: ["INTEL386"] });
  assert.deepEqual(classify("660fd4c1"), { kind: "emulator-bug", text: "paddq xmm0,xmm1", bytes: "66 0F D4 C1", features: ["SSE2"] });
  assert.equal(classify("0f44c1").kind, "emulator-bug"); // cmove eax,ecx
  assert.equal(classify("0f1f00").kind, "emulator-bug"); // nop dword ptr [eax] (Pentium Pro)
  assert.equal(classify("0f31").kind, "emulator-bug"); // rdtsc
});

test("hex parsing", () => {
  assert.deepEqual(Array.from(hexBytes("0f0bFF")), [0x0f, 0x0b, 0xff]);
});

test("issue links: prefilled, readable and short enough for GitHub", () => {
  const found = classify("0f02c3");
  const url = invalidOpcodeIssue(found, "00401000", { build: "dcd7e9914ada84e6", runtime: "st" }, "lab1/テスト.asm");
  assert.ok(url.startsWith(ISSUES_URL + "?labels=bug&title="));
  const params = new URL(url).searchParams;
  assert.equal(params.get("title"), "Emulator: lar eax,ebx stops a program with an illegal instruction");
  const body = params.get("body");
  assert.match(body, /`lar eax,ebx` \(bytes `0F 02 C3`, CPU feature INTEL386\)/);
  assert.match(body, /Address: 00401000/);
  assert.match(body, /Emulator build: dcd7e9914ada84e6 \(single-threaded\)/);
  assert.match(body, /File open in the editor: lab1\/テスト\.asm/);
  const crash = emulatorCrashIssue({ message: "RuntimeError: null function or function signature mismatch", stack: "x".repeat(5000), build: "b", runtime: "mt" }, "");
  const crashParams = new URL(crash).searchParams;
  assert.equal(crashParams.get("title"), "Emulator crash: RuntimeError: null function or function signature mismatch");
  assert.match(crashParams.get("body"), /\(multi-threaded\)/);
  assert.doesNotMatch(crashParams.get("body"), /File open in the editor/);
  assert.ok(crash.length < 8000, "url length " + crash.length);
});
