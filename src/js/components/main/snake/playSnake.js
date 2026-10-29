import FileSystem from "../utility/FileSystem.js";
import { joinPath, nameKey } from "../utility/filesystem/paths";
import { assembleAndRun, focusTerminal, readToolchainFiles } from "../../../utility/utilityFunctions.ts";
import md5 from "./md5.js";

// The About window's Snake button: the game is built and run from its folder in the file
// drawer with only the terminal showing. Its folder is a root folder snake or snake-<uuid>
// (any case) whose snake.asm starts with the header line below, looked up in the drawer at
// each click. When there is none, the game shipped on C: (C:\files\snake in the guest,
// snake/ in the toolchain archive) is copied into D:\snake, or into D:\snake-<uuid> when a
// root entry named snake is not the game. A copy still equal to a version shipped earlier
// (EARLIER_MD5: the digests toolchain-zip.py records) is replaced in place by the game shipped
// now; a copy the user changed is left alone and played as it is.
const FILES = { "snake.asm": "snake/snake.asm", LICENSE: "snake/LICENSE" };
const EARLIER_MD5 = ["52c93f064e82679d7cbc7bc144505b9e", "e3ccd1f0897c0b2f0eda901c209e6cad", "9dcd92b45fb961690771c9af69dddcde", "3128fa92b0058f26aaca76f43b9d66d8"];
const HEADER = "; Snake - https://github.com/meixinchoy/Snake-Game-Assembly-Language";
const GAME_FOLDER = /^snake(-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?$/i;

const uuid = () => {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // outside a secure context: a version 4 UUID from random bytes
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => ("0" + b.toString(16)).slice(-2)).join("");
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join("-");
};

// The first line of a stored file is the header (ASCII, the line ending after it).
const startsWithHeader = (path) => {
  const bytes = FileSystem.getBytes(path);
  if (bytes.length < HEADER.length) return false;
  for (let i = 0; i < HEADER.length; i++) if (bytes[i] !== HEADER.charCodeAt(i)) return false;
  return bytes.length === HEADER.length || bytes[HEADER.length] === 13 || bytes[HEADER.length] === 10;
};

// The game's snake.asm in the drawer now: in snake first, then in the other folders by name.
const findGame = () => {
  const files = FileSystem.getFileList();
  const folders = FileSystem.getAllFolders().filter((folder) => !folder.includes("/") && GAME_FOLDER.test(folder));
  folders.sort((a, b) => {
    const plainA = nameKey(a) === "snake", plainB = nameKey(b) === "snake";
    if (plainA !== plainB) return plainA ? -1 : 1;
    return a < b ? -1 : a > b ? 1 : 0;
  });
  for (const folder of folders) {
    const key = nameKey(joinPath(folder, "snake.asm"));
    const source = files.find((file) => nameKey(file) === key);
    if (source && startsWithHeader(source)) return source;
  }
  return null;
};

// A root folder or file of that name, in any letter case.
const rootEntryExists = (name) =>
  FileSystem.getAllFolders().concat(FileSystem.getFileList()).some((path) => !path.includes("/") && nameKey(path) === nameKey(name));

export default async function playSnake({ switchFile, refreshFileList }) {
  let source = findGame();
  if (source && EARLIER_MD5.includes(md5(FileSystem.getBytes(source)))) {
    try {
      const read = await readToolchainFiles([FILES["snake.asm"]]);
      FileSystem.storeImported(source, new Uint8Array(read[FILES["snake.asm"]]));
      console.log("[Snake] " + source + " was an earlier version of the game: replaced by the one shipped now");
    } catch (error) {
      console.error("[Snake] could not read C:\\files\\snake: " + error);
    }
  }
  if (!source) {
    let read;
    try {
      read = await readToolchainFiles(Object.values(FILES));
    } catch (error) {
      console.error("[Snake] could not read C:\\files\\snake: " + error);
      return;
    }
    // a click made while the files were read may have copied the game already
    source = findGame();
    if (!source) {
      const folder = rootEntryExists("snake") ? "snake-" + uuid() : "snake";
      FileSystem.createFolder(folder);
      // the upload rules: snake.asm as CRLF text, LICENSE byte for byte (copied out of the
      // emulator page's realm)
      for (const [name, entry] of Object.entries(FILES)) FileSystem.storeImported(joinPath(folder, name), new Uint8Array(read[entry]));
      source = joinPath(folder, "snake.asm");
    }
  }
  switchFile(source);
  refreshFileList();
  window.dispatchEvent(new CustomEvent("show-only-cmd"));
  FileSystem.stripByteOrderMarks();
  assembleAndRun(source, FileSystem.getRawFileData(source), true);
  focusTerminal();
}
