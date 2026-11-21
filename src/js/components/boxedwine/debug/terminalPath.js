import { D_NATIVE, STORE_NATIVE } from "../../main/utility/filesystem/drives";
import { nameKey } from "../../main/utility/build/fileNames";

// A file as the terminal names it (D:\lab1\bin\main.exe) in this page's file system ("" for a drive with no folder
// here); a part not there as written is matched without regard to case, as Windows does.
// `drives`: the page's map of drive ids to { letter }. `fs`: the emulator's Module.FS.
export function nativeFileOf(path, drives, fs) {
  const match = /^([a-z]):[\\/]*(.*)$/i.exec(path || "");
  if (!match) return "";
  const letter = match[1].toLowerCase();
  let folder = letter === "d" ? D_NATIVE : "";
  if (!folder) for (const [id, drive] of drives) if (drive.letter === letter) folder = STORE_NATIVE + "/" + id;
  if (!folder) return "";
  for (const part of match[2].split(/[\\/]+/).filter((name) => name)) {
    let name = part;
    try {
      fs.stat(folder + "/" + part);
    } catch (missing) {
      try {
        const key = nameKey(part);
        name = fs.readdir(folder).filter((entry) => nameKey(entry) === key)[0] || part;
      } catch (unreadable) {
        name = part;
      }
    }
    folder += "/" + name;
  }
  return folder;
}
