// A thread's registers as every engine hands them over: one little-endian record in the emulator's layout
// (Boxedwine/emulator-patches/debugger/bwDebugger.h, version 1). EAX..EDI from 0, segments 4 bytes each, x87
// R0-R7 as they physically are (8 bytes of significand, then 2 of sign and exponent).
import { DebugFailure } from "../report/failure";

export const CONTEXT_SIZE = 312;
export const CONTEXT_VERSION = 1;

export const GENERAL_REGISTERS = ["eax", "ecx", "edx", "ebx", "esp", "ebp", "esi", "edi"];
export const SEGMENT_REGISTERS = ["cs", "ss", "ds", "es", "fs", "gs"];

const EIP = 32;
const EFLAGS = 36;
const SEGMENTS = 40;
const FS_BASE = 64;
const GS_BASE = 68;
const FPU_CONTROL = 72;
const FPU_STATUS = 76;
const FPU_TAGS = 80;
const FPU_REGISTERS = 88;
const XMM = 176;
const MXCSR = 304;
const VERSION = 308;

export class ContextRecord {
  readonly bytes: Uint8Array;
  private readonly view: DataView;

  // A copy of `bytes`; a record of another size or version is refused.
  constructor(bytes: Uint8Array) {
    if (bytes.length !== CONTEXT_SIZE) throw new DebugFailure("engine", "registers of an unknown layout (" + bytes.length + " bytes)");
    this.bytes = bytes.slice();
    this.view = new DataView(this.bytes.buffer);
    if (this.view.getUint32(VERSION, true) !== CONTEXT_VERSION) throw new DebugFailure("engine", "registers of an unknown version (" + this.view.getUint32(VERSION, true) + ")");
  }

  static empty(): ContextRecord {
    const bytes = new Uint8Array(CONTEXT_SIZE);
    new DataView(bytes.buffer).setUint32(VERSION, CONTEXT_VERSION, true);
    return new ContextRecord(bytes);
  }

  clone(): ContextRecord {
    return new ContextRecord(this.bytes);
  }

  equals(other: ContextRecord): boolean {
    for (let i = 0; i < CONTEXT_SIZE; i++) if (this.bytes[i] !== other.bytes[i]) return false;
    return true;
  }

  private get32(offset: number): number {
    return this.view.getUint32(offset, true);
  }

  private set32(offset: number, value: number): void {
    this.view.setUint32(offset, value >>> 0, true);
  }

  general(index: number): number {
    return this.get32(4 * index);
  }

  setGeneral(index: number, value: number): void {
    this.set32(4 * index, value);
  }

  get eax(): number {
    return this.get32(0);
  }
  get esp(): number {
    return this.get32(16);
  }
  get ebp(): number {
    return this.get32(20);
  }
  get eip(): number {
    return this.get32(EIP);
  }
  set eip(value: number) {
    this.set32(EIP, value);
  }
  set esp(value: number) {
    this.set32(16, value);
  }
  get eflags(): number {
    return this.get32(EFLAGS);
  }
  set eflags(value: number) {
    this.set32(EFLAGS, value);
  }

  segment(index: number): number {
    return this.get32(SEGMENTS + 4 * index) & 0xffff;
  }

  get fsBase(): number {
    return this.get32(FS_BASE);
  }
  get gsBase(): number {
    return this.get32(GS_BASE);
  }
  get fpuControl(): number {
    return this.get32(FPU_CONTROL) & 0xffff;
  }
  set fpuControl(value: number) {
    this.set32(FPU_CONTROL, value & 0xffff);
  }
  get fpuStatus(): number {
    return this.get32(FPU_STATUS) & 0xffff;
  }
  set fpuStatus(value: number) {
    this.set32(FPU_STATUS, value & 0xffff);
  }
  get fpuTags(): number {
    return this.get32(FPU_TAGS) & 0xffff;
  }
  set fpuTags(value: number) {
    this.set32(FPU_TAGS, value & 0xffff);
  }
  get fpuTop(): number {
    return (this.fpuStatus >> 11) & 7;
  }
  get mxcsr(): number {
    return this.get32(MXCSR);
  }
  set mxcsr(value: number) {
    this.set32(MXCSR, value);
  }

  // ST(i)'s place among the physical registers
  physicalOf(st: number): number {
    return (this.fpuTop + st) & 7;
  }

  // the ten bytes of physical register R0-R7 (ST(i) is physicalOf(i); MMi is the first eight bytes of Ri)
  fpuRegister(physical: number): Uint8Array {
    return this.bytes.slice(FPU_REGISTERS + 10 * physical, FPU_REGISTERS + 10 * physical + 10);
  }

  setFpuRegister(physical: number, value: Uint8Array): void {
    this.bytes.set(value.subarray(0, 10), FPU_REGISTERS + 10 * physical);
  }

  // 0 valid, 1 zero, 2 special, 3 empty
  fpuTag(physical: number): number {
    return (this.fpuTags >> (2 * physical)) & 3;
  }

  setFpuTag(physical: number, tag: number): void {
    this.fpuTags = (this.fpuTags & ~(3 << (2 * physical))) | ((tag & 3) << (2 * physical));
  }

  xmm(index: number): Uint8Array {
    return this.bytes.slice(XMM + 16 * index, XMM + 16 * index + 16);
  }

  setXmm(index: number, value: Uint8Array): void {
    this.bytes.set(value.subarray(0, 16), XMM + 16 * index);
  }
}
