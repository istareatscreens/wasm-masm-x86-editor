// Base64 for the protocol's memory requests, in plain code: no Buffer (a browser has none) and no btoa (it takes text).
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const VALUES: { [character: string]: number } = {};
for (let i = 0; i < ALPHABET.length; i++) VALUES[ALPHABET[i]] = i;

export function toBase64(bytes: Uint8Array): string {
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    parts.push(ALPHABET[a >> 2], ALPHABET[((a & 3) << 4) | (b >> 4)], i + 1 < bytes.length ? ALPHABET[((b & 15) << 2) | (c >> 6)] : "=", i + 2 < bytes.length ? ALPHABET[c & 63] : "=");
  }
  return parts.join("");
}

export function fromBase64(text: string): Uint8Array | null {
  const clean = text.replace(/=+$/, "");
  if (clean.length % 4 === 1 || /[^A-Za-z0-9+/]/.test(clean)) return null;
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let at = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = VALUES[clean[i]];
    const b = VALUES[clean[i + 1]];
    const c = i + 2 < clean.length ? VALUES[clean[i + 2]] : 0;
    const d = i + 3 < clean.length ? VALUES[clean[i + 3]] : 0;
    bytes[at++] = (a << 2) | (b >> 4);
    if (i + 2 < clean.length) bytes[at++] = ((b & 15) << 4) | (c >> 2);
    if (i + 3 < clean.length) bytes[at++] = ((c & 3) << 6) | d;
  }
  return bytes;
}
