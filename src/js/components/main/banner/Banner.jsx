import React from "react";
import Button from "../../common/ImageButton.jsx";
import Switch from "../../common/ImageSwitch.jsx";
import useWindowToggle from "../../common/useWindowToggle.js";
import vimImage from "../../../../images/vim.svg";
import {
  resetEmulator,
  interruptEmulator,
  checkFileExtension,
  assembleAndRun,
  runInEmulator,
  focusTerminal,
} from "../../../utility/utilityFunctions.ts";

import FileSystem from "../utility/FileSystem.js";
import { outputPath } from "../utility/filesystem/paths";

import buildFile from "../../../../images/buildFile.png";
import cmdReset from "../../../../images/cmdReset.png";
import cmdCancel from "../../../../images/cmdCancel.png";
import runBinary from "../../../../images/runBinary.png";
import aboutIcon from "../../../../images/about.png";
import resetCache from "../../../../images/cacheReset.png";

import About from "./about/About.jsx";
import ResetCache from "./about/ResetCache.jsx";
import ViewControlGroup from "./viewcontrols/ViewControlGroup.jsx";
import Dropdown from "./../../common/Dropdown.jsx";
import ThemeControlGroup from "./themecontrols/ThemeControlGroup.jsx";
import ThemeControlWindow from "./themecontrols/ThemeControlWindow.jsx";
import FullscreenSwitch from "./viewcontrols/FullScreenSwitch.jsx";
import HandlesSwitch from "./viewcontrols/HandlesSwitch.jsx";

const Banner = function Banner({
  filename,
  viewMode,
  fileList,
  //fonts
  fontSize,
  setFontSize,
  selectedFont,
  setSelectedFont,
  fontList,
  //theme
  themeList,
  setLightMode,
  lightMode,
  setSelectedDayTheme,
  setSelectedNightTheme,
  selectedDayTheme,
  selectedNightTheme,
  //vim
  vimMode,
  setVimMode,
  //resize handles
  handlesHidden,
  setHandlesHidden,
  //drives (Hard Reset Everything)
  drives,
  deleteExtraDrives,
}) {
  const about = useWindowToggle();
  const hardReset = useWindowToggle();
  const themeSettings = useWindowToggle();

  const build = () => {
    if (/.asm$/.test(filename)) {
      // Sync the current .asm directly into the guest (D:, no echo) and
      // assemble->link->run it in one atomic iframe step. The guest gets the stored
      // bytes exactly (the editor saves through the same storage), with a localStorage
      // fallback for legacy-stored files.
      FileSystem.stripByteOrderMarks();
      FileSystem.useDriveToRun(filename); // a drive without a letter gets one first
      const bytes = FileSystem.getRawFileData(filename);
      if (bytes) assembleAndRun(filename, bytes, true);
      else assembleAndRun(filename, FileSystem.getFileContentSync(filename), false);
      viewMode.showTerminal();
      focusTerminal(); // the program's input is typed next
    } else {
      console.log("not an assembly file: " + filename);
    }
  };

  const checkForFile = () => {
    return !fileList.includes(outputPath(filename, ".exe"));
  };

  const reset = () => {
    resetEmulator();
  };

  // Ctrl+C for the terminal: stops the running program/command, keeps the session.
  const cancel = () => {
    interruptEmulator();
    viewMode.showTerminal();
    focusTerminal();
  };

  // The user may have cd'd anywhere in the terminal, so the binary (bin\<name>.exe) runs FROM its
  // source's folder on the source's own drive, as a build does (emulator page: Boxedwine.jsx).
  const run = () => {
    if (/.asm$/.test(filename)) {
      FileSystem.useDriveToRun(filename);
      runInEmulator(filename);
      viewMode.showTerminal();
      focusTerminal();
    }
  };

  const checkIfAsm = () => {
    return !checkFileExtension(".asm", filename);
  };

  //TODO: Move props to objects
  return (
    <>
      {about.isOpen && <About close={about.close} />}
      {hardReset.isOpen && <ResetCache close={hardReset.close} drives={drives} fileList={fileList} deleteExtraDrives={deleteExtraDrives} />}
      {themeSettings.isOpen && (
        <ThemeControlWindow
          close={themeSettings.close}
          themeList={themeList}
          setSelectedDayTheme={setSelectedDayTheme}
          setSelectedNightTheme={setSelectedNightTheme}
          selectedDayTheme={selectedDayTheme}
          selectedNightTheme={selectedNightTheme}
        />
      )}
      <div className={"banner__patch"} />
      <div className={"banner"} />
      <div className={"banner__main"}>
        <div className={"banner__main__group banner__main__group--start"}>
          <Button
            className={"banner__main__btn"}
            onClick={build}
            title={"compile, link and run .asm file"}
            id={"pushData"}
            disabled={checkIfAsm()}
            src={buildFile}
          />
          <Button
            onClick={run}
            className={"banner__main__btn"}
            title={"run compiled binary"}
            id={"runEXE"}
            disabled={checkForFile()}
            src={runBinary}
          />
          <Button
            title={"cancel the running command (Ctrl+C)"}
            className={"banner__main__btn"}
            onClick={cancel}
            id={"cancelCMD"}
            src={cmdCancel}
          />
          <Button
            title={"reset command prompt"}
            className={"banner__main__btn"}
            onClick={reset}
            id={"resetCMD"}
            src={cmdReset}
          />
          <Button
            title={"hard reset"}
            className={"banner__main__btn"}
            onClick={hardReset.toggle}
            {...hardReset.opener}
            src={resetCache}
          />
          <input
            type="number"
            value={fontSize}
            onChange={(event) => {
              if (event.target.value >= 1) {
                setFontSize(event.target.value);
              }
            }}
            className="input-box input-box--font"
          />
          <Dropdown
            aria-label="Editor font"
            onChange={setSelectedFont}
            classNameDropdown={""}
            options={fontList}
            selected={selectedFont}
          />
          <ThemeControlGroup
            themeSettings={themeSettings}
            lightMode={lightMode}
            setLightMode={setLightMode}
          />
          <Switch
            checked={!!vimMode}
            title={vimMode ? "disable Vim mode" : "enable Vim mode"}
            imgClass={"switch__image--vim"}
            onChange={(event) => setVimMode(event.target.checked)}
            src={vimImage}
          />
          <ViewControlGroup
            className={"banner__main__group banner__main__group--mid"}
            view={viewMode.view}
            zen={viewMode.zen}
            onPaneChange={viewMode.setPane}
            onZenChange={viewMode.setZen}
          />
          <FullscreenSwitch />
          <HandlesSwitch hidden={!!handlesHidden} onChange={setHandlesHidden} />
        </div>
        <div className={"banner__main__group banner__main__group--end"}>
          <Button
            title={"application info"}
            className={"banner__main__btn"}
            onClick={about.toggle}
            {...about.opener}
            src={aboutIcon}
          />
        </div>
      </div>
    </>
  );
};

export default React.memo(Banner);
