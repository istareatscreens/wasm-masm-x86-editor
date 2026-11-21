import FileSystem from "../../utility/FileSystem.js";
import { guestPath } from "../../utility/filesystem/paths";
import { bytesToBase64 } from "../../utility/filesystem/textEncoding";

// What RUN does before it builds, and says when it cannot: shared with a debug launch, which is the same build.
export const TITLE = "Compile, Link and Run";
export const isAsm = (path) => /\.asm$/i.test(path || "");
// a drawer file's stored bytes as base64; a legacy file stored as text, as UTF-8
export const base64Of = (path) => FileSystem.getRawFileData(path) || bytesToBase64(new TextEncoder().encode(FileSystem.getFileContentSync(path)));

// The files as the build must find them: what the editor still holds is saved, and the file's drive has a letter.
export function prepareBuild(filename) {
  FileSystem.flushPendingSaves(); // the editor's autosave waits for a pause in typing: what it holds is built too
  FileSystem.stripByteOrderMarks();
  FileSystem.useDriveToRun(filename); // a drive without a letter gets one first
}

// What a plan's problem says, in the app's Windows 98 message box: the name, every file, and what to do.
export function messageOf(plan) {
  const defined = plan.problems.find((problem) => problem.kind === "defined-twice");
  if (defined)
    return {
      message: [
        defined.name + " is defined in more than one file, so the program cannot be linked.",
        "Keep one of them, or put the program in a folder of its own: a program links modules from its folder and the folders below it.",
      ],
      details: defined.files.map(guestPath),
    };
  const percent = plan.problems.find((problem) => problem.kind === "percent");
  if (percent)
    return {
      message: ["A file name with % in it cannot reach the assembler: the terminal's cmd changes it.", "Rename the file to build the program."],
      details: percent.files.map(guestPath),
    };
  const dllName = plan.problems.find((problem) => problem.kind === "dll-name");
  if (dllName)
    return {
      message: [
        "A DLL needs a name in ASCII characters: a program finds the DLLs it imports by names that Windows reads in its ANSI code page.",
        "Rename the DLL's source and its .def, and the name after LIBRARY, to build it.",
      ],
      details: dllName.files.map(guestPath),
    };
  if (plan.programs.length > 1)
    return {
      message: [guestPath(plan.file) + " is a module of more than one program, so it was only assembled.", "Build one of the programs to link it."],
      details: plan.programs.map(guestPath),
    };
  return null;
}
