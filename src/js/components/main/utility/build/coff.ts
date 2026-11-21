// COFF objects and archives (the PE/COFF specification): the external names an object defines and the ones it
// needs, and the names a library offers the linker. The build plan looks up which file defines a name with them.

export interface ObjectSymbols {
  publics: string[]; // defined: in a section, absolute, or common
  externals: string[]; // referenced and not defined (weak externals too)
}

const MACHINE_I386 = 0x14c;
const CLASS_EXTERNAL = 2;
const CLASS_WEAK_EXTERNAL = 105;
const SYMBOL_SIZE = 18;
const MEMBER_HEADER = 60;

export const latin1 = (bytes: Uint8Array): string => {
  let text = "";
  for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode.apply(null, Array.prototype.slice.call(bytes.subarray(i, i + 0x8000)));
  return text;
};

const zeroTerminated = (bytes: Uint8Array, at: number, end: number): string => {
  let stop = at;
  while (stop < end && bytes[stop] !== 0) stop++;
  return latin1(bytes.subarray(at, stop));
};

const viewOf = (bytes: Uint8Array): DataView => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

// The symbols of an i386 COFF object; null for anything else.
export function objectSymbols(bytes: Uint8Array): ObjectSymbols | null {
  if (bytes.length < 20) return null;
  const view = viewOf(bytes);
  if (view.getUint16(0, true) !== MACHINE_I386) return null;
  const table = view.getUint32(8, true);
  const count = view.getUint32(12, true);
  const strings = table + count * SYMBOL_SIZE;
  if (table < 20 || strings + 4 > bytes.length) return null;
  const stringsEnd = Math.min(bytes.length, strings + view.getUint32(strings, true));
  const result: ObjectSymbols = { publics: [], externals: [] };
  for (let i = 0; i < count; i++) {
    const at = table + i * SYMBOL_SIZE;
    const storageClass = bytes[at + 16];
    if (storageClass === CLASS_EXTERNAL || storageClass === CLASS_WEAK_EXTERNAL) {
      const name = view.getUint32(at, true) === 0 ? zeroTerminated(bytes, strings + view.getUint32(at + 4, true), stringsEnd) : zeroTerminated(bytes, at, at + 8);
      const section = view.getInt16(at + 12, true);
      const common = storageClass === CLASS_EXTERNAL && section === 0 && view.getUint32(at + 8, true) !== 0;
      (section !== 0 || common ? result.publics : result.externals).push(name);
    }
    i += bytes[at + 17]; // auxiliary records
  }
  return result;
}

interface Member {
  name: string;
  body: Uint8Array;
}

function members(bytes: Uint8Array): Member[] {
  const list: Member[] = [];
  for (let at = 8; at + MEMBER_HEADER <= bytes.length; ) {
    const header = latin1(bytes.subarray(at, at + MEMBER_HEADER));
    const size = parseInt(header.slice(48, 58), 10);
    if (header.slice(58, 60) !== "`\n" || !(size >= 0)) break;
    list.push({ name: header.slice(0, 16).replace(/ +$/, ""), body: bytes.subarray(at + MEMBER_HEADER, Math.min(bytes.length, at + MEMBER_HEADER + size)) });
    at += MEMBER_HEADER + size + (size & 1);
  }
  return list;
}

// An import library's short import object: the symbol, and __imp_symbol (only that one for data).
function importNames(body: Uint8Array): string[] | null {
  if (body.length < 20 || body[0] !== 0 || body[1] !== 0 || body[2] !== 0xff || body[3] !== 0xff) return null;
  const symbol = zeroTerminated(body, 20, body.length);
  const type = viewOf(body).getUint16(18, true) & 3; // 0 code, 1 data, 2 const
  return type === 0 ? [symbol, "__imp_" + symbol] : ["__imp_" + symbol];
}

// The names a library offers, as the linker searches them: its first linker member (the archive's index);
// without one, the names its members define. null when the bytes are not an archive.
export function libraryNames(bytes: Uint8Array): string[] | null {
  if (bytes.length < 8 || latin1(bytes.subarray(0, 8)) !== "!<arch>\n") return null;
  const all = members(bytes);
  const index = all[0];
  if (index && index.name === "/" && index.body.length >= 4) {
    const view = viewOf(index.body);
    const count = view.getUint32(0, false); // big-endian
    const names: string[] = [];
    let at = 4 + 4 * count;
    for (let i = 0; i < count && at < index.body.length; i++) {
      const name = zeroTerminated(index.body, at, index.body.length);
      names.push(name);
      at += name.length + 1;
    }
    return names;
  }
  const names: string[] = [];
  for (const member of all) {
    if (member.name === "/" || member.name === "//") continue;
    const symbols = objectSymbols(member.body);
    Array.prototype.push.apply(names, importNames(member.body) || (symbols ? symbols.publics : []));
  }
  return names;
}
