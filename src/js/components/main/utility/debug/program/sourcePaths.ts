// The debug information names each source by its path where the program was built. The host knows which of
// its own files that is: a drawer path in the web app, a file on disk in VS Code.
import { LineTable } from "./lineTable";

export interface ResolvedSource {
  id: string; // the host's name for the file; two paths to one file give one id
  name: string; // what to show: the file's own name
}

export interface SourceResolver {
  // null: a file the user cannot open (the toolchain's own, or one renamed or removed since the build)
  resolve(builtPath: string): ResolvedSource | null;
}

export function leafName(path: string): string {
  return path.slice(Math.max(path.lastIndexOf("\\"), path.lastIndexOf("/")) + 1);
}

export class SourcePaths {
  private readonly resolved = new Map<number, ResolvedSource | null>();

  constructor(private readonly lines: LineTable, private readonly resolver: SourceResolver) {}

  sourceOf(file: number): ResolvedSource | null {
    if (!this.resolved.has(file)) this.resolved.set(file, this.resolver.resolve(this.lines.files[file]));
    return this.resolved.get(file);
  }

  // the program's files that are this file of the host's: one, unless two built paths lead to it
  filesOf(id: string): number[] {
    const files: number[] = [];
    for (let file = 0; file < this.lines.files.length; file++) {
      const source = this.sourceOf(file);
      if (source && source.id === id) files.push(file);
    }
    return files;
  }

  nameOf(file: number): string {
    const source = this.sourceOf(file);
    return source ? source.name : leafName(this.lines.files[file]);
  }

  // after the user renamed, moved or removed files: ask the host again
  refresh(): void {
    this.resolved.clear();
  }
}
