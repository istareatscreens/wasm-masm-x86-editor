import { Animator, ANIMATE_SPEEDS } from "../../session/animate";
import { MasmDebugAdapter } from "../masmDebugAdapter";
import { parseReference } from "../references";
import { HandlerTable, RequestError } from "../shared";
import { lineTargets } from "./execution";

const realTimers = { set: (callback: () => void, ms: number): unknown => setTimeout(callback, ms), clear: (handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>) };

async function animate(adapter: MasmDebugAdapter, args: { speed?: number; granularity?: string; into?: boolean }): Promise<void> {
  const session = adapter.stopped();
  if (!adapter.animator || adapter.animator.session !== session) {
    adapter.animator = new Animator(session, adapter.host.timers || realTimers, () => adapter.now(), (active) => adapter.emit("masm/animating", { active }));
  }
  const byInstruction = args.granularity === "instruction";
  await adapter.animator.start(args.speed || ANIMATE_SPEEDS[0], { kind: byInstruction || args.into ? "into" : "over", byInstruction });
}

async function stopAnimating(adapter: MasmDebugAdapter): Promise<void> {
  if (adapter.animator) adapter.animator.stop();
}

// "Count instructions": kept for the sessions that follow, and applied to the one that runs
async function setCounting(adapter: MasmDebugAdapter, args: { on?: boolean }): Promise<{ on: boolean; available: boolean }> {
  adapter.counting = !!args.on;
  const session = adapter.session;
  if (!session || session.state === "ended" || session.state === "starting") return { on: adapter.counting, available: true };
  if (!session.counting.available) throw new RequestError("Instruction counting needs the MASM Runner terminal");
  await session.counting.set(adapter.counting);
  adapter.references.clear();
  adapter.emit("invalidated", { areas: ["variables"] });
  return { on: session.counting.on, available: true };
}

async function features(adapter: MasmDebugAdapter): Promise<object> {
  const engine = adapter.engine;
  const session = adapter.session && adapter.session.state !== "ended" ? adapter.session : null;
  return {
    stepBack: engine ? engine.features.stepBack : true,
    counting: engine ? engine.features.counting : true,
    countingOn: adapter.counting,
    animateSpeeds: ANIMATE_SPEEDS,
    stepBackAvailable: !!session && session.state === "stopped" && session.history.depth > 0,
    stepBackReason: session && session.history.depth === 0 ? session.history.reason : "",
  };
}

// Run to Cursor: to a line of a file, or to an address of the disassembly. Other breakpoints still stop.
async function runTo(adapter: MasmDebugAdapter, args: { source?: { path: string }; line?: number; instructionReference?: string }): Promise<void> {
  const session = adapter.stopped();
  let targets: number[];
  if (args.source && args.line) targets = (await lineTargets(adapter, session, args.source.path, args.line)).map((target) => target.address);
  else {
    const address = parseReference(args.instructionReference);
    if (address === null) throw new RequestError("Run to Cursor needs a line or an address");
    targets = [address];
  }
  await session.step({ kind: "to", byInstruction: false, targets });
}

export const custom: HandlerTable = { "masm/animate": animate, "masm/stopAnimating": stopAnimating, "masm/setCounting": setCounting, "masm/features": features, "masm/runTo": runTo };
