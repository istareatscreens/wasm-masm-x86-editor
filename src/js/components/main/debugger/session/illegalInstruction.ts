// An illegal-instruction stop, explained as the terminal's crash notice does it (crash/invalidOpcode.ts).
import { InvalidOpcode, classifyInvalidOpcode, invalidOpcodeHint } from "../../crash/invalidOpcode";
import { fromBase64 } from "../../utility/debug/format/base64";
import type { DapClient } from "./dapClient";

export const ILLEGAL_INSTRUCTION = "C000001Dh"; // the exception's code, as exceptionInfo names it
const LONGEST = 15; // the longest x86 instruction, in bytes

export interface IllegalInstructionHost {
  decoder(): Promise<unknown>; // the iced-x86 namespace
  invalidOpcodeReport(found: InvalidOpcode, address: string): string;
}

// The stop's hint and report, or null when the stop is not an illegal instruction or its bytes cannot be read.
export async function illegalInstruction(client: Pick<DapClient, "ask">, host: IllegalInstructionHost, threadId: number): Promise<{ hint: string; report: string } | null> {
  const info = await client.ask("exceptionInfo", { threadId });
  if ("refused" in info || info.body.exceptionId !== ILLEGAL_INSTRUCTION || !info.body.details || !info.body.details.evaluateName) return null;
  const reference: string = info.body.details.evaluateName;
  const memory = await client.ask("readMemory", { memoryReference: reference, count: LONGEST });
  if ("refused" in memory || !memory.body || !memory.body.data) return null;
  const hex = Array.from(fromBase64(memory.body.data), (byte) => ("0" + byte.toString(16)).slice(-2)).join("");
  const address = parseInt(reference, 16) >>> 0;
  const found = classifyInvalidOpcode(await host.decoder(), address, hex);
  const where = ("0000000" + address.toString(16).toUpperCase()).slice(-8);
  return { hint: invalidOpcodeHint(found), report: found.kind === "emulator-bug" ? host.invalidOpcodeReport(found, where) : "" };
}
