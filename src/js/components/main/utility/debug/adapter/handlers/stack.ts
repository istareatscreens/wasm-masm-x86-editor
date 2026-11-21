import { DebugProtocol } from "@vscode/debugprotocol";
import { scalarText } from "../../inspect/variables";
import { DebugSession } from "../../session/debugSession";
import { Frame, MAX_FRAMES } from "../../session/stackWalker";
import { MasmDebugAdapter } from "../masmDebugAdapter";
import { memoryReference } from "../references";
import { HandlerTable, THREAD_NAME } from "../shared";

export const MORE_FRAMES = "More frames are not shown";

async function threads(adapter: MasmDebugAdapter): Promise<DebugProtocol.ThreadsResponse["body"]> {
  const session = adapter.session;
  const known = session && session.state !== "ended" ? session.threads() : [];
  if (!known.length) return { threads: [{ id: 1, name: THREAD_NAME }] };
  return { threads: known.map((thread, i) => ({ id: thread.id, name: i === 0 ? THREAD_NAME : "Thread " + thread.id + (thread.waiting ? " (waiting)" : "") })) };
}

// AddTwo(a=40, b=2): the parameters with their values, once the frame holds them
async function nameOf(adapter: MasmDebugAdapter, session: DebugSession, frame: Frame, hex: boolean): Promise<string> {
  const procedure = frame.location && frame.location.procedure;
  if (!procedure || !procedure.name || !frame.location.statement) return (await session.modules.symbolFor(frame.eip)) || memoryReference(frame.eip);
  const parameters = procedure.locals.filter((local) => local.offset > 0).sort((a, b) => a.offset - b.offset);
  if (!frame.framed || !parameters.length) return procedure.name + (parameters.length ? "(…)" : "");
  const types = frame.location.module.program.types;
  const shown: string[] = [];
  for (const parameter of parameters) {
    const type = types.resolve({ module: procedure.module, index: parameter.type });
    const read = await session.memory.read(frame.ebp + parameter.offset, type.size || 4);
    const scalar = type.kind === "integer" || type.kind === "real" || type.kind === "pointer";
    shown.push(parameter.name + "=" + (scalar && !read.unreadable.some((u) => u) ? scalarText(type, read.bytes, { hex }) : "…"));
  }
  return procedure.name + "(" + shown.join(", ") + ")";
}

async function stackTrace(adapter: MasmDebugAdapter, args: DebugProtocol.StackTraceArguments): Promise<DebugProtocol.StackTraceResponse["body"]> {
  const session = adapter.stopped();
  const stack = await session.callStack();
  const start = args.startFrame || 0;
  const wanted = stack.frames.slice(start, args.levels ? start + args.levels : undefined);
  const hex = !!(args.format && args.format.hex);
  const stackFrames: DebugProtocol.StackFrame[] = [];
  for (let i = 0; i < wanted.length; i++) {
    const frame = wanted[i];
    const place = adapter.sourceAt(frame.location);
    stackFrames.push({
      id: start + i + 1,
      name: await nameOf(adapter, session, frame, hex),
      source: place ? place.source : undefined,
      line: place ? place.line : 0,
      column: place ? 1 : 0,
      instructionPointerReference: memoryReference(frame.eip),
      // code without lines: Irvine32 and Windows. A front end shows a run of these as [External Code].
      presentationHint: place ? "normal" : "subtle",
    });
  }
  const total = stack.frames.length + (stack.truncated ? 1 : 0);
  if (stack.truncated && start + wanted.length >= stack.frames.length && (!args.levels || stackFrames.length < args.levels)) {
    stackFrames.push({ id: MAX_FRAMES + 1, name: MORE_FRAMES, line: 0, column: 0, presentationHint: "label" });
  }
  return { stackFrames, totalFrames: total };
}

export const stack: HandlerTable = { threads, stackTrace };
