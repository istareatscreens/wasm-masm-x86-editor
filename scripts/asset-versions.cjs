const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");

// Cloudflare serves the pages with max-age=0, so a visit always gets the deployed page, but it serves the files
// they load (style.css, index-editor.js, index-bw.js, ...) with the zone's Browser Cache TTL, max-age=14400, under
// names that never change. Each cached file's four hours run from its own last fetch, and the clocks drift apart
// (style.css is loaded by the editor page and by the terminal's frame, index-editor.js by the editor page only), so
// for up to four hours after a deploy a browser can run a mix of builds: on 2026-11-15 Firefox ran the previous
// index-editor.js under the new style.css (no share/import link buttons, a 256-px icon in the hard reset window).
// So each page names every local file it loads with ?v=<hash of the built file>: a new page asks for URLs no
// cache holds yet, and a cached file only ever serves the page it was built with.

// what a page loads; links to pages ("/", "/guide/", "x.html") are left as they are
const ASSET = /\.(?:m?js|css|wasm|png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|otf)$/i;
// src="…" or href="…" without a query, or with a ?v= of its own, which the hash replaces
const REF = /\b(src|href)=(["'])([^"'?#]*)(\?v=[^"'#]*)?\2/g;

const hashFile = (file) => createHash("sha256").update(fs.readFileSync(file)).digest("hex").slice(0, 10);

// `html`: a page's text. `page`: its path in the site ("index.html", "guide/index.html"). `root`: the directory
// holding the built site. `hashes`: a cache (file -> hash) to share between the pages of a build.
// Returns the page with its local files versioned, and those of its local files the build did not make.
function versionAssetRefs(html, page, root, hashes = new Map()) {
  const missing = [];
  const text = html.replace(REF, (ref, attr, quote, url) => {
    if (/^[a-z][a-z\d+.-]*:/i.test(url) || url.startsWith("//") || !ASSET.test(url)) return ref;
    const inSite = url.startsWith("/") ? url.slice(1) : path.posix.join(path.posix.dirname(page), url);
    if (inSite.startsWith("../")) return ref;
    const file = path.join(root, ...inSite.split("/"));
    if (!fs.statSync(file, { throwIfNoEntry: false })?.isFile()) {
      missing.push(url);
      return ref;
    }
    if (!hashes.has(file)) hashes.set(file, hashFile(file));
    return `${attr}=${quote}${url}?v=${hashes.get(file)}${quote}`;
  });
  return { html: text, missing };
}

module.exports = { versionAssetRefs };
