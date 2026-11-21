import { DebugProtocol } from "@vscode/debugprotocol";
import { EXCEPTION_FILTERS } from "../session/exceptions";

export function capabilities(stepBack: boolean): DebugProtocol.Capabilities {
  return {
    supportsConfigurationDoneRequest: true,
    supportsFunctionBreakpoints: true,
    supportsConditionalBreakpoints: true,
    supportsHitConditionalBreakpoints: true,
    supportsLogPoints: true,
    supportsInstructionBreakpoints: true,
    supportsDataBreakpoints: true,
    supportsDataBreakpointBytes: true,
    supportsEvaluateForHovers: true,
    supportsSetVariable: true,
    supportsSetExpression: true,
    supportsValueFormattingOptions: true,
    supportsClipboardContext: true,
    supportsSteppingGranularity: true,
    supportsStepBack: stepBack,
    supportsGotoTargetsRequest: true,
    supportsRestartRequest: true,
    supportsTerminateRequest: true,
    supportTerminateDebuggee: true,
    supportsReadMemoryRequest: true,
    supportsWriteMemoryRequest: true,
    supportsDisassembleRequest: true,
    supportsExceptionInfoRequest: true,
    supportsExceptionFilterOptions: false,
    exceptionBreakpointFilters: EXCEPTION_FILTERS.map((filter) => ({ filter: filter.id, label: filter.label, default: true })),
  };
}
