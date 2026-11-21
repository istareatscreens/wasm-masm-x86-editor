import React, { useEffect, useState } from "react";

import ConfirmWindow from "../../filedrawer/dialogs/ConfirmWindow.jsx";
import FileSystem from "../../utility/FileSystem.js";
import { planFile as planOf } from "../../utility/build/BuildService";
import { outputPath } from "../../utility/filesystem/paths";
import { assembleAndRun, buildPlanInEmulator, focusTerminal, runInEmulator } from "../../../../utility/utilityFunctions.ts";
import { buildRequest } from "./buildRequest";
import { TITLE, base64Of, isAsm, messageOf, prepareBuild } from "./buildSteps.js";

// Build builds the open file's plan (its program's when it is a module); Run runs that program's bin\<program>.exe.
// `element` is the message box a plan's problem opens.
export default function useBuild({ filename, fileList, viewMode }) {
  const [message, setMessage] = useState(null);
  const [planned, setPlanned] = useState(null); // { file, program }: the program Run runs for that file

  // The program Run runs: its plan's while that makes an .exe (never a DLL's, or a module's that several programs
  // link); the file's own until the plan of the open file is known (while the terminal starts, say).
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
    prepareBuild(filename);
    show();
    let plan;
    try {
      plan = await planOf(filename);
    } catch (error) {
      // the emulator page cannot be read yet: build the file alone
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
