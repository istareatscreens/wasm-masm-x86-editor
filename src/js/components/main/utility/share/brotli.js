// Brotli for share links (version 2): brotli-wasm's web build, imported on first use (its wasm is a separate
// asset of the build), and the browser's own DecompressionStream("brotli") where it has one (Firefox 147+,
// Safari 18.4+). Links are always compressed by the module, so the same files give the same link everywhere.
let loading = null;

// The module; a failure to load it (offline, say) is an error with `loadFailed`, and the next call tries again.
export function loadBrotli() {
  if (!loading)
    loading = import(/* webpackChunkName: "brotli" */ "brotli-wasm")
      .then((m) => m.default)
      .catch((error) => {
        loading = null;
        const failed = new Error("the Brotli module did not load (" + ((error && error.message) || error) + ")");
        failed.loadFailed = true;
        throw failed;
      });
  return loading;
}

// What an import may need: the module, unless the browser decodes Brotli itself.
export const preloadDecoder = () => (hasNativeDecoder() ? Promise.resolve() : loadBrotli().catch(() => {}));

let nativeDecoder = null;
const hasNativeDecoder = () => {
  if (nativeDecoder === null) {
    try {
      new DecompressionStream("brotli");
      nativeDecoder = true;
    } catch (e) {
      nativeDecoder = false;
    }
  }
  return nativeDecoder;
};

const IN_CHUNK = 65536, OUT_CHUNK = 262144;
const now = () => (typeof performance === "object" ? performance.now() : Date.now());
const yieldToPage = () => new Promise((resolve) => setTimeout(resolve, 0));

// The Brotli stream of `bytes`, or null once it passes `maxOut` bytes. Fed in pieces, the module gives the same
// bytes as in one call, and the page gets its turn about every 16 ms.
export async function compressBrotli(bytes, quality, maxOut = Infinity) {
  const brotli = await loadBrotli();
  const more = brotli.BrotliStreamResultCode.NeedsMoreOutput, done = brotli.BrotliStreamResultCode.ResultSuccess;
  const stream = new brotli.CompressStream(quality);
  const chunks = [];
  let total = 0, code = 0, used = 0, worked = now();
  const step = (input) => {
    const result = stream.compress(input, OUT_CHUNK);
    const out = result.buf;
    code = result.code;
    used += result.input_offset;
    result.free();
    total += out.length;
    if (out.length) chunks.push(out);
  };
  try {
    for (let at = 0; at < bytes.length; at += IN_CHUNK) {
      const piece = bytes.subarray(at, at + IN_CHUNK);
      used = 0;
      do step(piece.subarray(used));
      while (code === more || used < piece.length);
      if (total > maxOut) return null;
      if (now() - worked > 16) {
        await yieldToPage();
        worked = now();
      }
    }
    do step(undefined);
    while (code !== done);
  } finally {
    stream.free();
  }
  return total > maxOut ? null : join(chunks, total);
}

// The stream's bytes, or null past `max` (counted while decompressing: a bomb stops there). Throws on a damaged or
// cut-off stream. `useModule` forces the module's decoder (tests).
export async function decompressBrotli(bytes, max, useModule) {
  if (!useModule && hasNativeDecoder()) return nativeDecompress(bytes, max);
  const brotli = await loadBrotli();
  const done = brotli.BrotliStreamResultCode.ResultSuccess, more = brotli.BrotliStreamResultCode.NeedsMoreOutput;
  const stream = new brotli.DecompressStream();
  const chunks = [];
  let total = 0, at = 0, code = 0;
  try {
    // bounded input pieces: each call copies its input into the module's memory
    while (code !== done) {
      const piece = bytes.subarray(at, at + IN_CHUNK);
      let used = 0;
      do {
        const result = stream.decompress(piece.subarray(used), OUT_CHUNK);
        const out = result.buf;
        code = result.code;
        used += result.input_offset;
        result.free();
        total += out.length;
        if (total > max) return null;
        if (out.length) chunks.push(out);
      } while (code === more);
      at += used;
      if (code !== done && at >= bytes.length) throw new Error("the stream is cut off");
    }
    if (at < bytes.length) throw new Error("bytes after the end of the stream");
  } finally {
    stream.free();
  }
  return join(chunks, total);
}

async function nativeDecompress(bytes, max) {
  const stream = new DecompressionStream("brotli");
  const writer = stream.writable.getWriter();
  writer.write(bytes).catch(() => {});
  writer.close().catch(() => {});
  const reader = stream.readable.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > max) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  return join(chunks, total);
}

function join(chunks, total) {
  const out = new Uint8Array(total);
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}
