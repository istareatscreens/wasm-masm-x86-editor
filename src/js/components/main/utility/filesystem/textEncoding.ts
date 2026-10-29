// A file's bytes are the truth; the editor sees them decoded and saves them encoded the
// same way, so editing a file never rewrites bytes the user did not touch (an assembler
// source with a byte order mark excepted: see ASSEMBLER_SOURCE).
//   utf-8 / utf-8-bom          new files, and any valid UTF-8
//   utf-16le / utf-16be        with a BOM (Notepad's "Unicode")
//   windows-1252               8-bit text that is not valid UTF-8 (what Windows tools wrote),
//                              and a binary file shown as text: all 256 bytes round-trip
export type TextEncodingName = "utf-8" | "utf-8-bom" | "utf-16le" | "utf-16be" | "windows-1252";

const BOM_UTF8 = [0xef, 0xbb, 0xbf];

// Microsoft MASM (ML.exe) reads an assembler source as bytes and rejects a byte order mark
// ("invalid character in file"), as the shipped JWasm does: one with a mark is saved as
// plain UTF-8, the same text.
export const ASSEMBLER_SOURCE = /[.](asm|inc)$/i;

// The encoding a byte order mark at the start of `bytes` names, if there is one.
export function byteOrderMark(bytes: Uint8Array): TextEncodingName | null {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return "utf-8-bom";
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) return "utf-16le";
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) return "utf-16be";
  return null;
}

export function detectEncoding(bytes: Uint8Array): TextEncodingName {
  const marked = byteOrderMark(bytes);
  if (marked) return marked;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return "utf-8";
  } catch (e) {
    return "windows-1252";
  }
}

// Windows-1252 as every browser decodes it (WHATWG Encoding: its five unassigned bytes
// become the C1 controls U+0081, U+008D, U+008F, U+0090, U+009D), and the exact inverse.
let cp1252Table: string | null = null;
let cp1252Inverse: Map<number, number> | null = null;
const cp1252 = () => {
  if (!cp1252Table) {
    const all = new Uint8Array(256);
    for (let i = 0; i < 256; i++) all[i] = i;
    cp1252Table = new TextDecoder("windows-1252").decode(all);
    cp1252Inverse = new Map();
    for (let i = 0; i < 256; i++) cp1252Inverse.set(cp1252Table.charCodeAt(i), i);
  }
  return { table: cp1252Table, inverse: cp1252Inverse as Map<number, number> };
};

export function decodeText(bytes: Uint8Array, encoding: TextEncodingName): string {
  switch (encoding) {
    case "utf-8":
    case "utf-8-bom":
      // the decoder drops a leading BOM; invalid sequences (none, for a detected file) become U+FFFD
      return new TextDecoder("utf-8").decode(bytes);
    case "utf-16le":
    case "utf-16be":
      return new TextDecoder(encoding).decode(bytes);
    case "windows-1252": {
      const { table } = cp1252();
      let text = "";
      for (let i = 0; i < bytes.length; i++) text += table.charAt(bytes[i]);
      return text;
    }
  }
}

// Whether every character of `text` exists in `encoding`.
export function canEncode(text: string, encoding: TextEncodingName): boolean {
  if (encoding !== "windows-1252") return true;
  const { inverse } = cp1252();
  for (let i = 0; i < text.length; i++) if (!inverse.has(text.charCodeAt(i))) return false;
  return true;
}

export function encodeText(text: string, encoding: TextEncodingName): Uint8Array {
  switch (encoding) {
    case "utf-8":
      return new TextEncoder().encode(text);
    case "utf-8-bom": {
      const body = new TextEncoder().encode(text);
      const out = new Uint8Array(body.length + 3);
      out.set(BOM_UTF8, 0);
      out.set(body, 3);
      return out;
    }
    case "utf-16le":
    case "utf-16be": {
      // the BOM is written back: decoding consumed it
      const out = new Uint8Array(2 + text.length * 2);
      const le = encoding === "utf-16le";
      const put = (at: number, unit: number) => {
        out[at] = le ? unit & 0xff : unit >> 8;
        out[at + 1] = le ? unit >> 8 : unit & 0xff;
      };
      put(0, 0xfeff);
      for (let i = 0; i < text.length; i++) put(2 + i * 2, text.charCodeAt(i));
      return out;
    }
    case "windows-1252": {
      const { inverse } = cp1252();
      const out = new Uint8Array(text.length);
      for (let i = 0; i < text.length; i++) {
        const byte = inverse.get(text.charCodeAt(i));
        if (byte === undefined) throw new Error("U+" + text.charCodeAt(i).toString(16) + " is not in windows-1252");
        out[i] = byte;
      }
      return out;
    }
  }
}

// One char per byte; chunked so a large file never exceeds the call-argument limit.
export function bytesToBinaryString(bytes: Uint8Array): string {
  let text = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    text += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000) as unknown as number[]);
  }
  return text;
}

export function binaryStringToBytes(text: string): Uint8Array {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) out[i] = text.charCodeAt(i) & 0xff;
  return out;
}

export const bytesToBase64 = (bytes: Uint8Array): string => btoa(bytesToBinaryString(bytes));
export const base64ToBytes = (base64: string): Uint8Array => binaryStringToBytes(atob(base64 || ""));
