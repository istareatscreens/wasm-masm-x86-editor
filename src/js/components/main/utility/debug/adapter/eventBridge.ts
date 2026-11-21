import { DebugProtocol } from "@vscode/debugprotocol";
import { Expressions } from "../evaluate/expressions";
import { bigOf } from "../format/numbers";
import { Breakpoint } from "../session/breakpoints";
import { DebugSession } from "../session/debugSession";
import { failureOf } from "../report/failure";
import { exceptionHint } from "../session/exceptionHints";
import { SessionEvent, StopInfo } from "../session/sessionEvents";
import { MasmDebugAdapter } from "./masmDebugAdapter";
import { memoryReference } from "./references";

const PHRASES: { [reason: string]: string } = {
  entry: "Stopped at the program's first statement",
  step: "Stopped",
  breakpoint: "Stopped at a breakpoint",
  "function breakpoint": "Stopped at a breakpoint",
  "instruction breakpoint": "Stopped at a breakpoint",
  pause: "Stopped by Break",
  goto: "Next statement set",
};

export function breakpointOf(adapter: MasmDebugAdapter, breakpoint: Breakpoint): DebugProtocol.Breakpoint {
  const shown: DebugProtocol.Breakpoint = { id: breakpoint.id, verified: breakpoint.verified, message: breakpoint.message || undefined };
  if (breakpoint.addresses.length) shown.instructionReference = memoryReference(breakpoint.addresses[0]);
  if (breakpoint.kind === "source" && breakpoint.source !== undefined) {
    const line = breakpoint.line === undefined ? null : adapter.host.lineMapper.toCurrent(breakpoint.source, breakpoint.line);
    shown.source = { path: breakpoint.source };
    if (line !== null) shown.line = line;
  }
  return shown;
}

// "Stopped at a breakpoint — main.asm, line 21 · 21 instructions"
async function describe(adapter: MasmDebugAdapter, session: DebugSession, stop: StopInfo): Promise<string> {
  let text = PHRASES[stop.reason] || "Stopped";
  if (stop.reason === "exception" && stop.exception) text = (stop.exception.firstChance ? "Exception: " : "Exception unhandled: ") + stop.text;
  else if (stop.reason === "data breakpoint" && stop.watch) {
    const watched = session.breakpoints.dataAt(stop.watch.address, stop.watch.size);
    text = (watched && watched.label ? watched.label : memoryReference(stop.watch.address)) + " changed from " + bigOf(stop.watch.old) + " to " + bigOf(stop.watch.new);
  } else if (stop.text) text = stop.text;
  try {
    for (const frame of (await session.callStack()).frames) {
      const place = adapter.sourceAt(frame.location);
      if (!place) continue;
      text += " — " + place.source.name + ", line " + place.line;
      break;
    }
  } catch (error) {
    // the program was let run again before this stop was described: the line goes out without its place
  }
  const count = session.counting.sincePreviousStop;
  return count === null ? text : text + " · " + count + (count === BigInt(1) ? " instruction" : " instructions");
}

export function bridgeSession(adapter: MasmDebugAdapter, session: DebugSession): void {
  // a breakpoint's condition is evaluated where the program is, in its innermost frame
  session.conditions = (expression) => new Expressions({ target: session.target(), frame: null, modules: session.modules, counting: session.counting, constantNamed: adapter.host.constantNamed ? (name) => adapter.host.constantNamed(name) : undefined }).condition(expression);
  let chain: Promise<void> = Promise.resolve();
  const onEvent = async (event: SessionEvent): Promise<void> => {
    switch (event.type) {
      case "started":
        if (adapter.counting) await session.counting.set(true);
        adapter.emit("process", { name: adapter.launchArguments && adapter.launchArguments.program, startMethod: "launch" });
        break;
      case "stopped": {
        const stop = event.stop;
        adapter.emit("stopped", { reason: stop.reason, description: await describe(adapter, session, stop), threadId: stop.thread, allThreadsStopped: true, hitBreakpointIds: stop.breakpointIds, text: stop.text || undefined });
        adapter.emit("masm/state", {
          stepBack: { available: session.history.depth > 0, reason: session.history.depth > 0 ? "" : session.history.reason },
          counting: { on: session.counting.on, available: session.counting.available },
          hint: stop.exception ? exceptionHint(stop.exception.code) : "",
        });
        break;
      }
      case "continued":
        adapter.emit("continued", { threadId: session.stop ? session.stop.thread : 1, allThreadsContinued: true });
        break;
      case "waiting":
        adapter.emit("masm/waiting", {});
        break;
      case "output":
        adapter.emit("output", { category: "console", output: event.text + "\n" });
        break;
      case "breakpoints":
        for (const breakpoint of event.changed) adapter.emit("breakpoint", { reason: "changed", breakpoint: breakpointOf(adapter, breakpoint) });
        break;
      case "changed":
        adapter.emit("invalidated", { areas: event.what === "memory" ? ["variables"] : ["variables", "stacks"] });
        break;
      case "exited":
        adapter.emit("exited", { exitCode: event.code === null ? 0 : event.code });
        break;
      case "problem":
        adapter.emit("masm/failure", { kind: event.failure.kind, message: event.failure.message, url: adapter.reportUrl(event.failure), urlLabel: "Report bug", fatal: false });
        break;
      case "ended":
        if (adapter.animator) adapter.animator.stop();
        if (event.failure) adapter.emit("masm/failure", { kind: event.failure.kind, message: event.failure.message, url: adapter.reportUrl(event.failure), urlLabel: "Report bug", fatal: true });
        if (event.message) adapter.emit("output", { category: "important", output: event.message + "\n" });
        adapter.emit("terminated", {});
        break;
    }
  };
  session.listen((event) => {
    // what the front end was handed is stale the moment the program's state moves, not when it hears of it
    if (event.type === "stopped" || event.type === "continued" || event.type === "changed" || event.type === "ended") adapter.references.clear();
    // events keep their order though describing a stop takes a moment
    chain = chain.then(() => onEvent(event)).catch((error) => adapter.failed(failureOf(error)).catch((): void => undefined));
  });
}
