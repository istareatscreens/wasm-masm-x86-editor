import { DebugProtocol } from "@vscode/debugprotocol";
import { MasmDebugAdapter } from "../masmDebugAdapter";
import { memoryReference } from "../references";
import { HandlerTable } from "../shared";

async function evaluate(adapter: MasmDebugAdapter, args: DebugProtocol.EvaluateArguments): Promise<DebugProtocol.EvaluateResponse["body"]> {
  const frameId = args.frameId || 1;
  const expressions = await adapter.expressions(frameId);
  // only the Console may change the program: "target = expression"
  const node = await expressions.node(args.expression, args.context === "repl");
  return {
    result: node.text(adapter.formatOf(args)),
    type: node.type,
    variablesReference: adapter.references.of(frameId, node),
    namedVariables: node.named,
    indexedVariables: node.indexed,
    memoryReference: node.memory ? memoryReference(node.memory.address) : undefined,
    presentationHint: node.assign ? undefined : { attributes: ["readOnly"] },
  };
}

async function setExpression(adapter: MasmDebugAdapter, args: DebugProtocol.SetExpressionArguments): Promise<DebugProtocol.SetExpressionResponse["body"]> {
  const frameId = args.frameId || 1;
  const node = await (await adapter.expressions(frameId)).node("(" + args.expression + ") = " + args.value, true);
  return { value: node.text(adapter.formatOf(args)), type: node.type, variablesReference: adapter.references.of(frameId, node), namedVariables: node.named, indexedVariables: node.indexed };
}

export const evaluation: HandlerTable = { evaluate, setExpression };
