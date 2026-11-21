import { Address, DebugEngine, Disposable, EngineRefusal, StopState } from "../engine/engine";
import { Timers } from "../engine/emulator/emulatorEngine";
import { ValueError } from "../inspect/values";
import { DebugFailure, failureOf } from "../report/failure";
import { ConditionEvaluator } from "./breakpointHits";
import { Breakpoints } from "./breakpoints";
import { Counting } from "./counting";
import { ExceptionInfo, Exceptions } from "./exceptions";
import { SessionMemory } from "./memory";
import { Modules } from "./modules";
import { SessionError, SessionEvent, SessionOptions, SessionState, StopInfo, WAITING_MS } from "./sessionEvents";
import { CallStack, StackWalker } from "./stackWalker";
import { BARRIERS, StepHistory } from "./stepHistory";
import { Step } from "./stepping";

const realTimers: Timers = { set: (callback, ms) => setTimeout(callback, ms), clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>) };
const STACK_BELOW = 256;
const STACK_BYTES = 2048;
const CODE_BYTES = 64;

export class SessionCore {
  state: SessionState = "starting";
  stop: StopState | null = null; // what the views show: at an exception, the registers when it was raised
  lastStop: StopInfo | null = null;
  exception: ExceptionInfo | null = null; // the exception the current stop is about
  readonly engine: DebugEngine;
  readonly timers: Timers;
  readonly now: () => number;
  readonly memory: SessionMemory;
  readonly modules: Modules;
  readonly breakpoints: Breakpoints;
  readonly history = new StepHistory();
  readonly counting: Counting;
  readonly walker: StackWalker;
  readonly exceptions: Exceptions;
  conditions: ConditionEvaluator = async () => {
    throw new Error("expressions are not available");
  };
  activeStep: Step | null = null;
  deciding = false; // an engine stop is being looked at: it may yet resume unseen
  pauseWanted = false;
  ending = false;
  entry: Address | null = null;
  entered = false;
  stack: Promise<CallStack> | null = null;
  startTimer: unknown = null;
  waitingTimer: unknown = null;
  listening: Disposable | null = null;
  private listeners: ((event: SessionEvent) => void)[] = [];
  private queue: Promise<void> = Promise.resolve();

  constructor(readonly options: SessionOptions) {
    this.engine = options.engine;
    this.timers = options.timers || realTimers;
    this.now = options.now || (() => Date.now());
    const read = (address: Address, length: number) => this.memory.read(address, length);
    this.memory = new SessionMemory(this.engine);
    this.modules = new Modules(read, options.resolver);
    this.breakpoints = new Breakpoints(this.modules, options.breakpointIds);
    this.counting = new Counting(this.engine);
    this.walker = new StackWalker(this.modules, read, options.decoder, (address, length) => this.memory.peek(address, length));
    this.exceptions = new Exceptions(this.modules, read);
  }

  listen(listener: (event: SessionEvent) => void): Disposable {
    this.listeners.push(listener);
    return { dispose: () => (this.listeners = this.listeners.filter((entry) => entry !== listener)) };
  }

  emit(event: SessionEvent): void {
    for (const listener of this.listeners.slice()) listener(event);
  }

  // One thing at a time: engine events and the user's commands never run through each other.
  enqueue<T>(work: () => Promise<T>): Promise<T> {
    const result = this.queue.then(work);
    this.queue = result.then(
      (): void => undefined,
      (error: unknown): Promise<void> | void => {
        // the program's exit can overtake any request: the exit itself ends the session
        if (error instanceof EngineRefusal && error.reason === "not-attached") return;
        if (!(error instanceof SessionError) && !(error instanceof ValueError)) return this.fail(failureOf(error));
      },
    );
    return result;
  }

  // work nobody waits for: what goes wrong in it ends the session through the queue, and is not thrown again
  background(work: () => Promise<void>): void {
    this.enqueue(work).catch((): void => undefined);
  }

  adopt(state: StopState): void {
    this.stop = state;
    this.stack = null;
    this.exception = null;
    this.memory.invalidate();
    this.memory.seed(state.stackAddress, state.stack);
    this.memory.seed(state.codeAddress, state.code);
  }

  // At an exception the views show the program as it was when the exception was raised: the thread itself
  // is already in the system's dispatcher.
  async adoptException(raised: ExceptionInfo): Promise<void> {
    const real = this.stop;
    const context = raised.context;
    const stackAddress = Math.max(0, context.esp - STACK_BELOW);
    const stack = await this.memory.read(stackAddress, STACK_BYTES + STACK_BELOW);
    const code = await this.memory.read(context.eip, CODE_BYTES);
    this.stop = { thread: real.thread, context, stackAddress, stack, codeAddress: context.eip, code, threads: real.threads };
    this.stack = null;
    this.exception = raised;
  }

  // The stop as the engine has it now; `state` when it came with the request that changed it.
  async reload(state?: StopState): Promise<void> {
    const wasException = !!this.exception;
    this.adopt(state || (await this.engine.stopState(this.stop.thread)));
    const raised = wasException ? await this.exceptions.at(this.stop) : null;
    if (raised) await this.adoptException(raised);
  }

  // The stop the views and the evaluator work on. While an engine stop is being looked at, a breakpoint's
  // condition is evaluated on it though the user has not been shown it.
  need(): StopState {
    if (this.state === "ended") throw new SessionError("The program has ended");
    if ((this.state !== "stopped" && !this.deciding) || !this.stop) throw new SessionError("The program is running");
    return this.stop;
  }

  resumed(): void {
    this.state = "running";
    this.exception = null;
    this.counting.resumed();
    this.timers.clear(this.waitingTimer);
    this.waitingTimer = this.timers.set(() => this.state === "running" && this.emit({ type: "waiting" }), WAITING_MS);
    this.emit({ type: "continued" });
  }

  // An engine request that the program's exit can overtake: that is not an error.
  async ask(request: () => Promise<void>): Promise<void> {
    try {
      await request();
    } catch (error) {
      if (!(error instanceof EngineRefusal) || error.reason !== "not-attached") throw error;
    }
  }

  // The loader's list, when it changed: breakpoints follow the modules that moved or arrived.
  async refreshModules(): Promise<void> {
    if (!this.stop || !(await this.modules.refresh(this.stop.context.fsBase))) return;
    const changed = this.breakpoints.rebind();
    await this.breakpoints.sync(this.engine);
    if (changed.length) this.emit({ type: "breakpoints", changed });
  }

  // The stop is the user's: whatever step was running is over.
  async report(stop: Omit<StopInfo, "thread">): Promise<void> {
    this.memory.shown();
    if (this.activeStep) this.activeStep.cancel();
    this.activeStep = null;
    this.pauseWanted = false;
    this.history.end();
    if (this.stop.threads.length > 1) this.history.barrier(BARRIERS.threads);
    await this.refreshModules();
    await this.breakpoints.sync(this.engine);
    this.state = "stopped";
    this.show({ ...stop, thread: this.stop.thread });
  }

  show(stop: StopInfo): void {
    this.memory.shown();
    this.lastStop = stop;
    this.emit({ type: "stopped", stop });
  }

  fail(failure: DebugFailure, reachable = true): Promise<void> {
    return this.finish("", failure, reachable);
  }

  // Every way out comes through here: nothing stays armed, attached or held.
  async finish(message: string, failure: DebugFailure | null, reachable = true): Promise<void> {
    if (this.state === "ended") return;
    this.state = "ended";
    this.timers.clear(this.startTimer);
    this.timers.clear(this.waitingTimer);
    this.activeStep = null;
    if (this.listening) this.listening.dispose();
    if (reachable) {
      for (const release of [() => this.engine.disarm(), () => this.engine.detach()]) {
        try {
          await release();
        } catch (error) {
          // an engine that is gone holds nothing
        }
      }
    }
    this.emit({ type: "ended", message, failure });
  }
}
