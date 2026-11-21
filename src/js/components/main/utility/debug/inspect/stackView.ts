import { Address } from "../engine/engine";
import { bigOf, bytesOf, fits } from "../format/numbers";
import { Modules } from "../session/modules";
import { CallStack } from "../session/stackWalker";
import { IntegerParser, Target, ValueError, ValueNode, hex8 } from "./values";

export interface StackNote {
  address: Address;
  text: string;
}

// where a return address leads: the statement the caller goes on with, which can be the line after its call
function lineAt(modules: Modules, address: Address): string {
  const location = modules.locate(address);
  if (!location || !location.statement || !location.module.sources) return "";
  return location.module.sources.nameOf(location.statement.file) + ", line " + location.statement.line;
}

export async function stackNotes(stack: CallStack, modules: Modules): Promise<StackNote[]> {
  const notes: StackNote[] = [];
  for (let i = 0; i < stack.frames.length; i++) {
    const frame = stack.frames[i];
    const caller = stack.frames[i + 1];
    if (frame.returnSlot !== null && caller) {
      const where = lineAt(modules, caller.eip) || (await modules.symbolFor(caller.eip)) || hex8(caller.eip) + "h";
      notes.push({ address: frame.returnSlot, text: "return to " + where });
    }
    const procedure = frame.location && frame.location.procedure;
    if (!frame.framed || !procedure) continue;
    notes.push({ address: frame.ebp, text: "saved EBP" });
    for (const local of procedure.locals) notes.push({ address: (frame.ebp + local.offset) >>> 0, text: local.name });
  }
  return notes;
}

export async function stackNodes(target: Target, parse: IntegerParser, stack: CallStack, modules: Modules, start: Address, count: number): Promise<ValueNode[]> {
  const context = target.context();
  const notes = await stackNotes(stack, modules);
  const read = await target.read(start, 4 * count);
  const rows: ValueNode[] = [];
  for (let i = 0; i < count; i++) {
    const address = (start + 4 * i) >>> 0;
    const readable = !read.unreadable[4 * i] && !read.unreadable[4 * i + 3];
    const marks = (address === context.esp ? ["ESP"] : []).concat(address === context.ebp ? ["EBP"] : [], notes.filter((note) => note.address === address).map((note) => note.text));
    rows.push({
      name: hex8(address),
      text: () => (readable ? hex8(Number(bigOf(read.bytes.subarray(4 * i, 4 * i + 4)))) : "????????"),
      note: marks.join(", "),
      memory: { address, size: 4 },
      async assign(typed: string) {
        const value = await parse(typed);
        if (!fits(value, 4)) throw new ValueError("The value does not fit a DWORD");
        await target.write(address, bytesOf(value, 4));
      },
    });
  }
  return rows;
}
