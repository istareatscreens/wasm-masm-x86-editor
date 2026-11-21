// MASM's .data, .data? and .const, from JWlink's map file (bin\<program>.map). JWasm names them .data, .bss and
// .rdata; the linker places each module's part one after another, so a segment's first line is where it starts.
export interface MapSegment {
  name: string;
  className: string;
  address: number;
  size: number;
}

// a line of the Segments table: name (which may hold spaces), class, group, address and size in hexadecimal
const LINE = /^(\S(?:.*?\S)?)\s{2,}(\S+)\s+(\S+)\s+([0-9a-fA-F]{8})\s+([0-9a-fA-F]{8})\s*$/;

export function mapSegments(text: string): MapSegment[] {
  const start = text.indexOf("|   Segments   |");
  if (start < 0) return [];
  const end = text.indexOf("+-", text.indexOf("\n", text.indexOf("=======", start)));
  const segments: MapSegment[] = [];
  for (const line of text.slice(start, end < 0 ? undefined : end).split(/\r?\n/)) {
    const match = LINE.exec(line);
    if (match) segments.push({ name: match[1], className: match[2], address: parseInt(match[4], 16), size: parseInt(match[5], 16) });
  }
  return segments;
}

// The program's .data, .data? and .const that hold something, by MASM's names.
export function masmSegments(text: string): { name: string; address: number }[] {
  const wanted = [
    { name: ".data", segment: ".data", className: "DATA" },
    { name: ".data?", segment: ".bss", className: "BSS" },
    { name: ".const", segment: ".rdata", className: "CONST" },
  ];
  const segments = mapSegments(text);
  const found: { name: string; address: number }[] = [];
  for (const entry of wanted) {
    const segment = segments.filter((candidate) => candidate.name === entry.segment && candidate.className === entry.className && candidate.size > 0)[0];
    if (segment) found.push({ name: entry.name, address: segment.address });
  }
  return found;
}
