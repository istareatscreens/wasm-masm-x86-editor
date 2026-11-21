// Lines move as the user edits a source after its program was built. A LineMap remembers, for each line of the
// source as it is now, which line of the built source it was.

// One edit, described in the text as it was just before it.
export interface LineEdit {
  line: number; // the first line the edit touches, from 1
  removed: number; // line breaks it removes
  inserted: number; // line breaks it inserts
  fromLineStart: boolean; // it begins at the start of its first line
  toLineEnd: boolean; // it ends at the end of its last line
}

// What a session asks of its host about edits since the build. `id` is the host's name for a source file.
export interface LineMapper {
  toBuilt(id: string, line: number): number | null; // null: the line was typed after the build
  toCurrent(id: string, line: number): number | null; // null: the line was removed after the build
  changedSinceBuild(id: string): boolean;
}

export class LineMap {
  private built: (number | null)[] = [];
  private edited = false;

  constructor(lineCount: number) {
    for (let line = 1; line <= lineCount; line++) this.built.push(line);
  }

  get changed(): boolean {
    return this.edited;
  }

  get lineCount(): number {
    return this.built.length;
  }

  toBuilt(line: number): number | null {
    const value = this.built[line - 1];
    return value === undefined ? null : value;
  }

  toCurrent(builtLine: number): number | null {
    const at = this.built.indexOf(builtLine);
    return at < 0 ? null : at + 1;
  }

  // A line keeps its place in the build when its text stays: the part before an edit keeps the first line's,
  // and the part after it keeps the last line's when the edit took the first line whole.
  apply(edit: LineEdit): void {
    this.edited = true;
    if (!edit.removed && !edit.inserted) return;
    const first = this.toBuilt(edit.line);
    const last = this.toBuilt(edit.line + edit.removed);
    const lines: (number | null)[] = [];
    for (let i = 0; i <= edit.inserted; i++) lines.push(null);
    if (edit.fromLineStart && (!edit.toLineEnd || (edit.removed > 0 && !edit.inserted))) lines[edit.inserted] = last;
    else lines[0] = first;
    if (!edit.fromLineStart && !edit.toLineEnd && edit.inserted && edit.removed) lines[edit.inserted] = last;
    this.built.splice.apply(this.built, [edit.line - 1, edit.removed + 1].concat(lines as number[]));
  }
}
