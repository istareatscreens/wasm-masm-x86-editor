// Breakpoints are kept between sessions, and bound when a program is attached.
import { DebugProtocol } from "@vscode/debugprotocol";
import { BreakpointOptions } from "../../session/breakpoints";
import { DebugSession } from "../../session/debugSession";
import { breakpointOf } from "../eventBridge";
import { MasmDebugAdapter } from "../masmDebugAdapter";
import { memoryReference, parseReference } from "../references";
import { HandlerTable, RequestError, Stored } from "../shared";

type Conditions = { condition?: string; hitCondition?: string; logMessage?: string };
const optionsOf = (from: Conditions): BreakpointOptions => ({ enabled: true, condition: from.condition, hitCondition: from.hitCondition, logMessage: from.logMessage });
const live = (adapter: MasmDebugAdapter): DebugSession | null => (adapter.session && adapter.session.state !== "ended" ? adapter.session : null);

function setSource(adapter: MasmDebugAdapter, session: DebugSession, source: string, stored: Stored<DebugProtocol.SourceBreakpoint>[]) {
  return session.breakpoints.setSource(source, stored.map(({ id, wanted }) => ({ ...optionsOf(wanted), id, line: adapter.host.lineMapper.toBuilt(source, wanted.line) })));
}

const setFunctions = (session: DebugSession, stored: Stored<DebugProtocol.FunctionBreakpoint>[]) => session.breakpoints.setFunctions(stored.map(({ id, wanted }) => ({ ...optionsOf(wanted), id, name: wanted.name })));

// What the front end set, each with the id it had if it was set before (`same` says so), or a new one.
function withIds<T>(adapter: MasmDebugAdapter, wanted: T[], before: Stored<T>[], same: (a: T, b: T) => boolean): Stored<T>[] {
  const left = before.slice();
  return wanted.map((entry) => {
    const at = left.map((old) => same(old.wanted, entry)).indexOf(true);
    return { id: at < 0 ? adapter.nextBreakpointId() : left.splice(at, 1)[0].id, wanted: entry };
  });
}

export function applyStored(adapter: MasmDebugAdapter, session: DebugSession): void {
  adapter.stored.source.forEach((stored, source) => setSource(adapter, session, source, stored));
  setFunctions(session, adapter.stored.functions);
  if (adapter.stored.exceptionFilters) {
    session.exceptions.enabled.clear();
    adapter.stored.exceptionFilters.forEach((filter) => session.exceptions.enabled.add(filter));
  }
}

async function setBreakpoints(adapter: MasmDebugAdapter, args: DebugProtocol.SetBreakpointsArguments): Promise<DebugProtocol.SetBreakpointsResponse["body"]> {
  const source = args.source && args.source.path;
  if (!source) throw new RequestError("A breakpoint needs a file");
  const stored = withIds(adapter, args.breakpoints || [], adapter.stored.source.get(source) || [], (a, b) => a.line === b.line);
  if (stored.length) adapter.stored.source.set(source, stored);
  else adapter.stored.source.delete(source);
  const session = live(adapter);
  // with no program attached nothing can be bound yet: each is confirmed, by its id, when one is
  if (!session) return { breakpoints: stored.map(({ id, wanted }) => ({ id, verified: false, line: wanted.line, source: { path: source } })) };
  const set = setSource(adapter, session, source, stored);
  await session.applyBreakpoints();
  return { breakpoints: set.map((breakpoint, i) => ({ ...breakpointOf(adapter, breakpoint), line: breakpoint.verified ? breakpointOf(adapter, breakpoint).line : stored[i].wanted.line })) };
}

async function setFunctionBreakpoints(adapter: MasmDebugAdapter, args: DebugProtocol.SetFunctionBreakpointsArguments): Promise<DebugProtocol.SetFunctionBreakpointsResponse["body"]> {
  adapter.stored.functions = withIds(adapter, args.breakpoints || [], adapter.stored.functions, (a, b) => a.name === b.name);
  const session = live(adapter);
  if (!session) return { breakpoints: adapter.stored.functions.map(({ id }) => ({ id, verified: false })) };
  const set = setFunctions(session, adapter.stored.functions);
  await session.applyBreakpoints();
  return { breakpoints: set.map((breakpoint) => breakpointOf(adapter, breakpoint)) };
}

// instruction and data breakpoints belong to the session they were set in
async function setInstructionBreakpoints(adapter: MasmDebugAdapter, args: DebugProtocol.SetInstructionBreakpointsArguments): Promise<DebugProtocol.SetInstructionBreakpointsResponse["body"]> {
  const session = adapter.need();
  const wanted = (args.breakpoints || []).map((breakpoint) => {
    const address = parseReference(breakpoint.instructionReference);
    if (address === null) throw new RequestError("'" + breakpoint.instructionReference + "' is not an address");
    return { ...optionsOf(breakpoint), address: (address + (breakpoint.offset || 0)) >>> 0 };
  });
  const set = session.breakpoints.setInstructions(wanted);
  await session.applyBreakpoints();
  return { breakpoints: set.map((breakpoint) => breakpointOf(adapter, breakpoint)) };
}

const dataId = (address: number, size: number) => memoryReference(address) + ":" + size;

async function dataBreakpointInfo(adapter: MasmDebugAdapter, args: DebugProtocol.DataBreakpointInfoArguments): Promise<DebugProtocol.DataBreakpointInfoResponse["body"]> {
  const session = adapter.stopped();
  let place: { address: number; size: number } | undefined;
  let label = args.name;
  if (args.asAddress) {
    const address = parseReference(args.name);
    if (address === null) throw new RequestError("'" + args.name + "' is not an address");
    place = { address, size: args.bytes || 4 };
    label = session.modules.dataNameAt(address) || memoryReference(address);
  } else if (args.variablesReference) {
    const container = adapter.references.get(args.variablesReference);
    const rows = container && (container.loaded || (await container.children()));
    const row = rows ? rows.filter((node) => node.name === args.name)[0] : undefined;
    place = row && row.memory;
  } else {
    place = (await (await adapter.expressions(args.frameId)).node(args.name)).memory;
  }
  if (!place) return { dataId: null, description: "'" + args.name + "' is not in memory: only a value with an address can be watched" };
  if ([1, 2, 4, 8].indexOf(place.size) < 0) return { dataId: null, description: "A data breakpoint watches 1, 2, 4 or 8 bytes: name one element or field" };
  return { dataId: dataId(place.address, place.size) + ":" + label, description: label, accessTypes: ["write"], canPersist: false };
}

async function setDataBreakpoints(adapter: MasmDebugAdapter, args: DebugProtocol.SetDataBreakpointsArguments): Promise<DebugProtocol.SetDataBreakpointsResponse["body"]> {
  const session = adapter.need();
  const wanted = (args.breakpoints || []).map((breakpoint) => {
    const parts = /^(0x[0-9A-Fa-f]+):(\d+):?(.*)$/.exec(breakpoint.dataId);
    if (!parts) throw new RequestError("That is not a value a data breakpoint can watch");
    return { address: parseReference(parts[1]), size: Number(parts[2]), label: parts[3] };
  });
  const set = session.breakpoints.setData(wanted);
  await session.applyBreakpoints();
  return { breakpoints: set.map((breakpoint) => ({ id: breakpoint.id, verified: breakpoint.verified, message: breakpoint.message || undefined })) };
}

export const breakpoints: HandlerTable = { setBreakpoints, setFunctionBreakpoints, setInstructionBreakpoints, dataBreakpointInfo, setDataBreakpoints };
