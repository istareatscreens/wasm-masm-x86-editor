import { DebugProtocol } from "@vscode/debugprotocol";
import { DebugSession } from "../../session/debugSession";
import { StepKind } from "../../session/stepping";
import { MasmDebugAdapter } from "../masmDebugAdapter";
import { memoryReference } from "../references";
import { HandlerTable, RequestError } from "../shared";

const step = (kind: StepKind) => async (adapter: MasmDebugAdapter, args: { granularity?: DebugProtocol.SteppingGranularity }) => {
  if (adapter.animator) adapter.animator.stop();
  await adapter.stopped().step({ kind, byInstruction: args.granularity === "instruction" });
};

async function resume(adapter: MasmDebugAdapter): Promise<DebugProtocol.ContinueResponse["body"]> {
  if (adapter.animator) adapter.animator.stop();
  await adapter.stopped().continue();
  return { allThreadsContinued: true };
}

async function pause(adapter: MasmDebugAdapter): Promise<void> {
  if (adapter.animator) adapter.animator.stop();
  await adapter.need().pause();
}

export async function lineTargets(adapter: MasmDebugAdapter, session: DebugSession, source: string, line: number): Promise<{ address: number; line: number; sameProcedure: boolean }[]> {
  const built = adapter.host.lineMapper.toBuilt(source, line);
  if (built === null) throw new RequestError("This line was added after the program was built");
  const here = session.modules.locate(session.stop.context.eip);
  const targets: { address: number; line: number; sameProcedure: boolean }[] = [];
  for (const module of session.modules.list) {
    if (!module.program || !module.program.lines || !module.sources) continue;
    for (const file of module.sources.filesOf(source)) {
      const bound = module.program.lines.bindLine(file, built);
      if (typeof bound === "string") continue;
      for (const statement of bound.statements) {
        const shown = adapter.host.lineMapper.toCurrent(source, bound.line);
        targets.push({ address: module.base + statement.rva, line: shown === null ? bound.line : shown, sameProcedure: !!here && here.module === module && here.procedure === statement.procedure });
      }
    }
  }
  if (!targets.length) throw new RequestError("No code at this line");
  return targets;
}

// A goto target's id is its address: ids need not outlive the stop they were asked at.
async function gotoTargets(adapter: MasmDebugAdapter, args: DebugProtocol.GotoTargetsArguments): Promise<DebugProtocol.GotoTargetsResponse["body"]> {
  const session = adapter.stopped();
  const targets = await lineTargets(adapter, session, args.source.path, args.line);
  return {
    targets: targets.map((target) => ({
      id: target.address,
      label: (args.source.name || "") + ", line " + target.line + (target.sameProcedure ? "" : " (outside the current procedure)"),
      line: target.line,
      instructionPointerReference: memoryReference(target.address),
    })),
  };
}

async function goTo(adapter: MasmDebugAdapter, args: DebugProtocol.GotoArguments): Promise<void> {
  await adapter.stopped().goTo(args.targetId >>> 0);
}

export const execution: HandlerTable = {
  continue: resume,
  next: step("over"),
  stepIn: step("into"),
  stepOut: step("out"),
  stepBack: async (adapter) => adapter.stopped().stepBack(false),
  reverseContinue: async (adapter) => adapter.stopped().stepBack(true),
  pause,
  gotoTargets,
  goto: goTo,
};
