import { HandlerTable } from "../shared";
import { breakpoints } from "./breakpoints";
import { custom } from "./custom";
import { disassembly } from "./disassembly";
import { evaluation } from "./evaluate";
import { exceptions } from "./exceptions";
import { execution } from "./execution";
import { lifecycle } from "./lifecycle";
import { memory } from "./memory";
import { stack } from "./stack";
import { variablesHandlers } from "./variables";

export const HANDLERS: HandlerTable = {};
for (const table of [lifecycle, breakpoints, execution, stack, variablesHandlers, evaluation, memory, disassembly, exceptions, custom]) {
  for (const command of Object.keys(table)) HANDLERS[command] = table[command];
}
