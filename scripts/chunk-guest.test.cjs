const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { chunkGuest, GUEST_NAME, CHUNK_SIZE, FILE_LIMIT } = require("./chunk-guest.cjs");

async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "masm-chunk-test-"));
  t.after(async () => {
    assert.equal(path.dirname(dir), path.resolve(os.tmpdir()));
    assert.ok(path.basename(dir).startsWith("masm-chunk-test-"));
    await fs.rm(dir, { recursive: true, force: true });
  });
  const sourceDir = path.join(dir, "source");
  const outputDir = path.join(dir, "output");
  await fs.mkdir(sourceDir);
  return { sourceDir, outputDir };
}

test("only the named guest is chunked; bytes and legacy manifest identity are preserved", async (t) => {
  const dirs = await fixture(t);
  const data = Buffer.alloc(CHUNK_SIZE + 17, 0xa5);
  data[data.length - 1] = 0x42;
  const assembler = Buffer.from([0, 0xff, 0xef, 0xbb, 0xbf, 0x80]);
  await fs.writeFile(path.join(dirs.sourceDir, GUEST_NAME), data);
  await fs.writeFile(path.join(dirs.sourceDir, "assembler-dp0.zip"), assembler);
  const manifest = await chunkGuest(dirs);
  assert.deepEqual(Object.keys(manifest.files), [GUEST_NAME]);
  const entry = manifest.files[GUEST_NAME];
  assert.equal(entry.chunks.length, 2);
  assert.equal(entry.totalSize, data.length);
  assert.equal(entry.hash, createHash("sha256").update(data).digest("hex").slice(0, 8));
  assert.equal(manifest.version, createHash("sha256").update(`${GUEST_NAME}:${entry.hash}`).digest("hex").slice(0, 8));
  const parts = await Promise.all(entry.chunks.map((name) => fs.readFile(path.join(dirs.outputDir, name))));
  assert.deepEqual(parts.map((part) => part.length), [CHUNK_SIZE, 17]);
  assert.deepEqual(Buffer.concat(parts), data);
  assert.deepEqual(await fs.readFile(path.join(dirs.outputDir, "assembler-dp0.zip")), assembler);
  await assert.rejects(fs.stat(path.join(dirs.outputDir, GUEST_NAME)), { code: "ENOENT" });
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(dirs.outputDir, "chunks-manifest.json"))), manifest);
  assert.deepEqual(await chunkGuest(dirs), manifest);

  await fs.writeFile(path.join(dirs.sourceDir, GUEST_NAME), Buffer.from("new guest"));
  const next = await chunkGuest(dirs);
  assert.notEqual(next.version, manifest.version);
  for (const name of entry.chunks) await assert.rejects(fs.stat(path.join(dirs.outputDir, name)), { code: "ENOENT" });
  assert.equal(next.files[GUEST_NAME].chunks.length, 1);
});

test("other assets at the Pages limit are copied whole; larger ones fail explicitly", async (t) => {
  const dirs = await fixture(t);
  await fs.writeFile(path.join(dirs.sourceDir, GUEST_NAME), Buffer.from("guest"));
  const other = path.join(dirs.sourceDir, "another.zip");
  await fs.writeFile(other, Buffer.alloc(FILE_LIMIT));
  assert.deepEqual(Object.keys((await chunkGuest(dirs)).files), [GUEST_NAME]);
  assert.equal((await fs.stat(path.join(dirs.outputDir, "another.zip"))).size, FILE_LIMIT);
  await fs.appendFile(other, Buffer.from([1]));
  await assert.rejects(chunkGuest(dirs), /another.zip exceeds.*only TinyCore/);
});

test("missing or empty guest and source/output aliasing fail", async (t) => {
  const dirs = await fixture(t);
  await assert.rejects(chunkGuest(dirs), { code: "ENOENT" });
  await fs.writeFile(path.join(dirs.sourceDir, GUEST_NAME), Buffer.alloc(0));
  await assert.rejects(chunkGuest(dirs), /is empty/);
  await assert.rejects(chunkGuest({ ...dirs, outputDir: dirs.sourceDir }), /different directories/);
});
