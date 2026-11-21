// What a session does when the engine says the program stopped. Most engine stops are not the user's: the
// entry point the debugger itself asked for, an exception nobody ticked, a breakpoint whose condition is
// false, the middle of a step. Each of those resumes, unless the user has asked for a Break meanwhile.
import { EngineEvent } from "../engine/engine";
import { DebugFailure } from "../report/failure";
import { decideHit } from "./breakpointHits";
import { SessionCore } from "./sessionCore";
import { StopReason } from "./sessionEvents";
import { confirmProgram } from "./startup";
import { BARRIERS } from "./stepHistory";

export async function handleStop(core: SessionCore, event: EngineEvent & { type: "stopped" }): Promise<void> {
  core.deciding = true;
  try {
    await decide(core, event);
  } finally {
    core.deciding = false;
  }
}

async function decide(core: SessionCore, event: EngineEvent & { type: "stopped" }): Promise<void> {
  const eip = event.state.context.eip;
  core.adopt(event.state);
  core.counting.note(event.count);
  core.timers.clear(core.waitingTimer);
  if (core.ending) return;

  let atEntry = false;
  if (!core.entered && eip === core.entry) {
    core.entered = atEntry = true;
    core.breakpoints.setInternal("entry", []);
    await confirmProgram(core.modules, event.state.context.fsBase, core.options.programPath);
    await core.refreshModules();
    if (await core.exceptions.locate()) core.breakpoints.setInternal("exceptions", core.exceptions.addresses());
    else core.emit({ type: "problem", failure: new DebugFailure("no-exception-stops") });
    core.counting.restart();
  }

  const raised = await core.exceptions.at(event.state);
  if (raised) {
    core.history.barrier(BARRIERS.exception);
    const output = await core.exceptions.debugOutput(raised);
    if (output !== null) {
      core.emit({ type: "output", text: output });
    } else if (core.exceptions.stops(raised)) {
      await core.adoptException(raised);
      return core.report({ reason: "exception", text: raised.text, breakpointIds: [], exception: { code: raised.code, firstChance: raised.firstChance, address: raised.address } });
    }
  }

  if (event.reason === "watch" && event.watch) {
    const data = core.breakpoints.dataAt(event.watch.address, event.watch.size);
    return core.report({ reason: "data breakpoint", text: "", breakpointIds: data ? [data.id] : [], watch: event.watch });
  }

  if (event.reason === "breakpoint" && !raised) {
    // a DLL loaded elsewhere than expected has its breakpoints elsewhere too: this one may not be one
    await core.refreshModules();
    const here = core.breakpoints.at(eip);
    const decision = await decideHit(here, core.conditions);
    for (const line of decision.logs) core.emit({ type: "output", text: line });
    if (decision.stop) {
      const first = here.filter((breakpoint) => breakpoint.id === decision.ids[0])[0];
      const reason: StopReason = first.kind === "function" ? "function breakpoint" : first.kind === "instruction" ? "instruction breakpoint" : "breakpoint";
      return core.report({ reason, text: decision.error, breakpointIds: decision.ids });
    }
  }

  if (event.reason === "pause" || core.pauseWanted) return core.report({ reason: "pause", text: "", breakpointIds: [] });
  if (atEntry && core.options.stopAtEntry) return core.report({ reason: "entry", text: "", breakpointIds: [] });

  if (core.activeStep) {
    const result = await core.activeStep.advance(event.state);
    if (result.state === "done") return core.report({ reason: "step", text: "", breakpointIds: [], returned: result.returned });
    if (result.state === "refused") return core.report({ reason: "step", text: result.message, breakpointIds: [] });
    if (result.state === "free") core.activeStep = null;
    return;
  }
  await core.breakpoints.sync(core.engine);
  await core.engine.continue(); // nobody wanted this stop
}
