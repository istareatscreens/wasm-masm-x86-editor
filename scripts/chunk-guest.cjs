const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash } = require("node:crypto");

const GUEST_NAME = "TinyCore15Wine6.0-preboot-fw-trim.zip";
const FILE_LIMIT = 25 * 1024 * 1024;
const CHUNK_SIZE = 24 * 1024 * 1024;
const projectRoot = path.resolve(__dirname, "..");
const defaultSourceDir = path.join(projectRoot, "src", "bw-assets");

function guestIdentity(data) {
  const hash = createHash("sha256").update(data).digest("hex").slice(0, 8);
  const version = createHash("sha256").update(`${GUEST_NAME}:${hash}`).digest("hex").slice(0, 8);
  return { hash, version };
}

// The placeholder gulp replaces in boxedwine.html with the value below. Whitespace between the
// comment and `null` is tolerated: a formatter run over the page put a space there once and the
// exact-string match this replaced failed the deploy build.
const GUEST_CHUNKS_PLACEHOLDER = /\/\*__BW_GUEST_CHUNKS__\*\/\s*null/g;

// Injected into boxedwine.html as window.BW_GUEST_CHUNKS.
async function guestChunkVersions({ sourceDir = defaultSourceDir } = {}) {
  const data = await fs.readFile(path.join(sourceDir, GUEST_NAME));
  if (!data.length) throw new Error(`${GUEST_NAME} is empty`);
  return { [GUEST_NAME]: guestIdentity(data).version };
}

async function chunkGuest({
  sourceDir = defaultSourceDir,
  outputDir = path.join(projectRoot, "public", "latest26"),
} = {}) {
  if (path.resolve(sourceDir) === path.resolve(outputDir)) {
    throw new Error("Guest source and build output must be different directories");
  }
  const names = (await fs.readdir(sourceDir)).filter((name) => name.endsWith(".zip")).sort();
  const data = await fs.readFile(path.join(sourceDir, GUEST_NAME));
  if (!data.length) throw new Error(`${GUEST_NAME} is empty`);
  // Only the guest image is split. A newly oversized asset needs an explicit decision.
  for (const name of names.filter((name) => name !== GUEST_NAME)) {
    if ((await fs.stat(path.join(sourceDir, name))).size > FILE_LIMIT) {
      throw new Error(`${name} exceeds Cloudflare Pages' 25 MiB limit; only ${GUEST_NAME} is chunked`);
    }
  }
  await fs.mkdir(outputDir, { recursive: true });
  for (const name of names.filter((name) => name !== GUEST_NAME)) {
    await fs.copyFile(path.join(sourceDir, name), path.join(outputDir, name));
  }
  const { hash, version } = guestIdentity(data);
  const chunks = [];
  for (let offset = 0, i = 0; offset < data.length; offset += CHUNK_SIZE, i++) {
    const name = `${GUEST_NAME}.${hash}.part${i}`;
    await fs.writeFile(path.join(outputDir, name), data.subarray(offset, offset + CHUNK_SIZE));
    chunks.push(name);
  }
  const manifest = {
    version,
    chunkSize: CHUNK_SIZE,
    files: { [GUEST_NAME]: { totalSize: data.length, hash, chunks } },
  };
  await fs.writeFile(path.join(outputDir, "chunks-manifest.json"), JSON.stringify(manifest, null, 2));
  // Watch/repeated builds may leave parts from the previous version of this image.
  for (const name of await fs.readdir(outputDir)) {
    const suffix = name.startsWith(GUEST_NAME + ".") ? name.slice(GUEST_NAME.length + 1) : "";
    if (name === GUEST_NAME || (/^[a-f0-9]{8}\.part\d+$/.test(suffix) && !chunks.includes(name))) {
      await fs.unlink(path.join(outputDir, name));
    }
  }
  console.log(`chunk-guest: ${GUEST_NAME} (${data.length} bytes) -> ${chunks.length} chunks (${hash})`);
  return manifest;
}

module.exports = { chunkGuest, guestChunkVersions, GUEST_CHUNKS_PLACEHOLDER, GUEST_NAME, FILE_LIMIT, CHUNK_SIZE };

if (require.main === module) {
  chunkGuest().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
