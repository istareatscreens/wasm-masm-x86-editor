// Exceptions, caught where Windows hands them to the program. Wine 6.0 delivers every one, the processor's and
// RaiseException's alike, to ntdll!KiUserExceptionDispatcher with [ESP] the EXCEPTION_RECORD's address and
// [ESP+4] the CONTEXT's; one nobody handles reaches kernelbase!UnhandledExceptionFilter(EXCEPTION_POINTERS *).
import { CONTEXT_SIZE, ContextRecord } from "../engine/contextRecord";
import { Address, MemoryRead, StopState } from "../engine/engine";
import { Modules } from "./modules";

export interface ExceptionInfo {
  code: number;
  firstChance: boolean; // false: nobody handled it, and the program is about to end
  address: Address; // the instruction that raised it
  parameters: number[];
  text: string; // "Access violation writing location 00000000h"
  contextAt: Address; // the CONTEXT in the program's memory
  context: ContextRecord; // the registers when it happened
}

export interface ExceptionFilter {
  id: string;
  label: string;
  codes: number[];
}

// The kinds whose first-chance stop can be switched off. All are on to begin with.
export const EXCEPTION_FILTERS: ExceptionFilter[] = [
  { id: "access-violation", label: "Access violation", codes: [0xc0000005] },
  { id: "divide-by-zero", label: "Integer division by zero", codes: [0xc0000094] },
  { id: "integer-overflow", label: "Integer overflow", codes: [0xc0000095] },
  { id: "illegal-instruction", label: "Illegal instruction", codes: [0xc000001d] },
  { id: "privileged-instruction", label: "Privileged instruction", codes: [0xc0000096] },
  { id: "stack-overflow", label: "Stack overflow", codes: [0xc00000fd] },
  { id: "array-bounds", label: "Array bounds exceeded", codes: [0xc000008c] },
  { id: "floating-point", label: "Floating-point exception", codes: [0xc000008d, 0xc000008e, 0xc000008f, 0xc0000090, 0xc0000091, 0xc0000092, 0xc0000093] },
];

export const BREAKPOINT_INSTRUCTION = 0x80000003;
export const DEBUG_OUTPUT = 0x40010006; // OutputDebugStringA: parameters are the text's length and its address
const FLOATING: { [code: number]: string } = { 0xc000008d: "denormal operand", 0xc000008e: "division by zero", 0xc000008f: "inexact result", 0xc0000090: "invalid operation", 0xc0000091: "overflow", 0xc0000092: "stack check", 0xc0000093: "underflow" };
const ACCESS = ["reading", "writing"];

type Read = (address: Address, length: number) => Promise<MemoryRead>;

// CONTEXT (x86): where each register is
const C = { gs: 140, fs: 144, es: 148, ds: 152, edi: 156, esi: 160, ebx: 164, edx: 168, ecx: 172, eax: 176, ebp: 180, eip: 184, cs: 188, eflags: 192, esp: 196, ss: 200, float: 28, extended: 204, size: 716 };
const GENERAL_AT = [C.eax, C.ecx, C.edx, C.ebx, C.esp, C.ebp, C.esi, C.edi]; // in the context record's order

const hex8 = (value: number) => ("0000000" + (value >>> 0).toString(16).toUpperCase()).slice(-8);

export function exceptionText(code: number, parameters: number[]): string {
  const unsigned = code >>> 0;
  if (unsigned === 0xc0000005) {
    const how = parameters[0] === 8 ? "executing" : ACCESS[parameters[0]] || "accessing";
    return "Access violation " + how + " location " + hex8(parameters[1] || 0) + "h";
  }
  if (unsigned === BREAKPOINT_INSTRUCTION) return "Breakpoint instruction";
  if (FLOATING[unsigned]) return "Floating-point " + FLOATING[unsigned];
  const filter = EXCEPTION_FILTERS.filter((entry) => entry.codes.indexOf(unsigned) >= 0)[0];
  return filter ? filter.label : "Exception " + hex8(unsigned) + "h";
}

export class Exceptions {
  dispatcher: Address | null = null;
  unhandledFilter: Address | null = null;
  readonly enabled = new Set<string>(EXCEPTION_FILTERS.map((filter) => filter.id));

  constructor(private readonly modules: Modules, private readonly read: Read) {}

  // Finds the two entry points among the loaded modules' exports. False: exception stops are not available.
  async locate(): Promise<boolean> {
    this.dispatcher = await this.modules.exportAddress("ntdll", "KiUserExceptionDispatcher");
    this.unhandledFilter = (await this.modules.exportAddress("kernelbase", "UnhandledExceptionFilter")) || (await this.modules.exportAddress("kernel32", "UnhandledExceptionFilter"));
    return this.dispatcher !== null;
  }

  addresses(): Address[] {
    return [this.dispatcher, this.unhandledFilter].filter((address): address is Address => address !== null);
  }

  private async u32(address: Address): Promise<number | null> {
    const read = await this.read(address >>> 0, 4);
    if (read.unreadable[0] || read.unreadable[3]) return null;
    return (read.bytes[0] | (read.bytes[1] << 8) | (read.bytes[2] << 16) | (read.bytes[3] << 24)) >>> 0;
  }

  // The exception a stop at one of the entry points is about; null when the stop is elsewhere, or the
  // program's memory does not hold what it should.
  async at(stop: StopState): Promise<ExceptionInfo | null> {
    const eip = stop.context.eip;
    const esp = stop.context.esp;
    let recordAt: number | null;
    let contextAt: number | null;
    if (eip === this.dispatcher) {
      recordAt = await this.u32(esp);
      contextAt = await this.u32(esp + 4);
    } else if (eip === this.unhandledFilter) {
      const pointers = await this.u32(esp + 4);
      recordAt = pointers === null ? null : await this.u32(pointers);
      contextAt = pointers === null ? null : await this.u32(pointers + 4);
    } else {
      return null;
    }
    if (recordAt === null || contextAt === null) return null;
    const record = await this.read(recordAt, 80);
    const context = await this.read(contextAt, C.size);
    if (record.unreadable.some((u) => u) || context.unreadable.some((u) => u)) return null;
    const view = new DataView(record.bytes.buffer, record.bytes.byteOffset);
    const count = Math.min(view.getUint32(16, true), 15);
    const parameters: number[] = [];
    for (let i = 0; i < count; i++) parameters.push(view.getUint32(20 + 4 * i, true));
    const code = view.getUint32(0, true);
    return { code, firstChance: eip === this.dispatcher, address: view.getUint32(12, true), parameters, text: exceptionText(code, parameters), contextAt, context: this.registersOf(context.bytes, stop.context) };
  }

  // A CONTEXT as a context record. The FS base is the thread's, which no CONTEXT carries.
  private registersOf(context: Uint8Array, thread: ContextRecord): ContextRecord {
    const from = new DataView(context.buffer, context.byteOffset);
    const bytes = new Uint8Array(CONTEXT_SIZE);
    bytes.set(thread.bytes);
    const record = new ContextRecord(bytes);
    GENERAL_AT.forEach((at, index) => record.setGeneral(index, from.getUint32(at, true)));
    record.eip = from.getUint32(C.eip, true);
    record.eflags = from.getUint32(C.eflags, true);
    const to = new DataView(record.bytes.buffer);
    [C.cs, C.ss, C.ds, C.es, C.fs, C.gs].forEach((at, index) => to.setUint32(40 + 4 * index, from.getUint32(at, true) & 0xffff, true));
    // the x87 image keeps its registers in stack order: ST(i) is physical register TOP + i
    record.fpuControl = from.getUint32(C.float, true);
    record.fpuStatus = from.getUint32(C.float + 4, true);
    record.fpuTags = from.getUint32(C.float + 8, true);
    for (let st = 0; st < 8; st++) record.setFpuRegister(record.physicalOf(st), context.subarray(C.float + 28 + 10 * st, C.float + 38 + 10 * st));
    // the FXSAVE image: MXCSR at 24, XMM0 at 160
    record.mxcsr = from.getUint32(C.extended + 24, true);
    for (let i = 0; i < 8; i++) record.setXmm(i, context.subarray(C.extended + 160 + 16 * i, C.extended + 176 + 16 * i));
    return record;
  }

  // The bytes to write into the CONTEXT for edited integer registers: [address, bytes] pairs.
  changes(info: ExceptionInfo, edited: ContextRecord): { address: Address; bytes: Uint8Array }[] {
    const writes: { address: Address; bytes: Uint8Array }[] = [];
    const put = (at: number, value: number, before: number) => {
      if (value === before) return;
      const bytes = new Uint8Array(4);
      new DataView(bytes.buffer).setUint32(0, value, true);
      writes.push({ address: info.contextAt + at, bytes });
    };
    GENERAL_AT.forEach((at, index) => put(at, edited.general(index), info.context.general(index)));
    put(C.eip, edited.eip, info.context.eip);
    put(C.eflags, edited.eflags, info.context.eflags);
    return writes;
  }

  // Does the debugger stop for this one? A breakpoint instruction and an unhandled exception always; another
  // only where the program's own code raised it, and while its kind is ticked.
  stops(info: ExceptionInfo): boolean {
    if (!info.firstChance || info.code >>> 0 === BREAKPOINT_INSTRUCTION) return true;
    const filter = EXCEPTION_FILTERS.filter((entry) => entry.codes.indexOf(info.code >>> 0) >= 0)[0];
    const module = this.modules.moduleAt(info.address);
    return !!filter && this.enabled.has(filter.id) && !!module && module.own;
  }

  // OutputDebugString's text, when that is what the exception is
  async debugOutput(info: ExceptionInfo): Promise<string | null> {
    if (info.code >>> 0 !== DEBUG_OUTPUT || info.parameters.length < 2) return null;
    const text = await this.read(info.parameters[1], Math.min(info.parameters[0], 4096));
    let line = "";
    for (let i = 0; i < text.bytes.length && !text.unreadable[i] && text.bytes[i]; i++) line += String.fromCharCode(text.bytes[i]);
    return line;
  }
}
