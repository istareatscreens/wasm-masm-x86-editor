// The emulator as a debug engine: each primitive is one message to the bridge in the emulator's page, and one
// reply. A request that gets no reply in time ends the engine, so a session never waits for ever.
import { DebugFailure } from "../../report/failure";
import { ContextRecord } from "../contextRecord";
import { Address, DataWatch, DebugEngine, Disposable, EngineEvent, EngineFeatures, EngineRefusal, MemoryRange, MemoryRead, StopState, ThreadInfo } from "../engine";
import { BRIDGE_PROTOCOL, BridgeEvent, BridgeOp, BridgeReply, BridgeRequest, BridgeTransport, TIMEOUT_CONTROL_MS, TIMEOUT_READ_MS, WireStopState, isBridgeMessage } from "./protocol";

export interface Timers {
  set(callback: () => void, ms: number): unknown;
  clear(handle: unknown): void;
}

const realTimers: Timers = { set: (callback, ms) => setTimeout(callback, ms), clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>) };
const REFUSALS: { [code: number]: EngineRefusal["reason"] } = { [-1]: "not-attached", [-2]: "no-thread", [-3]: "not-stopped", [-4]: "bad-argument" };
const READ_OPS: BridgeOp[] = ["read", "stopState", "threads"];

function hexBytes(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length >> 1);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(text.substr(2 * i, 2), 16);
  return bytes;
}

function stopStateOf(wire: WireStopState): StopState {
  return {
    thread: wire.thread,
    context: new ContextRecord(new Uint8Array(wire.context)),
    stackAddress: wire.stackAddress,
    stack: { bytes: new Uint8Array(wire.stack), unreadable: new Uint8Array(wire.stackUnreadable) },
    codeAddress: wire.codeAddress,
    code: { bytes: new Uint8Array(wire.code), unreadable: new Uint8Array(wire.codeUnreadable) },
    threads: wire.threads || [],
  };
}

export interface EmulatorHello {
  supported: boolean; // false: this emulator was built without the debugger, or is not running yet
  reason?: string;
  version?: number;
  runtime?: string;
}

export class EmulatorEngine implements DebugEngine {
  readonly features: EngineFeatures = { stepBack: true, counting: true, writableFlags: 0xcd5 };
  runtime = "";
  version = 0;
  private lastOp = ""; // the request in flight, or the last one sent
  private nextId = 1;
  private readonly pending = new Map<number, { op: BridgeOp; resolve: (reply: BridgeReply) => void; reject: (error: Error) => void; timer: unknown }>();
  private listeners: ((event: EngineEvent) => void)[] = [];
  private readonly listening: Disposable;
  private lost: DebugFailure | null = null;

  constructor(private readonly transport: BridgeTransport, private readonly timers: Timers = realTimers) {
    this.listening = transport.listen((message) => this.receive(message));
  }

  // Greets the bridge. An emulator of another debugger version is a failure; one without a debugger is not.
  async hello(): Promise<EmulatorHello> {
    const reply = await this.request("hello", {}, TIMEOUT_CONTROL_MS);
    if (reply.ok) {
      this.runtime = reply.runtime || "";
      this.version = reply.version || 0;
      return { supported: true, version: reply.version, runtime: reply.runtime };
    }
    if (reply.error === "out-of-date") throw new DebugFailure("out-of-date", "the emulator's debugger is version " + reply.version);
    if (reply.error === "unsupported" || reply.error === "not-ready") return { supported: false, reason: String(reply.error) };
    throw new DebugFailure("engine", "hello: " + reply.error + (reply.message ? " (" + reply.message + ")" : ""));
  }

  arm(programName: string, pathSuffix: string): Promise<void> {
    return this.control("arm", { name: programName, suffix: pathSuffix });
  }
  disarm(): Promise<void> {
    return this.control("disarm", {});
  }
  async readProgram(path: string): Promise<Uint8Array> {
    return new Uint8Array((await this.served("readFile", { path }, TIMEOUT_CONTROL_MS)).file);
  }
  continue(): Promise<void> {
    return this.control("continue", {});
  }
  step(thread: number): Promise<void> {
    return this.control("step", { thread });
  }
  stepRange(thread: number, start: Address, end: Address, over: Address[]): Promise<void> {
    return this.control("stepRange", { thread, start, end, over });
  }
  pause(): Promise<void> {
    return this.control("pause", {});
  }
  terminate(exitCode: number): Promise<void> {
    return this.control("terminate", { code: exitCode });
  }
  detach(): Promise<void> {
    return this.control("detach", {});
  }
  setBreakpoints(addresses: Address[]): Promise<void> {
    return this.control("setBreakpoints", { addresses });
  }
  setWatches(watches: DataWatch[]): Promise<void> {
    return this.control("setWatches", { watches });
  }
  setCounting(on: boolean): Promise<void> {
    return this.control("setCounting", { on });
  }
  async stopState(thread: number): Promise<StopState> {
    return stopStateOf((await this.served("stopState", { thread }, TIMEOUT_READ_MS)).state);
  }
  async read(ranges: MemoryRange[]): Promise<MemoryRead[]> {
    const reply = await this.served("read", { ranges }, TIMEOUT_READ_MS);
    return reply.reads.map((read) => ({ bytes: new Uint8Array(read.bytes), unreadable: new Uint8Array(read.unreadable) }));
  }
  async write(address: Address, bytes: Uint8Array): Promise<number> {
    const copy = bytes.slice().buffer;
    return (await this.served("write", { address, bytes: copy }, TIMEOUT_CONTROL_MS, [copy])).written;
  }
  setContext(thread: number, context: ContextRecord): Promise<void> {
    const copy = context.bytes.slice().buffer;
    return this.control("setContext", { thread, bytes: copy }, [copy]);
  }
  async restore(thread: number, writes: { address: Address; bytes: Uint8Array }[], context: ContextRecord): Promise<StopState | null> {
    const transfer: ArrayBuffer[] = [];
    const wire = writes.map((write) => {
      const copy = write.bytes.slice().buffer;
      transfer.push(copy);
      return { address: write.address, bytes: copy };
    });
    const record = context.bytes.slice().buffer;
    transfer.push(record);
    const reply = await this.served("restore", { thread, writes: wire, bytes: record }, TIMEOUT_CONTROL_MS, transfer);
    return reply.restored && reply.state ? stopStateOf(reply.state) : null;
  }
  async threads(): Promise<ThreadInfo[]> {
    return (await this.served("threads", {}, TIMEOUT_READ_MS)).threads;
  }

  onEvent(listener: (event: EngineEvent) => void): Disposable {
    this.listeners.push(listener);
    return { dispose: () => (this.listeners = this.listeners.filter((entry) => entry !== listener)) };
  }

  describe(): string {
    return "emulator" + (this.runtime ? " (" + this.runtime + ")" : "") + (this.lastOp ? ", " + this.lastOp : "");
  }

  dispose(): void {
    this.listening.dispose();
    this.fail(new DebugFailure("engine", "the engine was closed"), false);
    this.listeners = [];
  }

  private async control(op: BridgeOp, fields: Partial<BridgeRequest>, transfer?: ArrayBuffer[]): Promise<void> {
    await this.served(op, fields, TIMEOUT_CONTROL_MS, transfer);
  }

  // A reply that says yes; anything else is thrown: a refusal the session can expect, or a failure.
  private async served(op: BridgeOp, fields: Partial<BridgeRequest>, timeout: number, transfer?: ArrayBuffer[]): Promise<BridgeReply> {
    const reply = await this.request(op, fields, READ_OPS.indexOf(op) >= 0 ? TIMEOUT_READ_MS : timeout, transfer);
    if (reply.ok) return reply;
    if (typeof reply.error === "number" && REFUSALS[reply.error]) throw new EngineRefusal(op, REFUSALS[reply.error]);
    throw new DebugFailure("engine", op + ": " + reply.error + (reply.message ? " (" + reply.message + ")" : ""));
  }

  private request(op: BridgeOp, fields: Partial<BridgeRequest>, timeout: number, transfer?: ArrayBuffer[]): Promise<BridgeReply> {
    if (this.lost) return Promise.reject(this.lost);
    const id = this.nextId++;
    this.lastOp = op;
    return new Promise<BridgeReply>((resolve, reject) => {
      const timer = this.timers.set(() => this.fail(new DebugFailure("lost-contact", op + " was not answered in " + timeout + " ms"), true), timeout);
      this.pending.set(id, { op, resolve, reject, timer });
      try {
        this.transport.post({ ...fields, bwDebug: BRIDGE_PROTOCOL, id, op } as BridgeRequest, transfer);
      } catch (error) {
        this.fail(new DebugFailure("lost-contact", op + " could not be sent"), true);
      }
    });
  }

  // The engine is gone: every waiting request ends with the reason, and the session hears of it once.
  private fail(failure: DebugFailure, tell: boolean): void {
    if (this.lost) return;
    this.lost = failure;
    this.pending.forEach((waiting) => {
      this.timers.clear(waiting.timer);
      waiting.reject(failure);
    });
    this.pending.clear();
    // the session words a lost contact itself; anything else says what broke
    if (tell) this.emit({ type: "lost", reason: failure.kind === "lost-contact" ? failure.detail : failure.message });
  }

  private emit(event: EngineEvent): void {
    for (const listener of this.listeners.slice()) listener(event);
  }

  private receive(message: unknown): void {
    if (!isBridgeMessage(message) || this.lost) return;
    const reply = message as BridgeReply;
    if (typeof reply.re === "number") {
      const waiting = this.pending.get(reply.re);
      if (!waiting) return;
      this.pending.delete(reply.re);
      this.timers.clear(waiting.timer);
      waiting.resolve(reply);
      return;
    }
    const event = message as BridgeEvent;
    let told: EngineEvent | null = null;
    try {
      if (event.event === "attached") {
        told = { type: "attached", process: event.process, thread: event.thread, commandLine: event.commandLine || "" };
      } else if (event.event === "stopped") {
        const watch = event.watch && { address: event.watch.address, size: event.watch.size, old: hexBytes(event.watch.old), new: hexBytes(event.watch.new) };
        told = { type: "stopped", thread: event.thread, reason: event.reason, state: stopStateOf(event.state), watch, count: event.count };
      } else if (event.event === "exited") {
        told = { type: "exited", code: event.code === undefined ? null : event.code };
      } else if (event.event === "failed") {
        this.fail(new DebugFailure("engine", "the bridge failed: " + event.message), true);
      } else if (event.event === "closed") {
        this.fail(new DebugFailure("lost-contact", "the terminal's page closed"), true);
      }
    } catch (error) {
      this.fail(error instanceof DebugFailure ? error : new DebugFailure("engine", "an event could not be read"), true);
    }
    if (told) this.emit(told);
  }
}
