import { DebugProtocol } from "@vscode/debugprotocol";
import { DisassembledLine, Disassembler } from "../../inspect/disassembly";
import { MasmDebugAdapter } from "../masmDebugAdapter";
import { memoryReference, parseReference } from "../references";
import { HandlerTable, RequestError } from "../shared";

const MAX_INSTRUCTIONS = 2000;
const hexByte = (byte: number) => ("0" + byte.toString(16).toUpperCase()).slice(-2);
const unknown = (where: number): DebugProtocol.DisassembledInstruction => ({ address: memoryReference(where), instruction: "??", presentationHint: "invalid" });

// The protocol wants exactly as many instructions as it asked for, with the address's own instruction where
// it expects it: what is not known is given as not known.
async function disassemble(adapter: MasmDebugAdapter, args: DebugProtocol.DisassembleArguments): Promise<DebugProtocol.DisassembleResponse["body"]> {
  const session = adapter.stopped();
  const base = parseReference(args.memoryReference);
  if (base === null) throw new RequestError("'" + args.memoryReference + "' is not an address");
  const address = (base + (args.offset || 0)) >>> 0;
  const count = Math.max(0, Math.min(args.instructionCount, MAX_INSTRUCTIONS));
  const before = Math.max(0, -(args.instructionOffset || 0)); // instructions wanted ahead of the address
  const skip = Math.max(0, args.instructionOffset || 0); // or instructions to pass over from it
  const disassembler = new Disassembler(await adapter.decoder(), session.modules, session.target().read);
  const lines = await disassembler.lines(address, before, count + skip);
  const shown = (line: DisassembledLine): DebugProtocol.DisassembledInstruction => {
    const place = line.statement && line.module ? adapter.sourceAt({ module: line.module, rva: line.address - line.module.base, statement: line.statement, procedure: line.statement.procedure }) : null;
    return {
      address: memoryReference(line.address),
      instructionBytes: Array.from(line.bytes, hexByte).join(" "),
      instruction: line.text,
      symbol: line.symbol || undefined,
      location: place ? place.source : undefined,
      line: place ? place.line : undefined,
    };
  };
  let instructions = lines.map(shown);
  const at = lines.findIndex((line) => line.address === address);
  const missing = before - Math.max(at, 0);
  if (missing > 0) instructions = Array.from({ length: missing }, (_, i) => unknown((address - missing + i) >>> 0)).concat(instructions);
  instructions = instructions.slice(skip, skip + count);
  let next = lines.length ? lines[lines.length - 1].address + lines[lines.length - 1].bytes.length : address;
  while (instructions.length < count) instructions.push(unknown(next++ >>> 0));
  return { instructions };
}

export const disassembly: HandlerTable = { disassemble };
