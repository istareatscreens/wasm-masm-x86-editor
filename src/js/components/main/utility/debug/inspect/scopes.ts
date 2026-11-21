import { LoadedModule, Modules } from "../session/modules";
import { Frame } from "../session/stackWalker";
import { fpuNodes } from "./fpu";
import { integerRegisterNodes } from "./registers";
import { mmxNodes, xmmNodes } from "./simd";
import { Target, ValueNode, ValueParser, integerOf } from "./values";
import { placeNode, placeOf } from "./variables";

export const FRAME_NOT_READY = "Not available until the procedure's frame is set up";

const group = (name: string, rows: () => ValueNode[]): ValueNode => ({ name, text: () => "", named: rows().length, children: async () => rows() });

export function registerNodes(target: Target, parse: ValueParser): ValueNode[] {
  return integerRegisterNodes(target, integerOf(parse)).concat([group("FPU", () => fpuNodes(target, parse)), group("MMX", () => mmxNodes(target, parse)), group("SSE", () => xmmNodes(target, parse))]);
}

// The frame's parameters in the order they were declared, then its LOCALs.
export async function localNodes(target: Target, parse: ValueParser, frame: Frame): Promise<ValueNode[]> {
  const location = frame.location;
  if (!location || !location.procedure || !location.module.program) return [];
  const locals = location.procedure.locals;
  const ordered = locals.filter((local) => local.offset >= 0).sort((a, b) => a.offset - b.offset).concat(locals.filter((local) => local.offset < 0));
  return Promise.all(
    ordered.map((local): Promise<ValueNode> | ValueNode => {
      if (!frame.framed) return { name: local.name, text: () => FRAME_NOT_READY };
      const place = placeOf(location.module.program.types, { module: location.procedure.module, index: local.type }, frame.ebp + local.offset);
      return placeNode(target, parse, local.name, place, local.name);
    }),
  );
}

function dataOf(target: Target, parse: ValueParser, module: LoadedModule, index: number, qualify: boolean): Promise<ValueNode[]> {
  const info = module.program.info;
  const owner = info.modules.filter((entry) => entry.index === index)[0];
  const symbols = info.data.filter((symbol) => symbol.module === index).sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1));
  return Promise.all(symbols.map((symbol) => placeNode(target, parse, symbol.name, placeOf(module.program.types, { module: index, index: symbol.type }, module.base + symbol.rva), qualify ? owner.shortName + "!" + symbol.name : symbol.name)));
}

// Every data symbol. One module's are listed as they are; several modules each get a row to open.
export async function globalNodes(target: Target, parse: ValueParser, modules: Modules): Promise<ValueNode[]> {
  const groups: { name: string; module: LoadedModule; index: number }[] = [];
  for (const module of modules.list) {
    const info = module.program && module.program.info;
    if (!info) continue;
    for (const entry of info.modules) if (info.data.some((symbol) => symbol.module === entry.index)) groups.push({ name: entry.shortName, module, index: entry.index });
  }
  if (groups.length === 1) return dataOf(target, parse, groups[0].module, groups[0].index, false);
  return groups.map((entry) => ({
    name: entry.name,
    text: () => "",
    named: entry.module.program.info.data.filter((symbol) => symbol.module === entry.index).length,
    children: () => dataOf(target, parse, entry.module, entry.index, true),
  }));
}
