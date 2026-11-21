// File names as the toolchain reads and matches them. JWasm and JWlink (with the masm-editor UTF-8 patch,
// Boxedwine/toolchain-src) read a name written in a source, an object or a directive file as UTF-8 when its bytes are
// valid UTF-8, else in the ANSI code page. Windows (NTFS) and Wine match names without case one UTF-16 unit at a time,
// and only where the case mapping round-trips (Wine 6.0's tools/make_unicode, remove_linguistic_mappings): "ς"/"Σ",
// "ı"/"I" and "ß"/"ẞ" are different letters to both. Neither treats a name's composed and decomposed forms alike.

// The guest's ANSI code page: its registry's ACP (Wine's en-US locale).
export const GUEST_ANSI_CODE_PAGE = "windows-1252";

const nonAscii = /[\u0080-\uffff]/; // any UTF-16 unit outside ASCII
const utf8 = new TextDecoder("utf-8", { fatal: true });
const ansiDecoders = new Map<string, TextDecoder>();

// A file name written in a source read byte for byte (one character a byte: coff.ts latin1), as the assembler and
// the linker read it.
export function fileName(raw: string, ansiCodePage: string = GUEST_ANSI_CODE_PAGE): string {
  if (!nonAscii.test(raw)) return raw;
  const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0) & 0xff);
  try {
    return utf8.decode(bytes);
  } catch {
    let ansi = ansiDecoders.get(ansiCodePage);
    if (!ansi) ansiDecoders.set(ansiCodePage, (ansi = new TextDecoder(ansiCodePage)));
    return ansi.decode(bytes);
  }
}

// The key two names of one file share on Windows and in Wine: each UTF-16 unit in lower case where its lower case
// maps back to it, any other unit as it is.
export function nameKey(name: string): string {
  if (!nonAscii.test(name)) return name.toLowerCase();
  let key = "";
  for (let i = 0; i < name.length; i++) {
    const unit = name.charAt(i);
    const lower = unit.toLowerCase();
    key += lower.length === 1 && lower.toUpperCase() === unit ? lower : unit;
  }
  return key;
}

export const sameName = (a: string, b: string): boolean => nameKey(a) === nameKey(b);
