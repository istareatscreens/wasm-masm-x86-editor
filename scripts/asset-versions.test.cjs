const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { versionAssetRefs } = require("./asset-versions.cjs");

const hash = (text) => createHash("sha256").update(text).digest("hex").slice(0, 10);

async function site(t, files) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "masm-asset-versions-test-"));
  t.after(async () => {
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith("masm-asset-versions-test-"));
    await fs.rm(root, { recursive: true, force: true });
  });
  for (const [name, text] of Object.entries(files)) {
    await fs.mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await fs.writeFile(path.join(root, name), text);
  }
  return root;
}

test("each local file a page loads is named by the hash of its built bytes", async (t) => {
  const root = await site(t, { "style.css": "a{}", "index-editor.js": "1;", "favicon.ico": "ico" });
  const page = '<link rel="stylesheet" href="style.css"><link rel="icon" href="favicon.ico"><script src="index-editor.js"></script>';
  const { html, missing } = versionAssetRefs(page, "index.html", root);
  assert.equal(
    html,
    `<link rel="stylesheet" href="style.css?v=${hash("a{}")}"><link rel="icon" href="favicon.ico?v=${hash("ico")}">` +
      `<script src="index-editor.js?v=${hash("1;")}"></script>`
  );
  assert.deepEqual(missing, []);
});

test("a new build of a file gets a new URL, an unchanged file keeps its URL", async (t) => {
  const root = await site(t, { "style.css": "a{}", "index-editor.js": "old;" });
  const page = '<link href="style.css"><script src="index-editor.js"></script>';
  const before = versionAssetRefs(page, "index.html", root).html;
  await fs.writeFile(path.join(root, "index-editor.js"), "new;");
  const after = versionAssetRefs(page, "index.html", root).html;
  assert.match(before, new RegExp(`style\\.css\\?v=${hash("a{}")}"`));
  assert.match(after, new RegExp(`style\\.css\\?v=${hash("a{}")}"`));
  assert.match(before, new RegExp(`index-editor\\.js\\?v=${hash("old;")}"`));
  assert.match(after, new RegExp(`index-editor\\.js\\?v=${hash("new;")}"`));
});

test("a hand-written ?v= is replaced by the hash", async (t) => {
  const root = await site(t, { "boxedwine-shell.js": "shell;" });
  const { html } = versionAssetRefs("<script src='boxedwine-shell.js?v=41'></script>", "boxedwine.html", root);
  assert.equal(html, `<script src='boxedwine-shell.js?v=${hash("shell;")}'></script>`);
});

test("paths resolve from the page's folder, or from the site root with a leading /", async (t) => {
  const root = await site(t, { "favicon.ico": "ico", "guide/icons/run.png": "png" });
  const { html, missing } = versionAssetRefs('<link href="/favicon.ico"><img src="icons/run.png">', "guide/index.html", root);
  assert.equal(html, `<link href="/favicon.ico?v=${hash("ico")}"><img src="icons/run.png?v=${hash("png")}">`);
  assert.deepEqual(missing, []);
});

test("links to pages, other sites, other queries and fragments are left alone", async (t) => {
  const root = await site(t, { "index.html": "page", "x.js": "x" });
  const page =
    '<a href="/"></a><a href="/guide/"></a><a href="index.html"></a><a href="#top"></a>' +
    '<script src="https://static.cloudflareinsights.com/beacon.min.js"></script><script src="//cdn.example/a.js"></script>' +
    '<script src="x.js?bw=mt"></script><link rel="canonical" href="https://masm.isas.dev/">';
  const { html, missing } = versionAssetRefs(page, "index.html", root);
  assert.equal(html, page);
  assert.deepEqual(missing, []);
});

test("a file the build did not make is reported and left as written", async (t) => {
  const root = await site(t, { "style.css": "a{}" });
  const page = '<link href="style.css"><script src="index-bw.js"></script>';
  const { html, missing } = versionAssetRefs(page, "boxedwine.html", root);
  assert.equal(html, `<link href="style.css?v=${hash("a{}")}"><script src="index-bw.js"></script>`);
  assert.deepEqual(missing, ["index-bw.js"]);
});
