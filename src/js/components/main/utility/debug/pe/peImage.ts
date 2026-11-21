import { ByteReader, DebugInfoError } from "../codeview/reader";

export interface PeSection {
  name: string;
  virtualAddress: number; // relative to the image base
  virtualSize: number;
  rawOffset: number; // in the file
  rawSize: number;
  characteristics: number;
}

export interface PeImage {
  imageBase: number;
  entryPoint: number; // relative to the image base
  sizeOfImage: number;
  dll: boolean;
  sections: PeSection[];
  directories: { address: number; size: number }[];
  importedDlls: string[]; // the names in the import table, as written there
  codeView: { offset: number; size: number } | null; // the debug directory's CodeView entry, in the file
}

const MACHINE_I386 = 0x14c;
const PE32 = 0x10b;
const FILE_DLL = 0x2000;
const DIRECTORY_IMPORT = 1;
const DIRECTORY_DEBUG = 6;
const IMPORT_ENTRY_SIZE = 20;
const DEBUG_ENTRY_SIZE = 28;
const DEBUG_TYPE_CODEVIEW = 2;
const SECTION_SIZE = 40;

// The file offset of an address relative to the image base; null when no section holds it.
export function fileOffsetOf(image: PeImage, address: number): number | null {
  for (const section of image.sections) {
    const offset = address - section.virtualAddress;
    if (offset >= 0 && offset < Math.max(section.virtualSize, section.rawSize)) return offset < section.rawSize ? section.rawOffset + offset : null;
  }
  return null;
}

export function readPeImage(reader: ByteReader): PeImage {
  if (reader.length < 0x40 || reader.u16(0) !== 0x5a4d) throw new DebugInfoError("This is not a Windows program", 0);
  const pe = reader.u32(0x3c);
  if (reader.u32(pe) !== 0x4550) throw new DebugInfoError("This is not a Windows program", pe);
  const optional = pe + 24;
  if (reader.u16(pe + 4) !== MACHINE_I386 || reader.u16(optional) !== PE32) throw new DebugInfoError("This is not a 32-bit Windows program", pe + 4);
  const sectionCount = reader.u16(pe + 6);
  const optionalSize = reader.u16(pe + 20);
  const image: PeImage = {
    imageBase: reader.u32(optional + 28),
    entryPoint: reader.u32(optional + 16),
    sizeOfImage: reader.u32(optional + 56),
    dll: (reader.u16(pe + 22) & FILE_DLL) !== 0,
    sections: [],
    directories: [],
    importedDlls: [],
    codeView: null,
  };
  const directoryCount = Math.min(16, reader.u32(optional + 92));
  for (let i = 0; i < directoryCount; i++) image.directories.push({ address: reader.u32(optional + 96 + 8 * i), size: reader.u32(optional + 100 + 8 * i) });
  for (let i = 0; i < sectionCount; i++) {
    const at = optional + optionalSize + SECTION_SIZE * i;
    image.sections.push({
      name: reader.zeroTerminated(at, 8),
      virtualSize: reader.u32(at + 8),
      virtualAddress: reader.u32(at + 12),
      rawSize: reader.u32(at + 16),
      rawOffset: reader.u32(at + 20),
      characteristics: reader.u32(at + 36),
    });
  }
  const imports = image.directories[DIRECTORY_IMPORT];
  const importTable = imports && imports.address ? fileOffsetOf(image, imports.address) : null;
  for (let at = importTable; at !== null && image.importedDlls.length < 256; at += IMPORT_ENTRY_SIZE) {
    const name = reader.u32(at + 12) ? fileOffsetOf(image, reader.u32(at + 12)) : null;
    if (name === null) break;
    image.importedDlls.push(reader.zeroTerminated(name, 256));
  }
  const debug = image.directories[DIRECTORY_DEBUG];
  const table = debug && debug.address && debug.size ? fileOffsetOf(image, debug.address) : null;
  if (table !== null) {
    for (let at = table; at + DEBUG_ENTRY_SIZE <= table + debug.size; at += DEBUG_ENTRY_SIZE) {
      if (reader.u32(at + 12) === DEBUG_TYPE_CODEVIEW) {
        image.codeView = { offset: reader.u32(at + 24), size: reader.u32(at + 16) };
        break;
      }
    }
  }
  return image;
}
