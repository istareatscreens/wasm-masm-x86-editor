// What usually causes each kind of crash in a MASM program, in a sentence: shown with an exception stop in the
// debugger and with the terminal's notice when a program dies without one.

export type CrashKind = "fault" | "stack" | "divzero" | "illegal" | "privileged" | "other";

export const CRASH_HINTS: { [kind in CrashKind]: string } = {
  fault: "It touched an address it does not own (the .lst file shows where each instruction lives).",
  stack: "It ran out of stack: a PROC calling itself with no exit, or PUSH/CALL without a matching POP/RET.",
  divzero: "DIV/IDIV by zero, or a quotient too big for the register: check the divisor and clear EDX (CDQ) first.",
  illegal: "The CPU refused an instruction: execution probably ran past the end of the code (missing exit/RET) into data.",
  privileged: "Programs may not run privileged instructions (HLT, CLI, STI, IN, OUT, LGDT, ...): Windows ends them, as it does here.",
  other: "Fix the code and run it again.",
};

const KIND_OF_CODE: { [code: number]: CrashKind } = {
  0xc0000005: "fault",
  0xc00000fd: "stack",
  0xc0000094: "divzero",
  0xc0000095: "divzero",
  0xc000001d: "illegal",
  0xc0000096: "privileged",
};

export function crashKindOf(exceptionCode: number): CrashKind {
  return KIND_OF_CODE[exceptionCode >>> 0] || "other";
}

export function exceptionHint(exceptionCode: number): string {
  return CRASH_HINTS[crashKindOf(exceptionCode)];
}
