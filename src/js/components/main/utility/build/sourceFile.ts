// What one MASM source file says that decides how a program is linked, read with the editor's Lezer grammar: its
// statements in order. A macro's body is kept apart (a template, which says something only where the macro is
// invoked); a FOR, FORC, REPEAT or WHILE block is assembled where it stands, so its statements stay in line.
import type { SyntaxNode } from "@lezer/common";
import { parser } from "../../editor/library/masm/parser.js";

export type Visibility = "public" | "private" | "export" | null;
export type CaseMap = "all" | "none" | "notpublic";

export type Statement =
  | { kind: "include"; argument: string; line: number }
  | { kind: "includelib"; argument: string; line: number }
  | { kind: "casemap"; mode: CaseMap }
  | { kind: "procDefault"; visibility: Visibility } // OPTION PROC:
  | { kind: "proc"; name: string; visibility: Visibility }
  | { kind: "define"; name: string } // data, a label, LABEL, a constant, COMM
  | { kind: "proto"; name: string }
  | { kind: "extern"; name: string; def: boolean } // EXTERN and EXTRN, or EXTERNDEF
  | { kind: "public"; name: string }
  | { kind: "text"; name: string; uses: string[] } // a text macro (EQU <...>, TEXTEQU): the names its text uses
  | { kind: "macro"; name: string; body: Statement[] }
  | { kind: "use"; names: string[] }
  | { kind: "end"; entry: string | null };

// Statements whose first identifier is the name they define or declare, not a use.
const NAMING = new Set(["ProcDirective", "ProtoDirective", "EndpDirective", "DataDefinition", "LabelDirective", "EquDirective",
  "TextEquDirective", "EqualsDirective", "MacroDirective", "StructDirective", "RecordDirective", "TypedefDirective",
  "SegmentDirective", "EndsDirective", "GroupDirective", "SizeStrDirective", "SubStrDirective", "InStrDirective"]);
// Identifiers that are parameters, fields or names being declared: never uses.
const NOT_USES = new Set(["Parameter", "ProtoArg", "MacroParameter", "LocalItem", "ExternItem", "PublicItem", "CommItem", "BitField",
  "Label", "ForDirective", "ForcDirective"]);
const REPEATS = new Set(["ForDirective", "ForcDirective", "RepeatDirective", "WhileDirective"]);

const firstChild = (node: SyntaxNode, name: string): SyntaxNode | null => {
  for (let child = node.firstChild; child; child = child.nextSibling) if (child.name === name) return child;
  return null;
};

class Reader {
  private lineStarts: number[] = [0];

  constructor(private text: string) {
    for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) this.lineStarts.push(i + 1);
  }

  slice(node: SyntaxNode): string {
    return this.text.slice(node.from, node.to);
  }

  between(from: number, to: number): string {
    return this.text.slice(from, to);
  }

  // where the line holding `at` ends (its line break)
  lineEnd(at: number): number {
    const end = this.text.slice(at).search(/[\r\n]/);
    return end < 0 ? this.text.length : at + end;
  }

  line(node: SyntaxNode): number {
    let low = 0, high = this.lineStarts.length - 1;
    while (low < high) {
      const mid = (low + high + 1) >> 1;
      if (this.lineStarts[mid] <= node.from) low = mid;
      else high = mid - 1;
    }
    return low + 1;
  }

  // the identifiers a statement uses
  uses(statement: SyntaxNode): string[] {
    const names: string[] = [];
    const naming = NAMING.has(statement.name) ? firstChild(statement, "Identifier") : null;
    const visit = (node: SyntaxNode): void => {
      for (let child = node.firstChild; child; child = child.nextSibling) {
        if (child.name === "Identifier") {
          if (!(naming && child.from === naming.from) && !NOT_USES.has(node.name)) names.push(this.slice(child));
        } else if (!NOT_USES.has(child.name)) visit(child);
      }
    };
    visit(statement);
    return names;
  }
}

// The argument of INCLUDE or INCLUDELIB as the assemblers take it: a <...> literal's text, or the rest of the line
// before ";", trimmed, spaces and quotes included (the grammar's FileName ends at a space).
function argumentOf(reader: Reader, directive: SyntaxNode): string {
  const literal = firstChild(directive, "TextLiteral");
  if (literal && reader.slice(literal).charAt(0) === "<") {
    const text = reader.slice(literal);
    return text.slice(1, text.lastIndexOf(">") > 0 ? text.lastIndexOf(">") : text.length);
  }
  const keyword = directive.firstChild as SyntaxNode;
  return reader.between(keyword.to, reader.lineEnd(keyword.to)).split(";")[0].trim();
}

const visibilityOf = (reader: Reader, node: SyntaxNode): Visibility => {
  for (let child = node.firstChild; child; child = child.nextSibling) {
    const word = reader.slice(child).toUpperCase();
    if ((child.name === "Attribute" || child.name === "Directive") && (word === "PUBLIC" || word === "PRIVATE" || word === "EXPORT"))
      return word.toLowerCase() as Visibility;
  }
  return null;
};

// The names a text macro's text uses (it is MASM text, read as a line of its own).
function textUses(text: string): string[] {
  const inner = text.charAt(0) === "<" ? text.slice(1, text.lastIndexOf(">") > 0 ? text.lastIndexOf(">") : text.length) : text;
  const reader = new Reader(inner);
  const names: string[] = [];
  for (let node = parser.parse(inner).topNode.firstChild; node; node = node.nextSibling) names.push(...reader.uses(node));
  return names;
}

function statementsOf(text: string): Statement[] {
  const reader = new Reader(text);
  const top: Statement[] = [];
  // open MACRO and repeat blocks: a macro collects its body, a repeat block's statements stay where they are
  const open: { macro: Statement[] | null }[] = [];
  let structs = 0;
  let restOfLine = -1; // an INCLUDE's argument runs to the end of its line, whatever the grammar made of it
  const target = (): Statement[] => {
    for (let i = open.length - 1; i >= 0; i--) if (open[i].macro) return open[i].macro as Statement[];
    return top;
  };
  for (let node = parser.parse(text).topNode.firstChild; node; node = node.nextSibling) {
    if (node.from < restOfLine) continue;
    const out = target();
    const name = firstChild(node, "Identifier");
    const named = name ? reader.slice(name) : "";
    switch (node.name) {
      case "IncludeDirective":
      case "IncludeLibDirective":
        out.push({ kind: node.name === "IncludeDirective" ? "include" : "includelib", argument: argumentOf(reader, node), line: reader.line(node) });
        restOfLine = reader.lineEnd(node.from);
        continue;
      case "OptionDirective":
        for (let item = node.firstChild; item; item = item.nextSibling) {
          if (item.name !== "OptionItem") continue;
          const words = reader.slice(item).toUpperCase().replace(/\s+/g, "").split(":");
          if (words[0] === "CASEMAP") out.push({ kind: "casemap", mode: words[1] === "ALL" ? "all" : words[1] === "NONE" ? "none" : "notpublic" });
          if (words[0] === "PROC") out.push({ kind: "procDefault", visibility: words[1] === "PRIVATE" ? "private" : words[1] === "EXPORT" ? "export" : "public" });
        }
        continue;
      case "MacroDirective": {
        const body: Statement[] = [];
        out.push({ kind: "macro", name: named, body });
        open.push({ macro: body });
        continue;
      }
      case "EndmDirective":
        if (open.length) open.pop();
        continue;
      case "StructDirective":
        structs++;
        continue;
      case "EndsDirective":
        if (structs > 0) structs--;
        continue;
      case "ProcDirective":
        out.push({ kind: "proc", name: named, visibility: visibilityOf(reader, node) });
        break;
      case "ProtoDirective":
        out.push({ kind: "proto", name: named });
        break;
      case "ExternDirective": {
        const def = reader.slice(node.firstChild as SyntaxNode).toUpperCase() === "EXTERNDEF";
        for (let item = node.firstChild; item; item = item.nextSibling)
          if (item.name === "ExternItem") out.push({ kind: "extern", name: reader.slice(firstChild(item, "Identifier") as SyntaxNode), def });
        break;
      }
      case "PublicDirective":
        for (let item = node.firstChild; item; item = item.nextSibling)
          if (item.name === "PublicItem") out.push({ kind: "public", name: reader.slice(firstChild(item, "Identifier") as SyntaxNode) });
        break;
      case "CommDirective":
        for (let item = node.firstChild; item; item = item.nextSibling)
          if (item.name === "CommItem") out.push({ kind: "define", name: reader.slice(firstChild(item, "Identifier") as SyntaxNode) });
        break;
      case "EquDirective":
      case "TextEquDirective": {
        const textItem = node.name === "TextEquDirective" ? firstChild(node, "TextItem") : node;
        const literal = textItem && firstChild(textItem, "TextLiteral");
        if (literal) out.push({ kind: "text", name: named, uses: textUses(reader.slice(literal)) });
        else if (node.name === "TextEquDirective") out.push({ kind: "text", name: named, uses: reader.uses(textItem as SyntaxNode) });
        else out.push({ kind: "define", name: named });
        if (literal || node.name === "TextEquDirective") continue; // the text is read where the macro is used
        break;
      }
      case "EqualsDirective":
      case "LabelDirective":
        out.push({ kind: "define", name: named });
        break;
      case "DataDefinition":
        if (name && !structs) out.push({ kind: "define", name: named });
        break;
      case "Label":
        out.push({ kind: "define", name: named });
        continue;
      case "EndDirective": {
        const expression = node.lastChild && node.lastChild.name !== "Directive" ? reader.slice(node.lastChild).trim() : "";
        out.push({ kind: "end", entry: expression || null });
        continue;
      }
      default:
        if (REPEATS.has(node.name)) open.push({ macro: null });
    }
    const uses = reader.uses(node);
    if (uses.length) out.push({ kind: "use", names: uses });
  }
  return top;
}

// Read once per content: the same text gives the same statements.
const cache = new Map<string, Statement[]>();
const CACHE_SIZE = 256;
export function sourceStatements(text: string): Statement[] {
  const known = cache.get(text);
  if (known) return known;
  const statements = statementsOf(text);
  if (cache.size >= CACHE_SIZE) cache.delete(cache.keys().next().value as string);
  cache.set(text, statements);
  return statements;
}
