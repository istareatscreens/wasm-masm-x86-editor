// Share links: files carried in the address's fragment, `<app address>#share=<data>`, where data is the
// unpadded base64url form (RFC 4648 section 5) of a zlib stream (RFC 1950) holding a container:
// - version 2, which makeLink writes: stored blocks holding the magic, the version 2 and a Brotli stream
//   (RFC 7932) of a version-1 container, so a reader that knows only version 1 says a newer version made it;
// - version 1, which readLink also reads: the deflated version-1 container.
// The fragment never reaches a server.
import { compressBrotli, decompressBrotli } from "./brotli";
import { sanitizeEntryPath, MAX_ARCHIVE_BYTES } from "../filesystem/archive";
import { pathProblem, nameKey, parentOf, baseOf, splitPath, joinPath, utf8Length, isMasmSource, MAX_SEGMENT_BYTES, MAX_GUEST_PATH } from "../filesystem/paths";
import { isBinary, BINARY_SNIFF_BYTES } from "../filesystem/binaryDetect";
import { detectEncoding, decodeText } from "../filesystem/textEncoding";
import { splitDrive } from "../filesystem/drives";
import { Statement, sourceStatements } from "../build/sourceFile";
import { DrawerView, Location, Target, ToolchainView, locationOf, resolveInclude, resolveLibrary } from "../build/resolver";
import { fileName } from "../build/fileNames";

export const SHARE_KEY = "share";
export const EVERY_BROWSER_URL = 1000000; // links up to this open in every browser (Firefox opens at most 1,048,576)
export const MAX_SHARE_URL = 2000000; // a whole link, when sharing (Chrome, Edge and Safari open it, Firefox does not)
export const MAX_LINK_TEXT = 2097152; // one link's text, when importing (white space removed): the longest URL Chromium opens
export const MAX_CONTAINER = MAX_ARCHIVE_BYTES; // unpacked: checked when sharing, counted while streaming when importing
export const MAX_ENTRIES = 2000; // the zip import's limit
export const MAX_LINKS = 100; // per import
export const MAX_LIST_BYTES = 16 * 1024 * 1024; // a list file
const MAGIC = 0x4d; // "M"
const VERSION = 1; // the container of files
export const VERSION_BROTLI = 2; // a version-1 container, Brotli-compressed
export const BROTLI_Q11_MAX = 131072; // containers up to this size are compressed at quality 11, larger ones at 9

export interface ShareFile {
  path: string; // from the shared drive's root, "/" separators
  bytes: Uint8Array;
}
export interface ShareContent {
  name: string; // the sender's workspace name
  open: string; // the file to open ("" for none)
  folders: string[]; // empty folders
  files: ShareFile[];
}
export type Result<T> = { value: T; problem?: undefined } | { value?: undefined; problem: string };

// --- the container ---------------------------------------------------------------------------------------
// magic, version, then: name, open (each a varint length and UTF-8 bytes), the folders (a varint count, then
// each path), the files (a varint count, then each path, a varint size and exactly that many bytes). A varint
// is unsigned LEB128 of at most 4 bytes.
const utf8 = new TextEncoder();
const MAX_VARINT = 0x0fffffff;

function writeVarint(out: number[], value: number): void {
  if (value < 0 || value > MAX_VARINT || value !== Math.floor(value)) throw new Error("a length past 2^28");
  do {
    let byte = value & 0x7f;
    value = Math.floor(value / 128);
    if (value) byte |= 0x80;
    out.push(byte);
  } while (value);
}

export function encodeContainer(content: ShareContent): Uint8Array {
  const head: number[] = [MAGIC, VERSION];
  const text = (s: string) => {
    const bytes = utf8.encode(s);
    writeVarint(head, bytes.length);
    for (let i = 0; i < bytes.length; i++) head.push(bytes[i]);
  };
  text(content.name);
  text(content.open);
  writeVarint(head, content.folders.length);
  content.folders.forEach(text);
  writeVarint(head, content.files.length);
  const parts: Uint8Array[] = [];
  let size = 0;
  const flush = () => {
    const part = new Uint8Array(head);
    parts.push(part);
    size += part.length;
    head.length = 0;
  };
  for (const file of content.files) {
    text(file.path);
    writeVarint(head, file.bytes.length);
    flush();
    parts.push(file.bytes);
    size += file.bytes.length;
  }
  flush();
  const out = new Uint8Array(size);
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

// encodeContainer(content).length, without building it
export function containerSize(content: ShareContent): number {
  const varintSize = (value: number) => {
    let n = 1;
    while (value >= 128) {
      value = Math.floor(value / 128);
      n++;
    }
    return n;
  };
  const text = (s: string) => {
    const length = utf8.encode(s).length;
    return varintSize(length) + length;
  };
  let size = 2 + text(content.name) + text(content.open) + varintSize(content.folders.length) + varintSize(content.files.length);
  content.folders.forEach((folder) => (size += text(folder)));
  content.files.forEach((file) => (size += text(file.path) + varintSize(file.bytes.length) + file.bytes.length));
  return size;
}

export function decodeContainer(data: Uint8Array): Result<ShareContent> {
  let at = 0;
  const fail = (problem: string): Result<ShareContent> => ({ problem });
  const varint = (): number => {
    let value = 0;
    for (let i = 0; i < 4; i++) {
      if (at >= data.length) return -1;
      const byte = data[at++];
      value += (byte & 0x7f) * Math.pow(128, i);
      if (!(byte & 0x80)) return value;
    }
    return -1;
  };
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const text = (): string | null => {
    const length = varint();
    if (length < 0 || at + length > data.length) return null;
    try {
      return decoder.decode(data.subarray(at, (at += length)));
    } catch (e) {
      return null;
    }
  };
  if (data.length < 2 || data[0] !== MAGIC) return fail("this is not a share link");
  if (data[1] !== VERSION) return fail(data[1] > VERSION ? "the link was made by a newer version of the app: reload the page" : "unknown link version");
  at = 2;
  const name = text(), open = text();
  if (name === null || open === null) return fail("the link is damaged");
  const folderCount = varint();
  if (folderCount < 0 || folderCount > MAX_ENTRIES) return fail(folderCount < 0 ? "the link is damaged" : "the link holds more than " + MAX_ENTRIES + " entries");
  const folders: string[] = [];
  for (let i = 0; i < folderCount; i++) {
    const folder = text();
    if (folder === null) return fail("the link is damaged");
    folders.push(folder);
  }
  const fileCount = varint();
  if (fileCount < 0) return fail("the link is damaged");
  if (folderCount + fileCount > MAX_ENTRIES) return fail("the link holds more than " + MAX_ENTRIES + " entries");
  const files: ShareFile[] = [];
  for (let i = 0; i < fileCount; i++) {
    const path = text(), size = varint();
    if (path === null || size < 0 || at + size > data.length) return fail("the link is damaged");
    files.push({ path, bytes: data.slice(at, (at += size)) });
  }
  if (at !== data.length) return fail("the link is damaged");
  return { value: { name, open, folders, files } };
}

// --- compression and base64url ---------------------------------------------------------------------------
// The stream's bytes, at most `max` of them (counted while streaming: a compression bomb stops there); `capFor`
// may lower the limit once the first two bytes (the container's magic and version) are known.
async function collect(readable: ReadableStream<Uint8Array>, max: number, capFor?: (head: Uint8Array) => number): Promise<{ out: Uint8Array | null; cap: number }> {
  const reader = readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0, cap = max;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (capFor && total < 2 && total + value.length >= 2) {
      const head = total ? new Uint8Array([chunks[0][0], value[0]]) : value.subarray(0, 2);
      cap = Math.min(cap, capFor(head));
    }
    total += value.length;
    if (total > cap) {
      await reader.cancel().catch(() => {});
      return { out: null, cap };
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return { out, cap };
}

function through(bytes: Uint8Array, stream: CompressionStream | DecompressionStream, max: number, capFor?: (head: Uint8Array) => number) {
  const writer = stream.writable.getWriter();
  writer.write(bytes as unknown as BufferSource).catch(() => {}); // never shared memory
  writer.close().catch(() => {});
  return collect(stream.readable, max, capFor);
}

// Links are made with the Brotli module (WebAssembly) and read with the browser's DecompressionStream.
export const canMakeLinks = (): boolean => typeof WebAssembly === "object";

// zlib deflate, as version-1 links are made (tests)
export async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  return (await through(bytes, new CompressionStream("deflate"), Infinity)).out as Uint8Array;
}

// The stream's bytes, at most `max` of them (counted while streaming: a compression bomb stops there). Past a
// lower limit set by `capFor`, the stream is damaged.
export async function inflate(bytes: Uint8Array, max: number = MAX_CONTAINER, capFor?: (head: Uint8Array) => number): Promise<Result<Uint8Array>> {
  try {
    const { out, cap } = await through(bytes, new DecompressionStream("deflate"), max, capFor);
    if (out) return { value: out };
    return { problem: cap < max ? "the link is damaged" : "the link unpacks to more than " + max / 1048576 + " MiB" };
  } catch (e) {
    return { problem: "the link is damaged or cut off" };
  }
}

// A zlib stream (RFC 1950) of stored blocks: `bytes` as they are, in blocks of at most 65,535, then their Adler-32.
export function zlibStored(bytes: Uint8Array): Uint8Array {
  const blocks = Math.max(1, Math.ceil(bytes.length / 65535));
  const out = new Uint8Array(2 + blocks * 5 + bytes.length + 4);
  out[0] = 0x78; // deflate, 32 KB window
  out[1] = 0x01; // no dictionary; (0x78 << 8 | 0x01) % 31 == 0
  let at = 2;
  for (let i = 0; i < blocks; i++) {
    const length = Math.min(65535, bytes.length - i * 65535);
    out[at++] = i === blocks - 1 ? 1 : 0; // BFINAL on the last block, BTYPE 00 (stored)
    out[at++] = length & 0xff;
    out[at++] = length >>> 8;
    out[at++] = ~length & 0xff;
    out[at++] = (~length >>> 8) & 0xff;
    out.set(bytes.subarray(i * 65535, i * 65535 + length), at);
    at += length;
  }
  let a = 1, b = 0;
  for (let i = 0; i < bytes.length; ) {
    for (const end = Math.min(bytes.length, i + 5552); i < end; i++) {
      a += bytes[i];
      b += a;
    }
    a %= 65521;
    b %= 65521;
  }
  out[at++] = b >>> 8;
  out[at++] = b & 0xff;
  out[at++] = a >>> 8;
  out[at] = a & 0xff;
  return out;
}

export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, Array.prototype.slice.call(bytes.subarray(i, i + 0x8000)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const BASE64URL = /^[A-Za-z0-9_-]+$/;
export function fromBase64Url(text: string): Uint8Array | null {
  if (!BASE64URL.test(text) || text.length % 4 === 1) return null;
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice(0, (4 - (text.length % 4)) % 4));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

// --- link text ---------------------------------------------------------------------------------------------
export const shareUrl = (base: string, data: string): string => base + "#" + SHARE_KEY + "=" + data;
// The page's base route: its path without a trailing index.html (with no query and no fragment).
export const baseRoute = (pathname: string): string => pathname.replace(/index\.html$/i, "");

// The data of the share link in `text` (a whole link, or the part from "#share=" on), white space removed.
export function linkData(text: string): Result<string> {
  const clean = String(text || "").replace(/\s+/g, "");
  if (!clean) return { problem: "empty" };
  if (clean.length > MAX_LINK_TEXT) return { problem: "longer than " + MAX_LINK_TEXT.toLocaleString("en-US") + " characters" };
  const at = clean.indexOf("#" + SHARE_KEY + "=");
  if (at < 0) return { problem: "not a share link" };
  const data = clean.slice(at + SHARE_KEY.length + 2);
  if (!data || !BASE64URL.test(data)) return { problem: "not a share link (characters a link cannot have)" };
  return { value: data };
}

// Quality 11 up to BROTLI_Q11_MAX, else 9, whose calls are short enough to let the page work in between.
export const brotliQuality = (size: number): number => (size <= BROTLI_Q11_MAX ? 11 : 9);

// A link for `content` on `base` (the app's address), and back: every check of the format on the way. With
// `maxLength`, null as soon as the link would be longer (the compression stops there).
export async function makeLink(base: string, content: ShareContent, maxLength: number = Infinity): Promise<string | null> {
  const container = encodeContainer(content);
  // more Brotli output than this never fits: base64url carries 3 bytes in 4 characters, and the wrapper and the
  // version add at least 8 bytes (the exact length is checked at the end)
  const maxOut = Math.floor(((maxLength - shareUrl(base, "").length) * 3) / 4) - 8;
  const packed: Uint8Array | null = await compressBrotli(container, brotliQuality(container.length), maxOut);
  if (!packed) return null;
  const outer = new Uint8Array(2 + packed.length);
  outer[0] = MAGIC;
  outer[1] = VERSION_BROTLI;
  outer.set(packed, 2);
  const link = shareUrl(base, toBase64Url(zlibStored(outer)));
  return link.length > maxLength ? null : link;
}
export async function readLink(text: string): Promise<Result<ShareContent>> {
  const data = linkData(text);
  if (data.problem) return { problem: data.problem };
  const packed = fromBase64Url(data.value as string);
  if (!packed) return { problem: "not a share link (characters a link cannot have)" };
  // a version-2 container is stored, not compressed: it can never be longer than the link
  const raw = await inflate(packed, MAX_CONTAINER, (head) => (head[0] === MAGIC && head[1] === VERSION_BROTLI ? packed.length : MAX_CONTAINER));
  if (raw.problem) return { problem: raw.problem };
  const outer = raw.value as Uint8Array;
  if (outer.length < 2 || outer[0] !== MAGIC || outer[1] !== VERSION_BROTLI) return decodeContainer(outer);
  let container: Uint8Array | null;
  try {
    container = await decompressBrotli(outer.subarray(2), MAX_CONTAINER);
  } catch (e) {
    if (e && e.loadFailed) return { problem: e.message + ": check the connection and try again" };
    return { problem: "the link is damaged or cut off" };
  }
  if (!container) return { problem: "the link unpacks to more than " + MAX_CONTAINER / 1048576 + " MiB" };
  if (container.length >= 2 && container[0] === MAGIC && container[1] !== VERSION) return { problem: "the link is damaged" };
  return decodeContainer(container);
}

// Text pasted or read from a list file: links at new lines and commas (base64url never contains either),
// quotes around an item dropped, empty items and repeats dropped.
export function splitLinks(text: string): string[] {
  const seen: { [item: string]: boolean } = {};
  const out: string[] = [];
  for (const raw of String(text || "").split(/[\r\n,]+/)) {
    const item = raw.trim().replace(/^["']+|["']+$/g, "").trim();
    if (!item || seen[item]) continue;
    seen[item] = true;
    out.push(item);
  }
  return out;
}

// Where a link of this length can go (the share window).
export type Reach = "chat" | "email" | "browser" | "notFirefox" | "none";
export const reachOf = (length: number): Reach =>
  length <= 2000 ? "chat" : length <= 32768 ? "email" : length <= EVERY_BROWSER_URL ? "browser" : length <= MAX_SHARE_URL ? "notFirefox" : "none";

// --- names -------------------------------------------------------------------------------------------------
const FORMAT = new RegExp("\\p{Cf}", "u");
const BIDI = /[\u202a-\u202e\u2066-\u2069]/;

// Why a path from a link (relative to a drive's root) is refused, or null: the zip import's rules (no
// absolute path, drive letter or "..", Windows names, NFC, at most 255 bytes a name), no invisible format
// characters, and a full guest path of at most 259 characters.
export function entryProblem(path: string): string | null {
  const clean = sanitizeEntryPath(path);
  if ("ignore" in clean) return "an empty name";
  if ("skip" in clean) return clean.skip;
  if (clean.path !== path) return "not a plain path";
  if (FORMAT.test(path)) return "the name has invisible formatting characters";
  return pathProblem(path);
}

// --- sharing -----------------------------------------------------------------------------------------------
export interface SharePlan {
  problem: string | null;
  root: string; // the shared drive's root ("" = D:)
  content: ShareContent; // paths from that root
  drawerPaths: string[]; // each shared file's drawer path, in content.files' order
  left: { path: string; reason: string }[]; // drawer paths left out, with the reason
}

const sniff = (bytes: Uint8Array): Uint8Array => bytes.subarray(0, BINARY_SNIFF_BYTES);

// What a share of these entries holds: the target files, and the target folders with everything in them
// (the download button's selection), all on one drive, every file byte for byte whatever it holds; only a name
// the importer would refuse is left out.
export function planShare(
  targets: { files: string[]; folders: string[] },
  allFiles: string[],
  allFolders: string[],
  read: (path: string) => Uint8Array,
  name: string,
  openFile: string,
): SharePlan {
  const files = new Set<string>(targets.files), folders = new Set<string>(targets.folders);
  for (const folder of targets.folders) {
    allFiles.forEach((file) => (file === folder || file.indexOf(folder + "/") === 0) && files.add(file));
    allFolders.forEach((sub) => sub.indexOf(folder + "/") === 0 && folders.add(sub));
  }
  const plan: SharePlan = { problem: null, root: "", content: { name, open: "", folders: [], files: [] }, drawerPaths: [], left: [] };
  const all = Array.from(files).concat(Array.from(folders));
  const roots = new Set(all.map((path) => (splitDrive(path).id === null ? "" : "drive:" + splitDrive(path).id)));
  if (!all.length) return { ...plan, problem: "Nothing is selected to share." };
  if (roots.size > 1) return { ...plan, problem: "Share from one drive at a time." };
  plan.root = Array.from(roots)[0];
  const rel = (path: string) => splitDrive(path).rel;
  for (const path of Array.from(files).sort()) {
    const reason = entryProblem(rel(path));
    if (reason) plan.left.push({ path, reason });
    else {
      plan.content.files.push({ path: rel(path), bytes: read(path) });
      plan.drawerPaths.push(path);
    }
  }
  // empty folders travel: those with no file of the drawer in them
  plan.content.folders = Array.from(folders)
    .filter((folder) => !allFiles.some((file) => file.indexOf(folder + "/") === 0) && !entryProblem(rel(folder)))
    .map(rel)
    .sort();
  const shared = plan.content.files.map((file) => file.path);
  const open = openFile && plan.drawerPaths.indexOf(openFile) >= 0 ? rel(openFile) : shared.filter((p) => /\.asm$/i.test(p))[0] || "";
  plan.content.open = open;
  if (!plan.content.files.length && !plan.content.folders.length) plan.problem = "Nothing here can be shared: no name here is one a link can carry.";
  return plan;
}

// --- what the shared programs include (JWasm's rules) ------------------------------------------------------
export const TOOLCHAIN_FILES = ["irvine32.inc", "irvine16.inc", "macros.inc", "smallwin.inc", "graphwin.inc", "virtualkeys.inc", "irvine32.lib", "irvine16.lib", "kernel32.lib", "user32.lib"];
export type IncludeKind = "shared" | "toolchain" | "letter" | "outside" | "missing";
export interface IncludeFinding {
  file: string; // the shared file the line is in (from the root)
  line: number; // 1-based
  directive: "INCLUDE" | "INCLUDELIB";
  argument: string;
  kind: IncludeKind;
  target: string; // what it names, from the root ("" when nothing was found)
}

const latin1 = (bytes: Uint8Array): string => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.prototype.slice.call(bytes.subarray(i, i + 0x8000)));
  return s;
};

// Every INCLUDE / INCLUDELIB line of the shared .asm, .inc and .mac text files, resolved as the build resolves it
// (build/resolver.ts). Each shared .asm is followed through what it includes, as its build would read it; a shared
// .inc or .mac no shared .asm reaches is read on its own, from its own folder. `driveFiles`: every file of the
// sharing drive, from its root; `toolchain`: the toolchain's folders (Irvine's files when the terminal cannot tell).
export function checkIncludes(content: ShareContent, driveFiles: string[], letter: string, toolchain: ToolchainView = { irvine: TOOLCHAIN_FILES, lib: [] }): IncludeFinding[] {
  const shared: { [key: string]: ShareFile } = {}, onDrive: { [key: string]: string } = {};
  content.files.forEach((file) => (shared[nameKey(file.path)] = file));
  driveFiles.forEach((path) => (onDrive[nameKey(path)] = path));
  const own = (letter || "?").toUpperCase(); // a drive without a letter: only its own root names it
  const drawer: DrawerView = {
    find: (path) => (shared[nameKey(path)] ? shared[nameKey(path)].path : onDrive[nameKey(path)] || null),
    rootOf: (l) => (l === own ? "" : null),
    letterOf: () => own,
  };
  const textOf = (path: string): string | null => {
    const file = shared[nameKey(path)];
    return file && isMasmSource(file.path) && !isBinary(sniff(file.bytes)) ? latin1(file.bytes) : null;
  };
  const found = new Map<string, IncludeFinding>(); // one finding per line, the first build reaching it
  const kindOf = (target: Target, argument: string): IncludeKind => {
    if (target.kind === "toolchain") return "toolchain";
    if (target.kind !== "drawer") return "missing";
    if (!shared[nameKey(target.path)]) return "outside";
    return /^[a-zA-Z]:/.test(argument.trim()) ? "letter" : "shared";
  };
  const walk = (file: string, text: string, includers: string[], cwd: Location) => {
    for (const statement of includeStatements(sourceStatements(text))) {
      const isInclude = statement.kind === "include";
      const argument = fileName(statement.argument); // as the guest's assembler reads it
      const target = isInclude ? resolveInclude(argument, includers, cwd, drawer, toolchain) : resolveLibrary(argument, cwd, drawer, toolchain);
      const key = file + "\n" + statement.line;
      if (!found.has(key))
        found.set(key, { file, line: statement.line, directive: isInclude ? "INCLUDE" : "INCLUDELIB", argument, kind: kindOf(target, argument),
          target: target.kind === "drawer" ? target.path : "" });
      const nested = isInclude && target.kind === "drawer" ? textOf(target.path) : null;
      if (nested !== null && target.kind === "drawer" && includers.indexOf(target.path) < 0) walk(target.path, nested, includers.concat([target.path]), cwd);
    }
  };
  const reached = new Set<string>();
  for (const file of content.files) {
    const text = /\.asm$/i.test(file.path) ? textOf(file.path) : null;
    if (text === null) continue;
    walk(file.path, text, [file.path], locationOf(drawer, file.path));
  }
  found.forEach((finding) => reached.add(finding.target));
  for (const file of content.files) {
    const text = /\.(inc|mac)$/i.test(file.path) && !reached.has(file.path) ? textOf(file.path) : null;
    if (text !== null) walk(file.path, text, [file.path], locationOf(drawer, file.path));
  }
  const order = content.files.map((file) => file.path);
  return Array.from(found.values()).sort((a, b) => order.indexOf(a.file) - order.indexOf(b.file) || a.line - b.line);
}

// INCLUDE and INCLUDELIB statements, those in macro bodies too: each line names a file, used or not.
type IncludeStatement = Extract<Statement, { kind: "include" | "includelib" }>;
function includeStatements(statements: Statement[]): IncludeStatement[] {
  const out: IncludeStatement[] = [];
  for (const statement of statements) {
    if (statement.kind === "macro") out.push(...includeStatements(statement.body));
    else if (statement.kind === "include" || statement.kind === "includelib") out.push(statement);
  }
  return out;
}

// The link's copy of each file whose INCLUDE names a shared file with the sharing drive's letter: the letter
// and its colon are dropped (`D:\lab3\x.inc` -> `\lab3\x.inc`), so the path resolves on the drive the program
// is built on. Every other byte stays.
export function dropLetters(content: ShareContent, findings: IncludeFinding[]): ShareContent {
  const byFile: { [path: string]: IncludeFinding[] } = {};
  findings.filter((f) => f.kind === "letter").forEach((f) => (byFile[f.file] = (byFile[f.file] || []).concat([f])));
  return {
    ...content,
    files: content.files.map((file) => {
      const mine = byFile[file.path];
      if (!mine) return file;
      const text = latin1(file.bytes);
      const lines = text.split(/(\r\n|\r|\n)/); // separators kept at odd indexes
      for (const finding of mine) {
        const at = (finding.line - 1) * 2;
        const i = lines[at].indexOf(finding.argument);
        if (i >= 0 && /^[a-zA-Z]:/.test(finding.argument)) lines[at] = lines[at].slice(0, i) + finding.argument.slice(2) + lines[at].slice(i + finding.argument.length);
      }
      const joined = lines.join("");
      const bytes = new Uint8Array(joined.length);
      for (let i = 0; i < joined.length; i++) bytes[i] = joined.charCodeAt(i);
      return { path: file.path, bytes };
    }),
  };
}

// --- importing ---------------------------------------------------------------------------------------------
export interface CheckedLink {
  name: string; // the sender's workspace name as carried
  open: string;
  folders: string[];
  files: ShareFile[];
  skipped: { name: string; reason: string }[];
  warnings: string[]; // files with bidirectional control characters (Trojan Source)
  bytes: number;
}

// The link's entries as an import writes them, every file byte for byte whatever it holds; refused names are
// skipped with their reason. Names that two entries share in any letter case are refused for both (which one was
// meant cannot be known), and so is an entry inside a path a file takes.
export function checkLink(content: ShareContent): CheckedLink {
  const out: CheckedLink = { name: content.name, open: "", folders: [], files: [], skipped: [], warnings: [], bytes: 0 };
  const uses: { [key: string]: number } = {}, isFile: { [key: string]: boolean } = {}, isFolder: { [key: string]: boolean } = {};
  const folderPaths = content.folders.concat(content.files.map((file) => parentOf(file.path)));
  content.files.forEach((file) => {
    uses[nameKey(file.path)] = (uses[nameKey(file.path)] || 0) + 1;
    isFile[nameKey(file.path)] = true;
  });
  content.folders.forEach((folder) => (uses[nameKey(folder)] = (uses[nameKey(folder)] || 0) + 1));
  folderPaths.forEach((folder) => {
    const parts = splitPath(folder);
    for (let i = 1; i <= parts.length; i++) isFolder[nameKey(parts.slice(0, i).join("/"))] = true;
  });
  const clash = (path: string, asFile: boolean): string | null => {
    if (uses[nameKey(path)] > 1) return "another entry has the same name in different letter case";
    if (asFile && isFolder[nameKey(path)]) return "the link also has a folder of that name";
    const parts = splitPath(path);
    for (let i = 1; i < parts.length; i++) if (isFile[nameKey(parts.slice(0, i).join("/"))]) return "it lies inside a path a file takes";
    return null;
  };
  for (const file of content.files) {
    const reason = entryProblem(file.path) || clash(file.path, true);
    if (reason) {
      out.skipped.push({ name: file.path, reason });
      continue;
    }
    out.files.push(file);
    out.bytes += file.bytes.length;
    if (!isBinary(sniff(file.bytes)) && BIDI.test(decodeText(file.bytes, detectEncoding(file.bytes)))) out.warnings.push(file.path);
  }
  for (const folder of content.folders) {
    const reason = entryProblem(folder) || clash(folder, false);
    if (reason) out.skipped.push({ name: folder + "/", reason });
    else out.folders.push(folder);
  }
  const kept = out.files.map((file) => file.path);
  out.open = kept.indexOf(content.open) >= 0 ? content.open : kept.filter((p) => /\.asm$/i.test(p)).sort()[0] || "";
  return out;
}

export interface Comparison {
  added: string[]; // the link's paths new to the drive
  changed: { path: string; existing: string; existingSize: number; incomingSize: number }[]; // existing: the drive's spelling
  same: string[];
  driveOnly: string[]; // the drive's paths the link does not have
}

const equalBytes = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

// The link against a drive with the same label: driveFiles are its paths from its root (names compare in any
// letter case).
export function compareWithDrive(link: CheckedLink, driveFiles: string[], read: (path: string) => Uint8Array): Comparison {
  const existing: { [key: string]: string } = {};
  driveFiles.forEach((path) => (existing[nameKey(path)] = path));
  const result: Comparison = { added: [], changed: [], same: [], driveOnly: [] };
  const incoming: { [key: string]: boolean } = {};
  for (const file of link.files) {
    const key = nameKey(file.path);
    incoming[key] = true;
    const there = existing[key];
    if (!there) result.added.push(file.path);
    else {
      const bytes = read(there);
      if (equalBytes(bytes, file.bytes)) result.same.push(there);
      else result.changed.push({ path: file.path, existing: there, existingSize: bytes.length, incomingSize: file.bytes.length });
    }
  }
  result.driveOnly = driveFiles.filter((path) => !incoming[nameKey(path)]);
  return result;
}

// Merge's question for each changed file, as Windows asks it: Yes, No, Keep Both, Yes to All, No to All, Cancel.
// The state remembers a "to All" answer, which then answers every later question. Keep Both writes the link's file
// beside the drive's (keepBothName).
export type ReplaceAnswer = "yes" | "yesAll" | "no" | "noAll" | "keepBoth" | "cancel";
export interface MergeState {
  all: "yes" | "no" | null;
}
export function mergeStep(state: MergeState, answer: ReplaceAnswer | null): { replace: boolean; keepBoth?: boolean; stop: boolean; state: MergeState } {
  if (state.all) return { replace: state.all === "yes", stop: false, state };
  switch (answer) {
    case "yes":
      return { replace: true, stop: false, state };
    case "keepBoth":
      return { replace: false, keepBoth: true, stop: false, state };
    case "yesAll":
      return { replace: true, stop: false, state: { all: "yes" } };
    case "no":
      return { replace: false, stop: false, state };
    case "noAll":
      return { replace: false, stop: false, state: { all: "no" } };
    default:
      return { replace: false, stop: true, state };
  }
}

// Keep Both: where the link's file goes beside the drive's, "<name>-imported-<YYYYMMDD>-<HHMMSS>-<xxxx><ext>" (local
// time; `random` is four lowercase letters or digits). The name before the extension is shortened so the name
// keeps to 255 UTF-8 bytes and its path in the terminal ("X:\" and the path) to 259 characters.
const pad2 = (n: number): string => (n < 10 ? "0" : "") + n;
export function keepBothName(path: string, now: Date, random: string): string {
  const folder = parentOf(path), name = baseOf(path);
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot) : "";
  const tag = "-imported-" + now.getFullYear() + pad2(now.getMonth() + 1) + pad2(now.getDate()) + "-" + pad2(now.getHours()) + pad2(now.getMinutes()) + pad2(now.getSeconds()) + "-" + random + ext;
  const room = MAX_GUEST_PATH - 3 - (folder ? splitPath(folder).join("\\").length + 1 : 0);
  let stem = dot > 0 ? name.slice(0, dot) : name;
  while (stem && (utf8Length(stem + tag) > MAX_SEGMENT_BYTES || (stem + tag).length > room)) {
    const last = stem.charCodeAt(stem.length - 1);
    stem = stem.slice(0, last >= 0xdc00 && last <= 0xdfff ? -2 : -1); // never half a surrogate pair
  }
  return joinPath(folder, stem + tag);
}

// --- the workspace name ------------------------------------------------------------------------------------
const ADJECTIVES = ("agile amber azure bold brave bright brisk calm candid clever cosmic crisp curious daring deft eager " +
  "early fair fancy fleet fresh gentle giant glad golden grand happy hardy honest humble jolly keen kind lively " +
  "lucid lucky merry mighty misty modest noble plucky polite proud quick quiet rapid ready rosy royal silent " +
  "silver sleek smooth snowy solar steady sunny swift tidy vivid warm wise witty").split(" ");
const ANIMALS = ("badger beaver bison bobcat camel cheetah condor cougar coyote crane dingo dolphin eagle falcon " +
  "ferret finch fox gazelle gecko gopher heron hippo husky ibex jackal jaguar koala lemur leopard lion llama " +
  "lynx macaw marmot meerkat mink moose narwhal ocelot orca osprey otter owl panda panther parrot pelican " +
  "penguin puffin quail raven robin salmon seal sparrow stork swan tiger toucan turtle walrus whale wolf zebra").split(" ");

// "<adjective>-<animal>" from 2 random bytes
export function workspaceNameFrom(bytes: Uint8Array): string {
  return ADJECTIVES[bytes[0] & 63] + "-" + ANIMALS[bytes[1] & 63];
}
export const WORD_LISTS = { adjectives: ADJECTIVES, animals: ANIMALS };
