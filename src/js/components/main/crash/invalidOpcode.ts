// What an illegal-instruction crash was: the bytes at the faulting address (the emulator keeps
// the last invalid-opcode faults, Module.bwInvalidOpcodes) decoded by iced-x86 (x86Decoder.ts).

// The emulated CPU is a Pentium 4 (Boxedwine's CPUID: FPU, TSC, MSR, CX8, CMOV, CLFSH, MMX,
// FXSR, SSE, SSE2). These are the iced CpuidFeature names of everything such a CPU runs in
// 32-bit protected mode; FSETPM (FPU287) is a no-op there, RDPMC and the multi-byte NOPs date
// from the Pentium Pro.
export const EMULATED_CPU = "a Pentium 4 with MMX, SSE and SSE2";
export const EMULATED_FEATURES = [
  "INTEL8086", "INTEL186", "INTEL286", "INTEL386", "INTEL486", "FPU", "FPU287", "FPU387", "CPUID",
  "CX8", "CMOV", "TSC", "MSR", "RDPMC", "MMX", "FXSR", "SSE", "SSE2", "CLFSH", "PAUSE", "MULTIBYTENOP",
];

export type InvalidOpcode =
  // not an instruction: execution ran into data
  | { kind: "data"; bytes: string }
  // UD0, UD1 or UD2, which always raise the invalid-opcode exception
  | { kind: "undefined"; text: string; bytes: string }
  // an instruction of an extension the emulated CPU does not have
  | { kind: "missing-feature"; text: string; bytes: string; features: string[] }
  // an instruction the emulated CPU should have run
  | { kind: "emulator-bug"; text: string; bytes: string; features: string[] };

export function hexBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.floor(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

const spaced = (bytes: Uint8Array) => Array.from(bytes, (b) => ("0" + b.toString(16).toUpperCase()).slice(-2)).join(" ");

// iced: the iced-x86 namespace; hex: the bytes at the address, two hex digits each
export function classifyInvalidOpcode(iced: any, address: number, hex: string): InvalidOpcode {
  const data = hexBytes(hex);
  const decoder = new iced.Decoder(32, data, iced.DecoderOptions.None);
  if (typeof BigInt === "function") decoder.ip = BigInt(address >>> 0); // branch targets in the text
  const instr = decoder.decode();
  try {
    if (decoder.lastError !== iced.DecoderError.None) return { kind: "data", bytes: spaced(data.subarray(0, 4)) };
    const bytes = spaced(data.subarray(0, instr.length));
    const formatter = new iced.Formatter(iced.FormatterSyntax.Masm);
    const text = formatter.format(instr);
    formatter.free();
    const mnemonic = iced.Mnemonic[instr.mnemonic];
    if (mnemonic === "Ud0" || mnemonic === "Ud1" || mnemonic === "Ud2") return { kind: "undefined", text, bytes };
    const features = Array.from(instr.cpuidFeatures() as Int32Array, (f) => String(iced.CpuidFeature[f]));
    const missing = features.filter((f) => EMULATED_FEATURES.indexOf(f) < 0);
    if (missing.length) return { kind: "missing-feature", text, bytes, features: missing };
    return { kind: "emulator-bug", text, bytes, features };
  } finally {
    instr.free();
    decoder.free();
  }
}
