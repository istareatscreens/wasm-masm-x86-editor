import { DebugProtocol } from "@vscode/debugprotocol";
import { exceptionHint } from "../../session/exceptionHints";
import { EXCEPTION_FILTERS, exceptionText } from "../../session/exceptions";
import { MasmDebugAdapter } from "../masmDebugAdapter";
import { memoryReference } from "../references";
import { HandlerTable, RequestError } from "../shared";

async function setExceptionBreakpoints(adapter: MasmDebugAdapter, args: DebugProtocol.SetExceptionBreakpointsArguments): Promise<DebugProtocol.SetExceptionBreakpointsResponse["body"]> {
  const known = EXCEPTION_FILTERS.map((filter) => filter.id);
  const wanted = (args.filters || []).filter((id) => known.indexOf(id) >= 0);
  adapter.stored.exceptionFilters = wanted;
  const session = adapter.session;
  if (session && session.state !== "ended") {
    session.exceptions.enabled.clear();
    wanted.forEach((id) => session.exceptions.enabled.add(id));
  }
  return { breakpoints: (args.filters || []).map((id) => ({ verified: known.indexOf(id) >= 0 })) };
}

async function exceptionInfo(adapter: MasmDebugAdapter): Promise<DebugProtocol.ExceptionInfoResponse["body"]> {
  const session = adapter.stopped();
  const raised = session.lastStop && session.lastStop.exception;
  if (!raised) throw new RequestError("The program is not stopped at an exception");
  const code = ("0000000" + (raised.code >>> 0).toString(16).toUpperCase()).slice(-8) + "h";
  return {
    exceptionId: code,
    description: session.lastStop.text + ". " + exceptionHint(raised.code),
    breakMode: raised.firstChance ? "always" : "unhandled",
    details: { message: exceptionText(raised.code, []), typeName: code, evaluateName: memoryReference(raised.address) },
  };
}

export const exceptions: HandlerTable = { setExceptionBreakpoints, exceptionInfo };
