// A loaded image's export table, read from the program's memory: the names a debugger gives to code that has
// no debug information (KERNEL32!WriteConsoleA).
import { ByteReader } from "../codeview/reader";

export interface ExportTable {
  names: string[]; // by address
  addresses: number[]; // relative to the image's base, ascending
}

export type ImageRead = (rva: number, length: number) => Promise<Uint8Array | null>; // null: not readable

const DIRECTORY_EXPORT = 0;
const MAX_NAMES = 20000;
const MAX_TABLE = 0x200000;

export async function readExportTable(read: ImageRead): Promise<ExportTable> {
  const empty: ExportTable = { names: [], addresses: [] };
  const header = await read(0, 0x400);
  if (!header) return empty;
  const top = new ByteReader(header);
  try {
    if (top.u16(0) !== 0x5a4d) return empty;
    const pe = top.u32(0x3c);
    if (top.u32(pe) !== 0x4550 || top.u32(pe + 24 + 92) <= DIRECTORY_EXPORT) return empty;
    const start = top.u32(pe + 24 + 96);
    const size = top.u32(pe + 24 + 100);
    if (!start || !size || size > MAX_TABLE) return empty;
    const bytes = await read(start, size);
    if (!bytes) return empty;
    // every array and name of the table lies inside the directory's own range
    const table = new ByteReader(bytes);
    const count = Math.min(table.u32(24), MAX_NAMES);
    const functions = table.u32(28) - start;
    const namePointers = table.u32(32) - start;
    const ordinals = table.u32(36) - start;
    const found: { name: string; address: number }[] = [];
    for (let i = 0; i < count; i++) {
      const address = table.u32(functions + 4 * table.u16(ordinals + 2 * i));
      // an address inside the table is a forwarder's text, not code
      if (address >= start && address < start + size) continue;
      found.push({ name: table.zeroTerminated(table.u32(namePointers + 4 * i) - start, 256), address });
    }
    found.sort((a, b) => a.address - b.address);
    return { names: found.map((entry) => entry.name), addresses: found.map((entry) => entry.address) };
  } catch (error) {
    return empty; // headers that do not hold together name nothing
  }
}

// The export at or before `rva`, and how far past it `rva` is.
export function exportAt(table: ExportTable, rva: number): { name: string; offset: number } | null {
  let low = 0;
  let high = table.addresses.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (table.addresses[middle] <= rva) low = middle + 1;
    else high = middle;
  }
  return low ? { name: table.names[low - 1], offset: rva - table.addresses[low - 1] } : null;
}

export function exportNamed(table: ExportTable, name: string): number | null {
  const at = table.names.indexOf(name);
  return at < 0 ? null : table.addresses[at];
}
