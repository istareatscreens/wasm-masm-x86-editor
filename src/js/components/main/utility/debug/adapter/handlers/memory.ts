import { DebugProtocol } from "@vscode/debugprotocol";
import { fromBase64, toBase64 } from "../../format/base64";
import { MasmDebugAdapter } from "../masmDebugAdapter";
import { memoryReference, parseReference } from "../references";
import { HandlerTable, RequestError } from "../shared";

const MAX_READ = 0x100000;
const SPACE = 0x100000000;

function addressOf(reference: string, offset: number | undefined): number {
  const address = parseReference(reference);
  if (address === null) throw new RequestError("'" + reference + "' is not an address");
  return address + (offset || 0);
}

// The bytes from the address up to the first one that cannot be read, and how many unreadable ones follow.
async function readMemory(adapter: MasmDebugAdapter, args: DebugProtocol.ReadMemoryArguments): Promise<DebugProtocol.ReadMemoryResponse["body"]> {
  const session = adapter.stopped();
  const address = addressOf(args.memoryReference, args.offset);
  const count = Math.max(0, Math.min(args.count, MAX_READ));
  if (address < 0 || address >= SPACE) return { address: memoryReference(0), unreadableBytes: count };
  const span = Math.min(count, SPACE - address);
  const read = await session.target().read(address, span);
  let readable = 0;
  while (readable < span && !read.unreadable[readable]) readable++;
  let after = readable;
  while (after < span && read.unreadable[after]) after++;
  // past the end of the address space nothing can be read either
  const unreadableBytes = after - readable + (after === span ? count - span : 0);
  return { address: memoryReference(address), data: readable ? toBase64(read.bytes.subarray(0, readable)) : undefined, unreadableBytes };
}

async function writeMemory(adapter: MasmDebugAdapter, args: DebugProtocol.WriteMemoryArguments): Promise<DebugProtocol.WriteMemoryResponse["body"]> {
  const session = adapter.stopped();
  const address = addressOf(args.memoryReference, args.offset);
  const bytes = fromBase64(args.data);
  if (!bytes) throw new RequestError("The bytes to write are not base64");
  if (address < 0 || address + bytes.length > SPACE) throw new RequestError("The bytes do not fit below the end of memory");
  await session.target().write(address, bytes);
  adapter.emit("memory", { memoryReference: memoryReference(address), offset: 0, count: bytes.length });
  return { bytesWritten: bytes.length };
}

export const memory: HandlerTable = { readMemory, writeMemory };
