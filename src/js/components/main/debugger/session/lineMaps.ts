// The edits made to each source since the program being debugged was built, so that a breakpoint and the
// current line stay on their text. A file nobody edited needs no map.
import { LineEdit, LineMap, LineMapper } from "../../utility/debug/program/lineMapping";

export class LineMaps implements LineMapper {
  private maps = new Map<string, LineMap>();

  built(): void {
    this.maps.clear();
  }

  // One change of the editor's, described in the text as it was just before it, which had `lineCount` lines.
  edited(id: string, lineCount: number, edit: LineEdit): void {
    let map = this.maps.get(id);
    if (!map) this.maps.set(id, (map = new LineMap(lineCount)));
    map.apply(edit);
  }

  toBuilt(id: string, line: number): number | null {
    const map = this.maps.get(id);
    return map ? map.toBuilt(line) : line;
  }

  toCurrent(id: string, line: number): number | null {
    const map = this.maps.get(id);
    return map ? map.toCurrent(line) : line;
  }

  changedSinceBuild(id: string): boolean {
    const map = this.maps.get(id);
    return !!map && map.changed;
  }
}
