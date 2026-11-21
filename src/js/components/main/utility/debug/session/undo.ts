// A step's bytes go back last write first, then the registers before its first instruction: one engine request.
import { StopState } from "../engine/engine";
import { DebugFailure } from "../report/failure";
import { SessionCore } from "./sessionCore";
import { BARRIERS } from "./stepHistory";

// Undoes one step, or with `toBreakpoint` steps until the program is at a breakpoint or nothing is left. Gives the
// stop as it then is, or the failure when the program's memory would not take its bytes back (the history is then
// dropped).
export async function undoSteps(core: SessionCore, toBreakpoint: boolean): Promise<{ state: StopState } | { failure: DebugFailure }> {
  const thread = core.stop.thread;
  for (;;) {
    const saved = core.history.take();
    const writes: { address: number; bytes: Uint8Array }[] = [];
    for (const instruction of saved) for (const write of instruction.writes.slice().reverse()) writes.push(write);
    const before = saved[saved.length - 1].context;
    const state = await core.engine.restore(thread, writes, before);
    core.memory.invalidate();
    if (!state) {
      core.history.barrier(BARRIERS.none);
      return { failure: new DebugFailure("step-back", "restart to be sure of the program's state") };
    }
    core.counting.undo(saved.length);
    if (!toBreakpoint || !core.history.depth || core.breakpoints.at(before.eip).length) return { state };
  }
}
