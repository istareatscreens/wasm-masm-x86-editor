import React, { useEffect, useState } from "react";

import ConfirmWindow from "../../filedrawer/dialogs/ConfirmWindow.jsx";
import FileSystem from "../../utility/FileSystem.js";
import { planFile as planOf } from "../../utility/build/BuildService";
import { guestPath, outputPath } from "../../utility/filesystem/paths";
import { bytesToBase64 } from "../../utility/filesystem/textEncoding";
import { assembleAndRun, buildPlanInEmulator, focusTerminal, runInEmulator } from "../../../../utility/utilityFunctions.ts";
import { buildRequest } from "./buildRequest";

const TITLE = "Compile, Link and Run";
const isAsm = (path) => /\.asm$/i.test(path || "");
// a drawer file's stored bytes as base64; a legacy file stored as text, as UTF-8
const base64Of = (path) => FileSystem.getRawFileData(path) || bytesToBase64(new TextEncoder().encode(FileSystem.getFileContentSync(path)));

// What a plan's problem says, in the app's Windows 98 message box: the name, every file, and what to do.
function messageOf(plan) {
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

// The banner's Build and Run (openspec change implement-masm-file-linking, design D8 and D9): Build builds the
// plan of the open file, its program's when it is a module; Run runs that program's bin\<program>.exe. `element`
// is the message box a plan's problem opens.
export default function useBuild({ filename, fileList, viewMode }) {
  const [message, setMessage] = useState(null);
  const [planned, setPlanned] = useState(null); // { file, program }: the program Run runs for that file

  // The program Run runs: its plan's while that makes an .exe (never a DLL's, or a module's that several programs
  // link). Until the plan of the open file is known (the terminal starting, say), the file's own, as before plans.
  useEffect(() => {
    let live = true;
    if (isAsm(filename))
      planOf(filename).then(
        (plan) => live && setPlanned({ file: filename, program: plan.output === "exe" ? plan.program : null }),
        () => {},
      );
    return () => {
      live = false;
    };
  }, [filename, fileList]);
  const runTarget = !isAsm(filename) ? null : planned && planned.file === filename ? planned.program : filename;

  const show = () => {
    viewMode.showTerminal();
    focusTerminal(); // the program's input is typed next
  };

  const build = async () => {
    if (!isAsm(filename)) return;
    FileSystem.flushPendingSaves(); // the editor's autosave waits for a pause in typing: what it holds is built too
    FileSystem.stripByteOrderMarks();
    FileSystem.useDriveToRun(filename); // a drive without a letter gets one first
    show();
    let plan;
    try {
      plan = await planOf(filename);
    } catch (error) {
      // the emulator page cannot be read yet: the file alone, as builds were before plans
      console.warn("[build] no plan (" + error + "): building " + filename + " alone");
      const bytes = FileSystem.getRawFileData(filename);
      if (bytes) assembleAndRun(filename, bytes, true);
      else assembleAndRun(filename, FileSystem.getFileContentSync(filename), false);
      return;
    }
    const problem = messageOf(plan);
    if (problem) setMessage(problem);
    if (plan.problems.length) return; // nothing is typed: the message says why
    buildPlanInEmulator(buildRequest(plan, base64Of));
  };

  const run = () => {
    if (!runTarget) return;
    FileSystem.useDriveToRun(runTarget);
    runInEmulator(runTarget);
    show();
  };

  const canRun = !!runTarget && fileList.includes(outputPath(runTarget, ".exe"));
  const element = message && (
    <ConfirmWindow title={TITLE} icon="warning" message={message.message} details={message.details} choices={[{ label: "OK" }]} close={() => setMessage(null)} />
  );
  return { build, run, canRun, element };
}
