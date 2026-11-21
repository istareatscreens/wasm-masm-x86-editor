// The session's inside is SessionCore; what happens at each engine stop is stopHandler.ts.
import { ContextRecord } from "../engine/contextRecord";
import { Address, Disposable, EngineEvent, EngineRefusal, ThreadInfo } from "../engine/engine";
import { Target, ValueError } from "../inspect/values";
import { DebugFailure } from "../report/failure";
import { ConditionEvaluator } from "./breakpointHits";
import { Breakpoints } from "./breakpoints";
import { Counting } from "./counting";
import { BREAKPOINT_INSTRUCTION, Exceptions } from "./exceptions";
import { SessionMemory } from "./memory";
import { Modules } from "./modules";
import { SessionCore } from "./sessionCore";
import { START_MS, STOP_MS, SessionError, SessionEvent, SessionOptions, SessionState, StopInfo } from "./sessionEvents";
import { CallStack, StackWalker } from "./stackWalker";
import { NO_DEBUG_INFORMATION, readModules } from "./startup";
import { BARRIERS, StepHistory } from "./stepHistory";
import { Step, StepRequest } from "./stepping";
import { handleStop } from "./stopHandler";
import { undoSteps } from "./undo";

export { SessionError } from "./sessionEvents";

export class DebugSession {
  private readonly core: SessionCore;

  constructor(options: SessionOptions) {
    this.core = new SessionCore(options);
    this.core.listening = options.engine.onEvent((event) => this.core.background(() => this.onEngine(event)));
  }

  get state(): SessionState {
    return this.core.state;
  }
  get stop() {
    return this.core.stop;
  }
  get lastStop(): StopInfo | null {
    return this.core.lastStop;
  }
  get memory(): SessionMemory {
    return this.core.memory;
  }
  get modules(): Modules {
    return this.core.modules;
  }
  get breakpoints(): Breakpoints {
    return this.core.breakpoints;
  }
  get history(): StepHistory {
    return this.core.history;
  }
  get counting(): Counting {
    return this.core.counting;
  }
  get walker(): StackWalker {
    return this.core.walker;
  }
  get exceptions(): Exceptions {
    return this.core.exceptions;
  }
  set conditions(evaluate: ConditionEvaluator) {
    this.core.conditions = evaluate;
  }

  listen(listener: (event: SessionEvent) => void): Disposable {
    return this.core.listen(listener);
  }

  // ---- starting ----

  // Tells the engine which program to hold. The build comes next; `built` says that it succeeded.
  arm(): Promise<void> {
    const name = this.core.options.programPath.replace(/^.*[\\/]/, "");
    return this.core.engine.arm(name, "bin\\" + name);
  }

  // The build succeeded: the program must attach within ten seconds.
  built(): void {
    const core = this.core;
    if (core.state !== "starting" || core.modules.main) return;
    core.startTimer = core.timers.set(() => core.background(() => core.fail(new DebugFailure("not-started"))), START_MS);
  }

  private async onEngine(event: EngineEvent): Promise<void> {
    const core = this.core;
    if (core.state === "ended") return;
    if (event.type === "stopped") return handleStop(core, event);
    if (event.type === "exited") {
      if (!core.ending) core.emit({ type: "exited", code: event.code });
      return core.finish("", null, false);
    }
    if (event.type === "lost") return core.fail(new DebugFailure("lost-contact", event.reason), false);
    // attached: the program's files are read and bound, and it runs to its entry point
    core.timers.clear(core.startTimer);
    core.entry = await readModules(core.engine, core.options.cache, core.modules, core.options.programPath);
    if (core.entry === null) return core.finish(NO_DEBUG_INFORMATION, null);
    core.breakpoints.rebind();
    core.breakpoints.setInternal("entry", [core.entry]);
    await core.breakpoints.sync(core.engine);
    core.state = "running";
    core.emit({ type: "started" });
    core.emit({ type: "breakpoints", changed: core.breakpoints.all() });
    await core.engine.continue();
  }

  // ---- what the user asks for ----

  // Leaving an exception's stop. A breakpoint instruction is stepped past: the thread takes its registers
  // back with EIP after the instruction, as the system would give them. Any other exception goes on to the
  // program's own handlers. Returns whether the thread is back in the program's code.
  private async leaveException(): Promise<boolean> {
    const core = this.core;
    const raised = core.exception;
    core.exception = null;
    if (!raised || !raised.firstChance || raised.code >>> 0 !== BREAKPOINT_INSTRUCTION) return false;
    const context = raised.context.clone();
    context.eip = raised.address + 1;
    await core.engine.setContext(core.stop.thread, context);
    core.adopt(await core.engine.stopState(core.stop.thread));
    return true;
  }

  continue(): Promise<void> {
    const core = this.core;
    return core.enqueue(async () => {
      core.need();
      await this.leaveException();
      core.history.barrier(BARRIERS.ran);
      core.resumed();
      await core.ask(() => core.engine.continue());
    });
  }

  step(request: StepRequest): Promise<void> {
    const core = this.core;
    return core.enqueue(async () => {
      core.need();
      if (core.exception && !(await this.leaveException())) {
        // an exception is on its way to the program's handlers: a step lets it get there
        core.resumed();
        return core.ask(() => core.engine.continue());
      }
      const stop = core.stop;
      const recordable = core.engine.features.stepBack && stop.threads.length <= 1;
      const step = new Step({ engine: core.engine, modules: core.modules, decoder: core.options.decoder, breakpoints: core.breakpoints, walker: core.walker, history: recordable ? core.history : null, read: (address, length) => core.memory.read(address, length), now: core.now }, request);
      const result = await step.advance(stop);
      if (result.state === "refused") throw new SessionError(result.message);
      if (result.state === "done") return core.report({ reason: "step", text: "", breakpointIds: [], returned: result.returned });
      core.activeStep = result.state === "running" ? step : null;
      core.resumed();
    });
  }

  // Break. It is noted at once, so that a stop being looked at right now becomes the user's stop.
  pause(): Promise<void> {
    const core = this.core;
    core.pauseWanted = true;
    return core.enqueue(async () => {
      if (core.state !== "running") {
        core.pauseWanted = false;
        return;
      }
      await core.ask(() => core.engine.pause());
    });
  }

  // Set Next Statement: the thread goes on from `address`.
  goTo(address: Address): Promise<void> {
    const core = this.core;
    return core.enqueue(async () => {
      core.need();
      if (core.exception && !(await this.leaveException())) throw new SessionError("The next statement cannot be set while an exception is being handled");
      const context = core.stop.context.clone();
      context.eip = address;
      await core.engine.setContext(core.stop.thread, context);
      core.history.barrier(BARRIERS.moved);
      await core.reload();
      core.show({ reason: "goto", thread: core.stop.thread, text: "", breakpointIds: [] });
    });
  }

  // Step Back, or with `toBreakpoint` Reverse Continue.
  stepBack(toBreakpoint = false): Promise<void> {
    const core = this.core;
    return core.enqueue(async () => {
      core.need();
      if (!core.history.depth) throw new SessionError(core.history.reason);
      const undone = await undoSteps(core, toBreakpoint);
      if ("failure" in undone) core.emit({ type: "problem", failure: undone.failure });
      await core.reload("state" in undone ? undone.state : undefined);
      core.show({ reason: "step", thread: core.stop.thread, text: "", breakpointIds: [] });
    });
  }

  // The engine is given the breakpoints as they are now. Works while the program runs.
  applyBreakpoints(): Promise<void> {
    const core = this.core;
    return core.enqueue(async () => {
      if (core.state === "ended" || !core.modules.main) return;
      await core.ask(() => core.breakpoints.sync(core.engine));
    });
  }

  callStack(): Promise<CallStack> {
    const core = this.core;
    const stop = core.need();
    if (!core.stack) core.stack = core.walker.walk(stop.context);
    return core.stack;
  }

  threads(): ThreadInfo[] {
    return this.core.stop ? this.core.stop.threads : [];
  }

  // The stopped program for the views and the evaluator. An edit through it ends what Step Back could undo.
  target(): Target {
    const core = this.core;
    const thread = core.need().thread;
    const edited = async (what: "memory" | "registers") => {
      core.history.barrier(BARRIERS.edited);
      await core.reload();
      core.emit({ type: "changed", what });
    };
    return {
      thread,
      context: () => core.need().context,
      setContext: async (context: ContextRecord) => {
        core.need();
        if (core.exception) {
          // the thread itself is in the system's dispatcher: the registers it will get back are in memory
          for (const change of core.exceptions.changes(core.exception, context)) await core.memory.write(change.address, change.bytes);
        } else {
          await core.engine.setContext(thread, context);
        }
        await edited("registers");
      },
      read: (address, length) => core.memory.read(address, length),
      write: async (address, bytes) => {
        core.need();
        const written = await core.memory.write(address, bytes);
        await edited("memory");
        if (written !== bytes.length) throw new ValueError("Memory at " + ((address + written) >>> 0).toString(16).toUpperCase() + "h cannot be written");
      },
      writableFlags: () => core.engine.features.writableFlags,
    };
  }

  // ---- ending ----

  // Stop Debugging: the program ends now, stopped or running. Its exit ends the session; if none comes, the
  // debugger lets go all the same.
  terminate(): Promise<void> {
    const core = this.core;
    core.ending = true;
    return core.enqueue(async () => {
      if (core.state === "ended") return;
      core.timers.clear(core.startTimer);
      core.startTimer = core.timers.set(() => core.background(() => core.finish("", null)), STOP_MS);
      try {
        if (core.modules.main) return await core.engine.terminate(1);
      } catch (error) {
        if (!(error instanceof EngineRefusal)) throw error;
      }
      await core.finish("", null);
    });
  }

  // The debugger lets go of the program, which runs on by itself.
  disconnect(message = ""): Promise<void> {
    this.core.ending = true;
    return this.core.enqueue(() => this.core.finish(message, null));
  }
}
