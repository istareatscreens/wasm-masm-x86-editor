// A file's icon in the drawer, by its extension in any letter case. An extension not listed is text or binary data,
// by the test the editor uses to choose its text or hex view.
const KINDS = {
  asm: "asm",
  inc: "include",
  mac: "macro",
  def: "definition",
  exe: "program",
  com: "program",
  dll: "dll",
  obj: "object",
  lib: "library",
  map: "listing",
  lst: "listing",
  err: "error",
  bat: "batch",
  cmd: "batch",
  bmp: "image",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  ico: "image",
  wav: "sound",
  mp3: "sound",
  ogg: "sound",
  flac: "sound",
  mid: "sound",
  midi: "sound",
  zip: "archive",
  txt: "text",
  bin: "data",
};

export const ICON_KINDS = ["asm", "include", "macro", "definition", "program", "dll", "object", "library", "listing", "error", "batch", "image", "sound", "archive", "text", "data"];

const extensionOf = (path) => {
  const match = /\.([^./\\]+)$/.exec(path);
  return match ? match[1].toLowerCase() : "";
};

// `isBinary()` is asked only for an extension not listed
export function fileIconKind(path, isBinary) {
  return KINDS[extensionOf(path)] || (isBinary() ? "data" : "text");
}
