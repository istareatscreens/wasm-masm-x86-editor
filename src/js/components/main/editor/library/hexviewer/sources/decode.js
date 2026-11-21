import { Buffer } from "buffer";

// The data the viewer takes as children, as bytes: base64 or hex text (with the `base64` or `hex` prop), bytes
// (a Uint8Array or a Buffer), an ArrayBuffer, or an array of numbers from 0 to 255. Null for anything else.
export function decodeData(data, { base64 = false, hex = false } = {}) {
  if (data === undefined || data === null || data === "") return new Uint8Array(0);
  if (typeof data === "string") {
    if (base64) return Buffer.from(data, "base64");
    if (hex) return /^(?:[0-9a-fA-F]{2})*$/.test(data.replace(/\s+/g, "")) ? Buffer.from(data.replace(/\s+/g, ""), "hex") : null;
    return null;
  }
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (Array.isArray(data)) return data.every((value) => Number.isInteger(value) && value >= 0 && value <= 255) ? Uint8Array.from(data) : null;
  return null;
}
