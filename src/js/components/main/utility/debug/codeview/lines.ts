// sstSrcModule: the source files of one module, and for each the pairs of code offset and line number.
import { CvSubsection } from "./directory";
import { ByteReader } from "./reader";

export interface CvLineTable {
  segment: number;
  pairs: [number, number][]; // [offset in the segment, line]
}

export interface CvSourceFile {
  name: string; // as the assembler recorded it: a full path
  tables: CvLineTable[];
}

export function readSourceModule(reader: ByteReader, subsection: CvSubsection): CvSourceFile[] {
  const base = subsection.offset;
  const fileCount = reader.u16(base);
  const files: CvSourceFile[] = [];
  for (let f = 0; f < fileCount; f++) {
    const file = base + reader.u32(base + 4 + 4 * f);
    const tableCount = reader.u16(file);
    const tables: CvLineTable[] = [];
    for (let t = 0; t < tableCount; t++) {
      const table = base + reader.u32(file + 4 + 4 * t);
      const pairCount = reader.u16(table + 2);
      const pairs: [number, number][] = [];
      for (let p = 0; p < pairCount; p++) pairs.push([reader.u32(table + 4 + 4 * p), reader.u16(table + 4 + 4 * pairCount + 2 * p)]);
      tables.push({ segment: reader.u16(table), pairs });
    }
    // after the file's table offsets come its segments' start and end offsets, then its name
    files.push({ name: reader.name(file + 4 + 12 * tableCount).text, tables });
  }
  return files;
}
