// Statements: the code each source line assembled to. Built from the line pairs of every module, looked up by
// address and by file and line.
import { Procedure, ProgramInfo, ProgramModule } from "./programInfo";

export interface Statement {
  module: number;
  file: number; // an index into LineTable.files
  line: number; // the line shown: the largest of the lines recorded at this address
  lines: number[]; // every line recorded at this address, a PROC line and its first instruction for one
  rva: number;
  end: number;
  procedure: Procedure | null;
}

export type BindFailure = "no-code-at-line" | "no-code-after-line";

// where a breakpoint asked for on a line lands: on the line itself, or on the next line that has code
export interface LineBinding {
  line: number;
  statements: Statement[];
}

interface LineEntry {
  line: number;
  statement: Statement;
}

// the last entry whose key is at or below `value`, or -1
function lastAtOrBelow<T>(list: T[], value: number, key: (entry: T) => number): number {
  let low = 0;
  let high = list.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (key(list[middle]) <= value) low = middle + 1;
    else high = middle;
  }
  return low - 1;
}

export class LineTable {
  readonly files: string[] = []; // as recorded: full paths in the build's own file system
  readonly statements: Statement[] = []; // by address
  private readonly fileIndex = new Map<string, number>();
  private readonly lineIndex = new Map<number, LineEntry[][]>(); // per file: each module's entries, by line

  constructor(private readonly info: ProgramInfo) {
    for (const module of info.modules) this.addModule(module);
    this.statements.sort((a, b) => a.rva - b.rva);
    const perModule = new Map<string, LineEntry[]>();
    for (const statement of this.statements) {
      const key = statement.file + ":" + statement.module;
      if (!perModule.has(key)) {
        perModule.set(key, []);
        this.lineIndex.set(statement.file, (this.lineIndex.get(statement.file) || []).concat([perModule.get(key)]));
      }
      for (const line of statement.lines) perModule.get(key).push({ line, statement });
    }
    perModule.forEach((entries) => entries.sort((a, b) => a.line - b.line || a.statement.rva - b.statement.rva));
  }

  fileOf(name: string): number {
    const index = this.fileIndex.get(name.toLowerCase());
    return index === undefined ? -1 : index;
  }

  procedureAt(rva: number): Procedure | null {
    const procedures = this.info.procedures;
    const at = lastAtOrBelow(procedures, rva, (p) => p.rva);
    return at >= 0 && rva < procedures[at].rva + procedures[at].length ? procedures[at] : null;
  }

  statementAt(rva: number): Statement | null {
    const at = lastAtOrBelow(this.statements, rva, (s) => s.rva);
    return at >= 0 && rva < this.statements[at].end ? this.statements[at] : null;
  }

  // The statements a breakpoint on this line of this file stops at, in every module that assembled the file.
  bindLine(file: number, line: number): LineBinding | BindFailure {
    const exact: Statement[] = [];
    let moved: LineEntry[] = [];
    let later = false;
    for (const entries of this.lineIndex.get(file) || []) {
      const here = entries.filter((entry) => entry.line === line);
      for (const entry of here) if (exact.indexOf(entry.statement) < 0) exact.push(entry.statement);
      if (here.length) continue;
      const before = lastAtOrBelow(entries, line, (entry) => entry.line);
      const next = entries[before + 1];
      if (!next) continue;
      later = true;
      if (this.mayMoveTo(entries, before, next, line)) moved = moved.concat(entries.filter((entry) => entry.line === next.line));
    }
    if (exact.length) return { line, statements: exact.sort((a, b) => a.rva - b.rva) };
    if (!moved.length) return later ? "no-code-at-line" : "no-code-after-line";
    const target = Math.min.apply(null, moved.map((entry) => entry.line));
    const statements: Statement[] = [];
    for (const entry of moved) if (entry.line === target && statements.indexOf(entry.statement) < 0) statements.push(entry.statement);
    return { line: target, statements: statements.sort((a, b) => a.rva - b.rva) };
  }

  // A line without code moves down inside a procedure's own lines; outside every PROC, only between two
  // statements that are one run of code. So a line of data above a procedure never moves into it.
  private mayMoveTo(entries: LineEntry[], before: number, next: LineEntry, line: number): boolean {
    const procedure = next.statement.procedure;
    if (procedure && !procedure.synthetic) {
      return entries.some((entry) => entry.statement.procedure === procedure && entry.line < line);
    }
    const previous = before >= 0 ? entries[before].statement : null;
    return !!previous && !(previous.procedure && !previous.procedure.synthetic) && previous.end === next.statement.rva;
  }

  private addModule(module: ProgramModule): void {
    interface Pair {
      segment: number;
      offset: number;
      line: number;
      file: number;
    }
    const pairs: Pair[] = [];
    for (const file of module.files) {
      const key = file.name.toLowerCase();
      if (!this.fileIndex.has(key)) this.fileIndex.set(key, this.files.push(file.name) - 1);
      for (const table of file.tables) {
        for (const pair of table.pairs) pairs.push({ segment: table.segment, offset: pair[0], line: pair[1], file: this.fileIndex.get(key) });
      }
    }
    pairs.sort((a, b) => a.segment - b.segment || a.offset - b.offset);
    for (let i = 0; i < pairs.length; ) {
      const first = pairs[i];
      let j = i;
      while (j < pairs.length && pairs[j].segment === first.segment && pairs[j].offset === first.offset) j++;
      // several files at one address: the last one recorded names the statement
      const file = pairs[j - 1].file;
      const lines: number[] = [];
      for (let k = i; k < j; k++) if (pairs[k].file === file && lines.indexOf(pairs[k].line) < 0) lines.push(pairs[k].line);
      lines.sort((a, b) => a - b);
      const rva = this.info.rvaOf(first.segment, first.offset);
      const next = j < pairs.length && pairs[j].segment === first.segment ? pairs[j].offset : this.contributionEnd(module, first.segment, first.offset);
      i = j;
      if (rva === null) continue;
      const procedure = this.procedureAt(rva);
      let end = rva + (next - first.offset);
      if (procedure) end = Math.min(end, procedure.rva + procedure.length);
      this.statements.push({ module: module.index, file, line: lines[lines.length - 1], lines, rva, end, procedure });
    }
  }

  // where the module's code that holds `offset` ends in its segment
  private contributionEnd(module: ProgramModule, segment: number, offset: number): number {
    for (const part of module.segments) {
      if (part.segment === segment && offset >= part.offset && offset < part.offset + part.size) return part.offset + part.size;
    }
    return offset + 1;
  }
}
