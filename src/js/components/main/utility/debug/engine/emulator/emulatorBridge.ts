// The emulator's end of the debugger: it runs in the emulator's page and serves requests with its bwDebug* functions.
import { CONTEXT_SIZE } from "../contextRecord";
import { Disposable } from "../engine";
import { BRIDGE_PROTOCOL, BridgeEvent, BridgeReply, BridgeRequest, BridgeTransport, DEBUGGER_VERSION, WireStopState, isBridgeMessage } from "./protocol";

// the part of the emulator's Module the bridge uses
export interface EmulatorExports {
  HEAPU8: Uint8Array;
  FS: { readFile(path: string): Uint8Array };
  bwOnDebugEvent?: (() => void) | null;
  bwDebugVersion?: () => number;
  bwDebugArm(name: string, pathSuffix: string): number;
  bwDebugDisarm(): void;
  bwDebugAttached(): number;
  bwDebugNextEvent(): string;
  bwDebugThreads(): string;
  bwDebugSetBreakpoints(list: string): number;
  bwDebugSetWatches(list: string): number;
  bwDebugSetCounting(on: number): number;
  bwDebugContinue(): number;
  bwDebugStep(thread: number): number;
  bwDebugStepRange(thread: number, start: number, end: number, over: string): number;
  bwDebugPause(): number;
  bwDebugTerminate(code: number): number;
  bwDebugDetach(): number;
  bwDebugContext(thread: number): number;
  bwDebugSetContext(thread: number): number;
  bwDebugBuffer(): number;
  bwDebugRead(address: number, length: number): number;
  bwDebugWrite(address: number, length: number): number;
}

export interface BridgeHost {
  exports(): EmulatorExports | null; // null until the emulator runs
  nativePath(path: string): string; // a file as the build names it, in the emulator's own file system
  runtime(): string; // "st" or "mt"
  holding?(held: boolean): void; // a stopped program is being held, or is no longer
}

const BUFFER = 0x10000; // the emulator's transfer buffer: this many bytes, then as many "readable" marks
const STACK_BYTES = 2048;
const STACK_BELOW = 256; // bytes under ESP that come with a stop: where the next pushes will write
const CODE_BYTES = 64;
const NOT_STOPPED = -3;

class Refused extends Error {
  constructor(readonly code: BridgeReply["error"]) {
    super(String(code));
    Object.setPrototypeOf(this, Refused.prototype);
  }
}

export class EmulatorBridge {
  private readonly listening: Disposable;
  private hooked: EmulatorExports | null = null;
  private held = false;

  constructor(private readonly host: BridgeHost, private readonly transport: BridgeTransport) {
    this.listening = transport.listen((message) => this.receive(message));
  }

  // Lets go of the program: nothing stays armed, attached or held.
  dispose(): void {
    this.listening.dispose();
    this.release();
  }

  // The page is going away (reloaded or closed): the program is let go, and the engine hears of it now rather
  // than when its next request goes unanswered.
  departing(): void {
    this.release();
    try {
      this.transport.post({ bwDebug: BRIDGE_PROTOCOL, event: "closed" });
    } catch (error) {
      // the engine's own timeouts still end it
    }
  }

  private release(): void {
    const exports = this.hooked;
    this.hooked = null;
    this.hold(false);
    if (!exports) return;
    try {
      exports.bwOnDebugEvent = null;
      exports.bwDebugDisarm();
      exports.bwDebugDetach();
    } catch (error) {
      // an emulator that has stopped holds nothing
    }
  }

  private hold(held: boolean): void {
    if (held === this.held) return;
    this.held = held;
    if (this.host.holding) this.host.holding(held);
  }

  private receive(message: unknown): void {
    if (!isBridgeMessage(message) || typeof (message as BridgeRequest).op !== "string") return;
    const request = message as BridgeRequest;
    const transfer: ArrayBuffer[] = [];
    let reply: Partial<BridgeReply>;
    try {
      reply = { ok: true, ...this.serve(request, transfer) };
    } catch (error) {
      const trap = typeof WebAssembly !== "undefined" && error instanceof WebAssembly.RuntimeError;
      reply = error instanceof Refused ? { ok: false, error: error.code } : { ok: false, error: trap ? "trap" : "threw", message: String(error instanceof Error ? error.message : error) };
      // a trap is the emulator crashing: the page's own crash handling must see it too
      if (trap) setTimeout(() => { throw error; }, 0);
    }
    this.transport.post({ ...reply, bwDebug: BRIDGE_PROTOCOL, re: request.id } as BridgeReply, transfer);
  }

  private emulator(): EmulatorExports {
    const exports = this.host.exports();
    if (!exports) throw new Refused("not-ready");
    if (typeof exports.bwDebugVersion !== "function") throw new Refused("unsupported");
    return exports;
  }

  // the emulator's own answer: 0 or more is done, below 0 says why not
  private done(code: number): {} {
    if (code < 0) throw new Refused(code);
    return {};
  }

  private serve(request: BridgeRequest, transfer: ArrayBuffer[]): Partial<BridgeReply> {
    const exports = this.emulator();
    switch (request.op) {
      case "hello": {
        const version = exports.bwDebugVersion();
        if (version !== DEBUGGER_VERSION) return { ok: false, error: "out-of-date", version };
        // a new engine: whatever an earlier one left armed or held is let go
        this.hooked = exports;
        this.release();
        this.hooked = exports;
        exports.bwOnDebugEvent = () => this.drain();
        return { version, runtime: this.host.runtime() };
      }
      case "arm":
        return this.done(exports.bwDebugArm(String(request.name), String(request.suffix)));
      case "disarm":
        exports.bwDebugDisarm();
        return {};
      case "detach":
        this.hold(false);
        exports.bwDebugDetach();
        return {};
      case "continue":
        return this.resumed(exports.bwDebugContinue());
      case "step":
        return this.resumed(exports.bwDebugStep(request.thread >>> 0));
      case "stepRange":
        return this.resumed(exports.bwDebugStepRange(request.thread >>> 0, request.start >>> 0, request.end >>> 0, (request.over || []).map((a) => a >>> 0).join(",")));
      case "pause":
        return this.done(exports.bwDebugPause());
      case "terminate":
        return this.resumed(exports.bwDebugTerminate(request.code >>> 0));
      case "setBreakpoints":
        return this.done(exports.bwDebugSetBreakpoints((request.addresses || []).map((a) => a >>> 0).join(",")));
      case "setWatches":
        return this.done(exports.bwDebugSetWatches((request.watches || []).map((w) => (w.address >>> 0) + ":" + (w.size >>> 0)).join(",")));
      case "setCounting":
        return this.done(exports.bwDebugSetCounting(request.on ? 1 : 0));
      case "stopState":
        return { state: this.stopState(exports, request.thread >>> 0, transfer) };
      case "setContext":
        return this.setContext(exports, request.thread >>> 0, new Uint8Array(request.bytes || new ArrayBuffer(0)));
      case "restore": {
        const thread = request.thread >>> 0;
        const bytes = new Uint8Array(request.bytes || new ArrayBuffer(0));
        if (!exports.bwDebugContext(thread) || bytes.length !== CONTEXT_SIZE) throw new Refused(exports.bwDebugContext(thread) ? "bad-request" : NOT_STOPPED);
        for (const write of request.writes || []) {
          const data = new Uint8Array(write.bytes);
          if (this.write(exports, write.address >>> 0, data) !== data.length) return { restored: false };
        }
        this.setContext(exports, thread, bytes);
        return { restored: true, state: this.stopState(exports, thread, transfer) };
      }
      case "read":
        return {
          reads: (request.ranges || []).map((range) => {
            const read = this.read(exports, range.address >>> 0, range.length >>> 0);
            transfer.push(read.bytes, read.unreadable);
            return read;
          }),
        };
      case "write":
        return { written: this.write(exports, request.address >>> 0, new Uint8Array(request.bytes || new ArrayBuffer(0))) };
      case "readFile": {
        let file: Uint8Array;
        try {
          file = exports.FS.readFile(this.host.nativePath(String(request.path)));
        } catch (error) {
          throw new Refused("no-file");
        }
        const copy = file.slice().buffer;
        transfer.push(copy);
        return { file: copy };
      }
      case "threads": {
        if (!exports.bwDebugAttached()) throw new Refused(-1);
        return { threads: this.threads(exports) };
      }
      default:
        throw new Refused("bad-request");
    }
  }

  private resumed(code: number): {} {
    if (code >= 0) this.hold(false);
    return this.done(code);
  }

  private stopState(exports: EmulatorExports, thread: number, transfer: ArrayBuffer[]): WireStopState {
    const record = exports.bwDebugContext(thread);
    if (!record) throw new Refused(NOT_STOPPED);
    const context = exports.HEAPU8.slice(record, record + CONTEXT_SIZE);
    const view = new DataView(context.buffer);
    const stackAddress = Math.max(0, view.getUint32(16, true) - STACK_BELOW);
    const codeAddress = view.getUint32(32, true);
    const stack = this.read(exports, stackAddress, STACK_BYTES + STACK_BELOW);
    const code = this.read(exports, codeAddress, CODE_BYTES);
    transfer.push(context.buffer, stack.bytes, stack.unreadable, code.bytes, code.unreadable);
    return { thread, context: context.buffer, stackAddress, stack: stack.bytes, stackUnreadable: stack.unreadable, codeAddress, code: code.bytes, codeUnreadable: code.unreadable, threads: this.threads(exports) };
  }

  private threads(exports: EmulatorExports): { id: number; waiting: boolean }[] {
    const listed = JSON.parse(exports.bwDebugThreads()) as { threads?: { id: number; waiting: boolean }[] };
    return (listed.threads || []).map((thread) => ({ id: thread.id, waiting: !!thread.waiting }));
  }

  // Memory past the end of the address space reads as unreadable.
  private read(exports: EmulatorExports, address: number, length: number): { bytes: ArrayBuffer; unreadable: ArrayBuffer } {
    const bytes = new Uint8Array(length);
    const unreadable = new Uint8Array(length).fill(1);
    const reachable = Math.min(length, 0x100000000 - address);
    for (let done = 0; done < reachable; ) {
      const count = Math.min(BUFFER, reachable - done);
      this.done(exports.bwDebugRead(address + done, count));
      const buffer = exports.bwDebugBuffer();
      const heap = exports.HEAPU8;
      bytes.set(heap.subarray(buffer, buffer + count), done);
      for (let i = 0; i < count; i++) unreadable[done + i] = heap[buffer + BUFFER + i] ? 0 : 1;
      done += count;
    }
    return { bytes: bytes.buffer, unreadable: unreadable.buffer };
  }

  private setContext(exports: EmulatorExports, thread: number, bytes: Uint8Array): {} {
    const record = exports.bwDebugContext(thread);
    if (!record || bytes.length !== CONTEXT_SIZE) throw new Refused(record ? "bad-request" : NOT_STOPPED);
    exports.HEAPU8.set(bytes, record);
    return this.done(exports.bwDebugSetContext(thread));
  }

  private write(exports: EmulatorExports, address: number, bytes: Uint8Array): number {
    let written = 0;
    const reachable = Math.min(bytes.length, 0x100000000 - address);
    while (written < reachable) {
      const count = Math.min(BUFFER, reachable - written);
      exports.HEAPU8.set(bytes.subarray(written, written + count), exports.bwDebugBuffer());
      const wrote = exports.bwDebugWrite(address + written, count);
      this.done(wrote);
      written += wrote;
      if (wrote < count) break;
    }
    return written;
  }

  private drain(): void {
    const exports = this.hooked;
    if (!exports) return;
    try {
      for (let text = exports.bwDebugNextEvent(); text; text = exports.bwDebugNextEvent()) {
        const raw = JSON.parse(text) as { e: string; pid?: number; tid?: number; cmd?: string; reason?: BridgeEvent["reason"]; watch?: BridgeEvent["watch"]; count?: string; code?: number | null };
        const transfer: ArrayBuffer[] = [];
        let event: BridgeEvent;
        if (raw.e === "attached") {
          event = { bwDebug: BRIDGE_PROTOCOL, event: "attached", process: raw.pid, thread: raw.tid, commandLine: raw.cmd };
        } else if (raw.e === "stopped") {
          this.hold(true);
          event = { bwDebug: BRIDGE_PROTOCOL, event: "stopped", thread: raw.tid, reason: raw.reason, watch: raw.watch, count: raw.count, state: this.stopState(exports, raw.tid, transfer) };
        } else if (raw.e === "exited") {
          this.hold(false);
          event = { bwDebug: BRIDGE_PROTOCOL, event: "exited", code: raw.code === undefined ? null : raw.code };
        } else {
          continue;
        }
        this.transport.post(event, transfer);
      }
    } catch (error) {
      // an event that cannot be passed on must not leave the program held with nobody knowing
      this.release();
      this.transport.post({ bwDebug: BRIDGE_PROTOCOL, event: "failed", message: String(error instanceof Error ? error.message : error) });
      if (typeof WebAssembly !== "undefined" && error instanceof WebAssembly.RuntimeError) throw error;
    }
  }
}
