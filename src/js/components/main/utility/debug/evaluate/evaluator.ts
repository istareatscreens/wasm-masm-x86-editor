// Inside brackets a variable stands for its address, as in a MASM operand ([table+4] is the element after the
// first); outside them it stands for its value (count + 1 is one more).
import { bigOf, bytesOf, fits } from "../format/numbers";
import { real10FromNumber, real10ToNumber, realBytes, realOf } from "../format/real";
import { isIntegerRegister, readRegister, writeRegister } from "../inspect/registers";
import { Target, ValueError, readBytes } from "../inspect/values";
import { Place } from "../inspect/variables";
import { resolveSymbol } from "../program/symbolLookup";
import { ResolvedType, TypeModel, TypeRef } from "../program/typeModel";
import { COUNTING_OFF, COUNTING_UNAVAILABLE, Counting } from "../session/counting";
import { LoadedModule, Modules } from "../session/modules";
import { Frame } from "../session/stackWalker";
import { arithmetic } from "./arithmetic";
import { ExpressionError } from "./lexer";
import { Node, Statement, parseStatement } from "./parser";
import { ONE, Value, ZERO, integer, literal, truth, whole } from "./values";

export interface Scope {
  target: Target;
  frame: Frame | null; // the frame expressions are evaluated in; null: where the thread is
  modules: Modules;
  counting: Counting | null;
  constantNamed?: (name: string) => boolean; // does the program's source define this name with EQU or = ?
}

const PRIMITIVES: { [name: string]: ResolvedType } = {};
[["BYTE", 1, false], ["SBYTE", 1, true], ["WORD", 2, false], ["SWORD", 2, true], ["DWORD", 4, false], ["SDWORD", 4, true], ["QWORD", 8, false], ["SQWORD", 8, true]].forEach(([name, size, signed]) => {
  PRIMITIVES[name as string] = { kind: "integer", name: name as string, size: size as number, signed: signed as boolean };
});
[["REAL4", 4], ["REAL8", 8], ["REAL10", 10], ["TBYTE", 10]].forEach(([name, size]) => (PRIMITIVES[name as string] = { kind: "real", name: name === "TBYTE" ? "REAL10" : (name as string), size: size as number }));
const DWORD = PRIMITIVES.DWORD;

export class Evaluator {
  private readonly module: LoadedModule | null;
  private readonly moduleIndex: number | null;

  constructor(private readonly scope: Scope) {
    const location = scope.frame ? scope.frame.location : scope.modules.locate(scope.target.context().eip);
    this.module = location ? location.module : scope.modules.main;
    this.moduleIndex = location ? (location.procedure ? location.procedure.module : location.statement ? location.statement.module : null) : null;
  }

  // The expression's value. With `allowAssignment`, "target = expression" writes it first and gives the new value.
  async evaluate(text: string, allowAssignment = false): Promise<{ value: Value; statement: Statement }> {
    const statement = parseStatement(text, allowAssignment);
    let value = await this.value(statement.expression);
    if (statement.target) {
      const target = await this.value(statement.target);
      await this.assign(target, value, statement.target.at);
      value = await this.value(statement.target);
    }
    return { value, statement };
  }

  private types(): TypeModel | null {
    return this.module && this.module.program ? this.module.program.types : null;
  }

  private placeOf(types: TypeModel, type: TypeRef, address: number): Place {
    return { address: address >>> 0, shape: types.resolve(type), types, type };
  }

  // What is at a place: a number for a scalar, the place itself for anything bigger.
  async load(place: Place): Promise<Value> {
    const shape = place.shape;
    if (shape.kind === "integer" || shape.kind === "pointer" || shape.kind === "bitfield") {
      const bytes = await readBytes(this.scope.target, place.address, shape.size);
      if (shape.kind !== "bitfield") return { kind: "integer", value: bigOf(bytes, !!shape.signed), size: shape.size, signed: !!shape.signed, place };
      return { kind: "integer", value: (bigOf(bytes) >> BigInt(shape.position || 0)) & ((ONE << BigInt(shape.bits || 0)) - ONE), size: shape.size, signed: false, place };
    }
    if (shape.kind === "real") {
      const bytes = await readBytes(this.scope.target, place.address, shape.size);
      return { kind: "real", value: realOf(bytes), size: shape.size, bytes, place };
    }
    return { kind: "aggregate", place };
  }

  private async value(node: Node): Promise<Value> {
    switch (node.kind) {
      case "number":
        return literal(node.value);
      case "real":
        return { kind: "real", value: node.value, size: 8 };
      case "st":
        return this.st(node.index);
      case "name":
        return this.named(node);
      case "deref":
        return this.load(await this.addressed(node.address, node.at));
      case "cast": {
        const operand = await this.value(node.operand);
        const place = "place" in operand && operand.place;
        if (!place) throw new ExpressionError("PTR needs a memory operand: write " + node.type.toUpperCase() + " PTR [register]", node.at);
        return this.load(this.retyped(place, node.type, node.at));
      }
      case "member": {
        const object = await this.value(node.object);
        if (!("place" in object) || !object.place) throw new ExpressionError("'." + node.name + "' needs a structure in memory before it", node.at);
        const field = (object.place.shape.fields || []).filter((entry) => entry.name.toLowerCase() === node.name.toLowerCase())[0];
        if (field) return this.load(this.placeOf(object.place.types, field.type, object.place.address + field.offset));
        // [esi].POINT.x: a type's name after the point says what is there
        if (this.typeNamed(node.name)) return this.load(this.retyped(object.place, node.name, node.at));
        throw new ExpressionError("'" + node.name + "' is not a field of " + object.place.shape.name, node.at);
      }
      case "index": {
        const object = await this.value(node.object);
        if (!("place" in object) || !object.place) throw new ExpressionError("An index needs a variable before it: for memory at an address, write [address]", node.at);
        const offset = whole(await this.value(node.offset), node.offset.at);
        return this.load(this.shifted(object.place, Number(BigInt.asIntN(32, offset))));
      }
      case "unary":
        return this.unary(node);
      default:
        return this.binary(node);
    }
  }

  // MASM indexing: a byte offset, with the element's type for an array
  private shifted(place: Place, by: number): Place {
    if (place.shape.kind === "array" && place.types) return this.placeOf(place.types, place.shape.element, place.address + by);
    return { ...place, address: (place.address + by) >>> 0 };
  }

  private typeNamed(name: string): boolean {
    return !!PRIMITIVES[name.toUpperCase()] || !!this.userType(name);
  }

  private retyped(place: Place, typeName: string, at: number): Place {
    const primitive = PRIMITIVES[typeName.toUpperCase()];
    if (primitive) return { address: place.address, shape: primitive, types: null, type: null };
    const types = this.types();
    const named = types && this.moduleIndex !== null ? types.named(this.moduleIndex, typeName) : null;
    if (!named) throw new ExpressionError("'" + typeName + "' is not a type", at);
    return this.placeOf(types, named, place.address);
  }

  // The place a bracketed expression names: variables give their addresses, registers and numbers their values.
  private async addressed(node: Node, at: number): Promise<Place> {
    let typed: Place | null = null;
    const address = async (inner: Node): Promise<bigint> => {
      if (inner.kind === "binary" && (inner.op === "+" || inner.op === "-" || inner.op === "*")) {
        const left = await address(inner.left);
        const right = await address(inner.right);
        return inner.op === "+" ? left + right : inner.op === "-" ? left - right : left * right;
      }
      const value = await this.value(inner);
      if ("place" in value && value.place) {
        typed = typed || (value.place.shape.kind === "array" && value.place.types ? this.placeOf(value.place.types, value.place.shape.element, value.place.address) : value.place);
        return BigInt(value.place.address);
      }
      return whole(value, inner.at);
    };
    const where = Number(BigInt.asUintN(32, await address(node)));
    const found = typed as Place | null;
    return found ? { ...found, address: where } : { address: where, shape: DWORD, types: null, type: null };
  }

  private async named(node: Node & { kind: "name" }): Promise<Value> {
    const { scope } = this;
    const lower = node.name.toLowerCase();
    const context = scope.target.context();
    if (!node.module) {
      if (isIntegerRegister(lower)) {
        // a caller's frame has its own EBP, ESP and EIP; the other registers are as they are now
        const frame = scope.frame;
        const own = frame && (lower === "ebp" ? frame.ebp : lower === "esp" ? frame.esp : lower === "eip" ? frame.eip : null);
        const read = readRegister(context, lower);
        return { kind: "integer", value: own !== null && own !== undefined ? BigInt(own) : read.value, size: read.size || 1, signed: false, register: lower };
      }
      const numbered = /^(st|mm|xmm)([0-7])$/.exec(lower);
      if (numbered && numbered[1] === "st") return this.st(Number(numbered[2]));
      if (numbered && numbered[1] === "mm") return { kind: "integer", value: bigOf(context.fpuRegister(Number(numbered[2])).subarray(0, 8)), size: 8, signed: false, register: lower };
      if (numbered) return { kind: "vector", bytes: context.xmm(Number(numbered[2])), register: lower };
      if (lower === "mxcsr") return { kind: "integer", value: BigInt(context.mxcsr), size: 4, signed: false, register: lower };
      if (lower === "$instructions" || lower === "$total") {
        const counting = scope.counting;
        const count = counting && counting.available ? (lower === "$total" ? counting.total : counting.sincePreviousStop) : null;
        if (count === null) throw new ExpressionError(counting && counting.available ? COUNTING_OFF : COUNTING_UNAVAILABLE, node.at);
        return integer(count, 8, false);
      }
      const frame = scope.frame;
      const location = frame ? frame.location : scope.modules.locate(context.eip);
      const local = location && location.procedure ? location.procedure.locals.filter((entry) => entry.name.toLowerCase() === lower)[0] : null;
      if (local) {
        const framed = frame ? frame.framed : await this.frameReady();
        if (!framed) throw new ExpressionError("'" + local.name + "' is not available until the procedure's frame is set up", node.at);
        const ebp = frame ? frame.ebp : context.ebp;
        return this.load(this.placeOf(location.module.program.types, { module: location.procedure.module, index: local.type }, ebp + local.offset));
      }
    }
    // the frame's own image first, then the others built with it
    const own = scope.modules.list.filter((module) => module.program && module.program.info);
    const ordered = this.module && own.indexOf(this.module) >= 0 ? [this.module].concat(own.filter((module) => module !== this.module)) : own;
    for (const module of ordered) {
      const result = resolveSymbol(module.program.info, node.name, module === this.module ? this.moduleIndex : null, node.module || undefined);
      if ("ambiguous" in result) throw new ExpressionError("'" + node.name + "' is in several modules (" + result.ambiguous.join(", ") + "): write " + result.ambiguous[0] + "!" + node.name, node.at);
      if (!("found" in result)) continue;
      const address = module.base + result.found.rva;
      if (result.found.kind === "data") return this.load(this.placeOf(module.program.types, { module: result.found.module, index: result.found.type }, address));
      if (result.found.kind === "public" && !module.program.lines.statementAt(result.found.rva) && !this.isCode(module, result.found.rva)) {
        return this.load({ address, shape: DWORD, types: null, type: null }); // another module's PUBLIC data: its type is not recorded here
      }
      return { ...integer(BigInt(address)), code: true };
    }
    if (scope.constantNamed && scope.constantNamed(node.name)) throw new ExpressionError("'" + node.name + "' is a constant the debug information does not keep", node.at);
    throw new ExpressionError("undefined symbol '" + (node.module ? node.module + "!" : "") + node.name + "'", node.at);
  }

  private st(index: number): Value {
    const context = this.scope.target.context();
    const physical = context.physicalOf(index);
    const bytes = context.fpuRegister(physical);
    return { kind: "real", value: real10ToNumber(bytes), size: 10, bytes, register: "st" + index, empty: context.fpuTag(physical) === 3 };
  }

  private isCode(module: LoadedModule, rva: number): boolean {
    const section = module.program.info.image.sections.filter((s) => rva >= s.virtualAddress && rva < s.virtualAddress + Math.max(s.virtualSize, 1))[0];
    return !!section && (section.characteristics & 0x20000000) !== 0;
  }

  // the innermost frame's EBP is the procedure's own once "push ebp / mov ebp, esp" has run
  private async frameReady(): Promise<boolean> {
    const context = this.scope.target.context();
    const location = this.scope.modules.locate(context.eip);
    if (!location || !location.procedure) return false;
    const start = location.module.base + location.procedure.rva;
    const head = await this.scope.target.read(start, 3);
    const standard = !head.unreadable[2] && head.bytes[0] === 0x55 && head.bytes[1] === 0x8b && head.bytes[2] === 0xec;
    if (!standard || context.eip - start < 3) return false;
    const here = await this.scope.target.read(context.eip, 1);
    return !(here.bytes[0] === 0xc3 || here.bytes[0] === 0xc2); // at the RET the frame is already gone
  }

  private async unary(node: Node & { kind: "unary" }): Promise<Value> {
    if (node.op === "TYPE" || node.op === "SIZEOF" || node.op === "LENGTHOF") {
      const named = node.operand.kind === "name" && !node.operand.module ? PRIMITIVES[node.operand.name.toUpperCase()] || this.userType(node.operand.name) : null;
      if (named) return integer(BigInt(node.op === "LENGTHOF" ? 1 : named.size));
      const operand = await this.value(node.operand);
      const shape = "place" in operand && operand.place ? operand.place.shape : null;
      if (!shape) return integer(BigInt(node.op === "LENGTHOF" ? 1 : operand.kind === "integer" && operand.register ? operand.size : 0));
      const element = shape.kind === "array" && operand.kind !== "vector" && "place" in operand && operand.place.types ? operand.place.types.resolve(shape.element) : shape;
      return integer(BigInt(node.op === "SIZEOF" ? shape.size : node.op === "TYPE" ? element.size : shape.kind === "array" ? shape.count || 0 : 1));
    }
    const operand = await this.value(node.operand);
    if (node.op === "OFFSET") {
      if ("place" in operand && operand.place) return integer(BigInt(operand.place.address));
      if (operand.kind === "integer" && operand.code) return operand;
      throw new ExpressionError("OFFSET needs a variable or a label", node.at);
    }
    if (operand.kind === "real" && node.op !== "NOT") return { kind: "real", value: node.op === "-" ? -operand.value : operand.value, size: 8 };
    const value = whole(operand, node.operand.at);
    const size = operand.kind === "integer" ? Math.max(operand.size, 4) : 4;
    if (node.op === "NOT") return operand.kind === "integer" && operand.truth ? truth(value === ZERO) : integer(~value, size, false);
    return node.op === "-" ? integer(-value, size, true) : integer(value, size, operand.kind === "integer" && operand.signed);
  }

  private userType(name: string): ResolvedType | null {
    const types = this.types();
    const named = types && this.moduleIndex !== null ? types.named(this.moduleIndex, name) : null;
    return named ? types.resolve(named) : null;
  }

  private async binary(node: Node & { kind: "binary" }): Promise<Value> {
    const left = await this.value(node.left);
    const right = await this.value(node.right);
    const op = node.op;
    // an array or a structure, plus or minus a number, is the place that many bytes on
    if (left.kind === "aggregate" && (op === "+" || op === "-")) {
      if (right.kind === "aggregate" && op === "-") return integer(BigInt(left.place.address - right.place.address), 4, true);
      const by = Number(BigInt.asIntN(32, whole(right, node.right.at)));
      return this.load(this.shifted(left.place, op === "+" ? by : -by));
    }
    return arithmetic(op, left, right, { left: node.left.at, right: node.right.at, op: node.at });
  }

  // Writes `value` where `target` is: a register, or a number in memory. A value that does not fit is refused.
  private async assign(target: Value, value: Value, at: number): Promise<void> {
    const { scope } = this;
    if (value.kind !== "integer" && value.kind !== "real") throw new ExpressionError("Only a number can be assigned", at);
    if (target.kind === "integer" && target.register && isIntegerRegister(target.register)) {
      const context = scope.target.context().clone();
      try {
        writeRegister(context, target.register, whole(value, at), scope.target.writableFlags());
      } catch (error) {
        throw new ExpressionError(error instanceof ValueError ? error.message : String(error), at);
      }
      return scope.target.setContext(context);
    }
    if (target.kind === "real" && target.register) {
      const context = scope.target.context().clone();
      const physical = context.physicalOf(Number(target.register.slice(2)));
      context.setFpuRegister(physical, real10FromNumber(value.kind === "real" ? value.value : Number(value.value)));
      context.setFpuTag(physical, 0);
      return scope.target.setContext(context);
    }
    const place = "place" in target ? target.place : undefined;
    if (!place || target.kind === "aggregate" || place.shape.kind === "bitfield") throw new ExpressionError("This cannot be assigned to: assign to a register or to a number in memory", at);
    if (place.shape.kind === "real") return scope.target.write(place.address, realBytes(value.kind === "real" ? value.value : Number(value.value), place.shape.size));
    const number = whole(value, at);
    if (!fits(number, place.shape.size)) throw new ExpressionError("The value does not fit a " + place.shape.name, at);
    return scope.target.write(place.address, bytesOf(number, place.shape.size));
  }
}

export function truthy(value: Value): boolean {
  if (value.kind === "integer") return value.value !== ZERO;
  if (value.kind === "real") return value.value !== 0;
  throw new ExpressionError("A condition needs a number");
}
