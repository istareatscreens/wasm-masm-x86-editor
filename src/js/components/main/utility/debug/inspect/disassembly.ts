// Decoding never starts in the middle of an instruction: it starts at a statement, a procedure or a named
// routine, and runs forward from there.
import { Decoder, Instruction } from "../disasm/decoder";
import { Address, MemoryRead } from "../engine/engine";
import { Statement } from "../program/lineTable";
import { LoadedModule, Modules } from "../session/modules";

export interface DisassembledLine {
  address: Address;
  bytes: Uint8Array;
  text: string; // empty for bytes that could not be read
  symbol: string | null; // a name that starts here: a procedure, a label, a routine
  module: LoadedModule | null;
  statement: Statement | null; // set on the first instruction of a statement
}

type Read = (address: Address, length: number) => Promise<MemoryRead>;

const BACKWARD_WINDOW = 0x400; // how far back a known start is looked for
const BYTES_PER_INSTRUCTION = 8; // a generous average, to size one read

export class Disassembler {
  constructor(private readonly decoder: Decoder, private readonly modules: Modules, private readonly read: Read) {}

  // An address at or before `address` where an instruction is known to start; null when none is known.
  knownStart(address: Address): Address | null {
    const module = this.modules.moduleAt(address);
    const program = module && module.program;
    if (!program || !program.info) return null;
    const rva = address - module.base;
    let best = -1;
    const statement = program.lines.statementAt(rva);
    if (statement) best = statement.rva;
    for (const procedure of program.info.procedures) if (procedure.rva <= rva && procedure.rva > best) best = procedure.rva;
    for (const symbol of program.info.publics) if (symbol.rva <= rva && symbol.rva > best) best = symbol.rva;
    return best >= 0 && rva - best <= BACKWARD_WINDOW ? module.base + best : null;
  }

  // `count` instructions, the one at `address` being number `before` among them (0: it comes first). When
  // fewer instructions than asked for are known before it, the list starts later and is shorter.
  async lines(address: Address, before: number, count: number): Promise<DisassembledLine[]> {
    let start = address;
    let decoded: Instruction[] = [];
    // step back from one known start to an earlier one until enough instructions precede `address`
    for (let guard = 0; guard < 64; guard++) {
      decoded = await this.decodeFrom(start, address, count + before);
      const at = decoded.findIndex((instruction) => instruction.address === address);
      const earlier = start > 0 ? this.knownStart(start - 1) : null;
      if (at >= before || earlier === null || address - earlier > 16 * (before + 1) + BACKWARD_WINDOW) break;
      start = earlier;
    }
    let first = decoded.findIndex((instruction) => instruction.address === address);
    if (first < 0) {
      // the address is inside an instruction as decoded from the known start: it is shown from itself
      decoded = await this.decodeFrom(address, address, count);
      first = 0;
    }
    const from = Math.max(0, first - before);
    const lines: DisassembledLine[] = [];
    for (const instruction of decoded.slice(from, from + count)) lines.push(await this.line(instruction));
    return lines;
  }

  private async decodeFrom(start: Address, through: Address, count: number): Promise<Instruction[]> {
    const length = Math.min(0x100000000 - start, through - start + BYTES_PER_INSTRUCTION * count + 16);
    const read = await this.read(start, length);
    let readable = 0;
    while (readable < length && !read.unreadable[readable]) readable++;
    const instructions = this.decoder.decodeAll(read.bytes.subarray(0, readable), start);
    for (const instruction of instructions) (instruction as Instruction & { raw: Uint8Array }).raw = read.bytes.slice(instruction.address - start, instruction.address - start + instruction.length);
    return instructions;
  }

  private async line(instruction: Instruction): Promise<DisassembledLine> {
    const { modules } = this;
    const location = modules.locate(instruction.address);
    const name = await modules.symbolFor(instruction.address);
    let text = instruction.text;
    if (instruction.target !== null && (instruction.flow === "call" || instruction.flow === "jump" || instruction.flow === "conditional")) {
      const target = await modules.symbolFor(instruction.target);
      if (target) text = text.replace(/[0-9A-F]+h$/, target.replace(/^.*!/, ""));
    }
    for (const use of instruction.memory) {
      // an absolute operand that is a variable reads as the variable
      if (use.base || use.index || use.segment === "FS" || use.segment === "GS") continue;
      const module = modules.moduleAt(use.displacement);
      const info = module && module.program && module.program.info;
      const symbol = info ? info.data.filter((entry) => module.base + entry.rva === use.displacement)[0] : null;
      if (symbol) text = text.replace(new RegExp("(?:[a-z]s:)?\\[0*" + use.displacement.toString(16).toUpperCase() + "h\\]"), symbol.name);
    }
    return {
      address: instruction.address,
      bytes: (instruction as Instruction & { raw: Uint8Array }).raw,
      text,
      symbol: name && name.indexOf("+") < 0 ? name.replace(/^.*!/, "") : null,
      module: modules.moduleAt(instruction.address),
      statement: location && location.statement && location.module.base + location.statement.rva === instruction.address ? location.statement : null,
    };
  }
}
