import { hexOffset } from "../format/cellText.js";

// A read-only, never-changing byte source over bytes in memory (the ByteSource contract is in index.d.ts).
// `label` names the row that starts at an offset (eight hexadecimal digits by default).
export function byteSource(bytes, { label = hexOffset } = {}) {
  const data = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes || []);
  return Object.freeze({
    length: data.length,
    getVersion: () => 0,
    subscribe: () => () => {},
    label,
    read(offset, into) {
      for (let i = 0; i < into.length; i++) {
        const at = offset + i;
        into[i] = at >= 0 && at < data.length ? data[at] : -1;
      }
    },
  });
}
