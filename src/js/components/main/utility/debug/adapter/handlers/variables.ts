import { DebugProtocol } from "@vscode/debugprotocol";
import { hexDigits } from "../../format/numbers";
import { autoExpressions } from "../../inspect/autos";
import { globalNodes, localNodes, registerNodes } from "../../inspect/scopes";
import { stackNodes } from "../../inspect/stackView";
import { ValueFormat, ValueNode, integerOf } from "../../inspect/values";
import { MasmDebugAdapter } from "../masmDebugAdapter";
import { References, memoryReference } from "../references";
import { HandlerTable, RequestError } from "../shared";

const STACK_ROWS = 64;

// A row as the protocol's Variable. A row's note (a flag's meaning, what a stack slot is) travels as its type,
// which front ends show beside or under the value.
export function variableOf(references: References, frame: number, node: ValueNode, format: ValueFormat): DebugProtocol.Variable {
  return {
    name: node.name,
    value: node.text(format),
    type: node.type || node.note || undefined,
    variablesReference: references.of(frame, node),
    namedVariables: node.named,
    indexedVariables: node.indexed,
    memoryReference: node.memory ? memoryReference(node.memory.address) : undefined,
    evaluateName: node.expression || undefined,
    presentationHint: node.assign ? undefined : { attributes: ["readOnly"] },
  };
}

async function scopes(adapter: MasmDebugAdapter, args: DebugProtocol.ScopesArguments): Promise<DebugProtocol.ScopesResponse["body"]> {
  const session = adapter.stopped();
  const frameId = args.frameId || 1;
  const frame = await adapter.frame(frameId);
  const expressions = await adapter.expressions(frameId);
  const target = session.target();
  const parse = expressions.parse;
  const add = (rows: () => Promise<ValueNode[]>) => adapter.references.add(frameId, rows);
  const autos = async (): Promise<ValueNode[]> => {
    const rows: ValueNode[] = [];
    const returned = session.lastStop && session.lastStop.returned;
    // what the procedure a step just ran left in EAX
    if (returned && frameId === 1) rows.push({ name: returned.name + " returned", text: (format) => "EAX = " + (format.hex ? hexDigits(BigInt(returned.eax >>> 0), 4) + "h" : String(returned.eax >>> 0)) });
    for (const name of session.counting.on ? ["$instructions", "$total"] : []) rows.push(await expressions.node(name));
    for (const expression of await autoExpressions(await adapter.decoder(), target.read, session.modules, frame)) {
      try {
        rows.push(await expressions.node(expression));
      } catch (error) {
        rows.push({ name: expression, text: () => (error instanceof Error ? error.message : String(error)) });
      }
    }
    return rows;
  };
  const stackRows = async () => stackNodes(target, integerOf(parse), await session.callStack(), session.modules, session.stop.context.esp, STACK_ROWS);
  return {
    scopes: [
      { name: "Registers", presentationHint: "registers", variablesReference: add(async () => registerNodes(target, parse)), expensive: false },
      { name: "Locals", presentationHint: "locals", variablesReference: add(() => localNodes(target, parse, frame)), expensive: false },
      { name: "Autos", variablesReference: add(autos), expensive: false },
      { name: "Globals", variablesReference: add(() => globalNodes(target, parse, session.modules)), expensive: true },
      { name: "Stack", variablesReference: add(stackRows), expensive: false },
    ],
  };
}

async function variables(adapter: MasmDebugAdapter, args: DebugProtocol.VariablesArguments): Promise<DebugProtocol.VariablesResponse["body"]> {
  adapter.stopped();
  const container = adapter.references.get(args.variablesReference);
  if (!container) throw new RequestError("That value is gone: the program has run since");
  const rows = await container.children(args.start, args.count);
  container.loaded = rows;
  const format = adapter.formatOf(args);
  return { variables: rows.map((node) => variableOf(adapter.references, container.frame, node, format)) };
}

async function setVariable(adapter: MasmDebugAdapter, args: DebugProtocol.SetVariableArguments): Promise<DebugProtocol.SetVariableResponse["body"]> {
  adapter.stopped();
  const container = adapter.references.get(args.variablesReference);
  const rows = container && (container.loaded || (await container.children()));
  const row = rows ? rows.filter((node) => node.name === args.name)[0] : undefined;
  if (!row) throw new RequestError("That value is gone: the program has run since");
  if (!row.assign) throw new RequestError("'" + args.name + "' cannot be changed");
  await row.assign(args.value);
  // the edit made every row stale: the new value is read again through the row's own expression
  const format = adapter.formatOf(args);
  if (!row.expression) return { value: args.value };
  const again = await (await adapter.expressions(container.frame)).node(row.expression);
  return { value: again.text(format), type: again.type, variablesReference: adapter.references.of(container.frame, again), namedVariables: again.named, indexedVariables: again.indexed };
}

export const variablesHandlers: HandlerTable = { scopes, variables, setVariable };
