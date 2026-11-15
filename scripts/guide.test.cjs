const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const guide = read("src/html/web/guide/index.html");

// The file drawer's toolbar, in its order: the select-all box, then each control's image (FileDrawerToolbar.jsx).
function toolbarControls() {
  const jsx = read("src/js/components/main/filedrawer/toolbar/FileDrawerToolbar.jsx");
  const images = {};
  for (const m of jsx.matchAll(/^import (\w+) from "[^"]*\/images\/([\w.-]+)";/gm)) images[m[1]] = m[2];
  const body = jsx.slice(jsx.indexOf("return ("));
  const controls = [];
  for (const m of body.matchAll(/<(Checkbox|Button|Switch)\b[\s\S]*?\/>/g)) {
    if (m[1] === "Checkbox") controls.push("select-all");
    else {
      const src = /src=\{(\w+)\}/.exec(m[0]);
      assert.ok(src && images[src[1]], "a toolbar control without an image: " + m[0].slice(0, 80));
      controls.push(images[src[1]]);
    }
  }
  return controls;
}

// The guide's "File explorer controls" table, row by row: the select-all box, or the row's icon.
function guideRows() {
  const start = guide.indexOf('<h3 id="file-controls">');
  const table = guide.slice(start, guide.indexOf("</table>", start));
  return Array.from(table.matchAll(/<tr>([\s\S]*?)<\/tr>/g))
    .map((m) => m[1])
    .filter((row) => row.includes('scope="row"'))
    .map((row) => (/class="checkbox"/.test(row) ? "select-all" : (/icons\/([\w.-]+)"/.exec(row) || [])[1] || "(no icon)"));
}

test("the guide's file explorer table lists every toolbar control, in the toolbar's order", () => {
  const controls = toolbarControls(), rows = guideRows();
  const missing = controls.filter((c) => !rows.includes(c));
  const extra = rows.filter((r) => !controls.includes(r));
  assert.deepEqual(missing, [], "toolbar controls without a row in the guide");
  assert.deepEqual(extra, [], "guide rows without a toolbar control");
  assert.deepEqual(rows, controls, "the guide's rows are not in the toolbar's order");
  assert.ok(controls.includes("newDrive.png") && controls.includes("shareLink.png") && controls.includes("importLink.png"));
});

test("every icon the guide shows is copied into the built guide", () => {
  const gulp = read("gulpfile.js");
  const list = /src\/images\/\{([^}]*)\}\.png/.exec(gulp.slice(gulp.indexOf("function copyGuideIconsTask")));
  assert.ok(list, "copyGuideIconsTask's image list");
  const copied = new Set(list[1].split(",").map((n) => n.trim() + ".png"));
  copied.add("vim.svg");
  const shown = new Set(Array.from(guide.matchAll(/src="icons\/([\w.-]+)"/g), (m) => m[1]));
  for (const icon of shown) {
    assert.ok(copied.has(icon), icon + " is shown in the guide but not copied by copyGuideIconsTask");
    assert.ok(fs.existsSync(path.join(ROOT, "src/images", icon)), icon + " does not exist in src/images");
  }
});

test("the guide documents link lengths, Brotli and scrolling the terminal", () => {
  const share = guide.slice(guide.indexOf('<h3 id="share">'), guide.indexOf("<h2", guide.indexOf('<h3 id="share">')));
  for (const words of ["2,000", "32,768", "1,000,000", "2,000,000", "Firefox", "Import by URL", "64 MiB", "Brotli"])
    assert.ok(share.includes(words), "Share files by link names " + words);
  const scroll = guide.slice(guide.indexOf('<h2 id="scroll">'), guide.indexOf("</section>", guide.indexOf('<h2 id="scroll">')));
  assert.ok(guide.includes('href="#scroll"'), "the table of contents links the scrolling part");
  for (const words of ["500", "wheel", "trackpad", "arrow", "track", "thumb", "row"])
    assert.ok(scroll.toLowerCase().includes(words), "Scroll the terminal names " + words);
  const caption = /<h3 id="file-controls">[\s\S]*?<caption>([\s\S]*?)<\/caption>/.exec(guide)[1];
  for (const words of ["select", "files, folders and drives", "import", "download", "share", "delete"])
    assert.ok(caption.includes(words), "the table's caption names " + words);
});
