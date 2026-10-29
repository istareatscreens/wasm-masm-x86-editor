// Binary or text? The byte check of isbinaryfile 6.0.0 (lib/index.js isBinaryCheck,
// lib/encoding.js detectUtf16NoBom and the UTF-16 branch of isTextWithEncodingHint) - the
// library vscode-masm-runner uses for the same decision - ported for the browser: no fs
// path, and the "%PDF-" magic compared byte by byte (the library's Buffer#toString()
// comparison never matches a Uint8Array). Parity with the library is unit-tested.
//
// isbinaryfile: Copyright (c) 2019 Garen J. Torikian
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

const MAX_BYTES = 512;
const UTF8_BOUNDARY_RESERVE = 3;
// Bytes the check can look at: callers may pass just this prefix of a large file.
export const BINARY_SNIFF_BYTES = MAX_BYTES + UTF8_BOUNDARY_RESERVE;

class Reader {
  offset = 0;
  error = false;
  constructor(private bytes: Uint8Array, private size: number) {}
  nextByte(): number {
    if (this.offset === this.size || this.error) {
      this.error = true;
      return 0xff;
    }
    return this.bytes[this.offset++];
  }
  next(len: number): void {
    if (len < 0 || len > this.size - this.offset) {
      this.error = true;
      return;
    }
    for (let i = 0; i < len && !this.error; i++) this.nextByte();
  }
}

function readProtoVarInt(reader: Reader): number {
  let idx = 0;
  let varInt = 0;
  while (!reader.error) {
    const b = reader.nextByte();
    varInt = varInt | ((b & 0x7f) << (7 * idx));
    if ((b & 0x80) === 0) break;
    if (idx >= 10) {
      reader.error = true;
      break;
    }
    idx++;
  }
  return varInt;
}

function readProtoMessage(reader: Reader): boolean {
  const varInt = readProtoVarInt(reader);
  switch (varInt & 0x7) {
    case 0:
      readProtoVarInt(reader);
      return true;
    case 1:
      reader.next(8);
      return true;
    case 2:
      reader.next(readProtoVarInt(reader));
      return true;
    case 5:
      reader.next(4);
      return true;
  }
  return false;
}

function isBinaryProto(bytes: Uint8Array, totalBytes: number): boolean {
  const reader = new Reader(bytes, totalBytes);
  let numMessages = 0;
  for (;;) {
    if (!readProtoMessage(reader) && !reader.error) return false;
    if (reader.error) break;
    numMessages++;
  }
  return numMessages > 0;
}

function detectUtf16NoBom(bytes: Uint8Array, bytesRead: number): "utf-16le" | "utf-16be" | null {
  if (bytesRead < 4) return null;
  const scanLength = Math.min(bytesRead, MAX_BYTES);
  let nullsAtEven = 0;
  let nullsAtOdd = 0;
  for (let i = 0; i < scanLength; i++) {
    if (bytes[i] === 0x00) {
      if (i % 2 === 0) nullsAtEven++;
      else nullsAtOdd++;
    }
  }
  const totalNulls = nullsAtEven + nullsAtOdd;
  if (totalNulls > scanLength * 0.3 && totalNulls < scanLength * 0.7) {
    if (nullsAtOdd > nullsAtEven * 3) return "utf-16le";
    if (nullsAtEven > nullsAtOdd * 3) return "utf-16be";
  }
  return null;
}

function isUtf16Text(bytes: Uint8Array, bytesRead: number, encoding: "utf-16le" | "utf-16be"): boolean {
  const scanLength = Math.min(bytesRead, MAX_BYTES);
  for (let i = 0; i < scanLength; i += 2) {
    const byte1 = bytes[i];
    const byte2 = i + 1 < scanLength ? bytes[i + 1] : 0;
    const control = (b: number) => b < 0x20 && b !== 0x09 && b !== 0x0a && b !== 0x0d && b !== 0x00;
    if (encoding === "utf-16le" && byte2 === 0 && control(byte1)) return false;
    if (encoding === "utf-16be" && byte1 === 0 && control(byte2)) return false;
  }
  return true;
}

// isbinaryfile's verdict for these bytes (a file's whole content or its first
// BINARY_SNIFF_BYTES).
export function isBinary(bytes: Uint8Array): boolean {
  const bytesRead = bytes.length;
  if (bytesRead === 0) return false;
  let suspiciousBytes = 0;
  const totalBytes = Math.min(bytesRead, MAX_BYTES + UTF8_BOUNDARY_RESERVE);
  const scanBytes = Math.min(totalBytes, MAX_BYTES);
  const b = bytes;
  if (bytesRead >= 3 && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) return false; // UTF-8 BOM
  if (bytesRead >= 4 && b[0] === 0x00 && b[1] === 0x00 && b[2] === 0xfe && b[3] === 0xff) return false; // UTF-32 BOM
  if (bytesRead >= 4 && b[0] === 0xff && b[1] === 0xfe && b[2] === 0x00 && b[3] === 0x00) return false; // UTF-32 LE BOM
  if (bytesRead >= 4 && b[0] === 0x84 && b[1] === 0x31 && b[2] === 0x95 && b[3] === 0x33) return false; // GB BOM
  if (totalBytes >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) return true; // %PDF-
  if (bytesRead >= 2 && b[0] === 0xfe && b[1] === 0xff) return false; // UTF-16 BE BOM
  if (bytesRead >= 2 && b[0] === 0xff && b[1] === 0xfe) return false; // UTF-16 LE BOM
  const utf16 = detectUtf16NoBom(b, bytesRead);
  if (utf16) return !isUtf16Text(b, bytesRead, utf16);
  for (let i = 0; i < scanBytes; i++) {
    if (b[i] === 0) return true; // NUL byte
    if ((b[i] < 7 || b[i] > 14) && (b[i] < 32 || b[i] > 127)) {
      // UTF-8 sequences are not suspicious
      if (b[i] >= 0xc0 && b[i] <= 0xdf && i + 1 < totalBytes) {
        i++;
        if (b[i] >= 0x80 && b[i] <= 0xbf) continue;
      } else if (b[i] >= 0xe0 && b[i] <= 0xef && i + 2 < totalBytes) {
        i++;
        if (b[i] >= 0x80 && b[i] <= 0xbf && b[i + 1] >= 0x80 && b[i + 1] <= 0xbf) {
          i++;
          continue;
        }
      } else if (b[i] >= 0xf0 && b[i] <= 0xf7 && i + 3 < totalBytes) {
        i++;
        if (b[i] >= 0x80 && b[i] <= 0xbf && b[i + 1] >= 0x80 && b[i + 1] <= 0xbf && b[i + 2] >= 0x80 && b[i + 2] <= 0xbf) {
          i += 2;
          continue;
        }
      }
      suspiciousBytes++;
      // read at least 32 bytes before deciding
      if (i >= 32 && (suspiciousBytes * 100) / scanBytes > 10) return true;
    }
  }
  if ((suspiciousBytes * 100) / scanBytes > 10) return true;
  if (suspiciousBytes > 1 && isBinaryProto(b, scanBytes)) return true;
  return false;
}
