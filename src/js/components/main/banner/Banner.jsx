import React, { useState } from "react";
import Button from "../../common/ImageButton.jsx";
import Switch from "../../common/ImageSwitch.jsx";
import vimImage from "../../../../images/vim.svg";
import {
  resetEmulator,
  interruptEmulator,
  writeCommandToCMD,
  quoteForCmd,
  checkFileExtension,
  assembleAndRun,
} from "../../../utility/utilityFunctions.ts";

import FileSystem from "../utility/FileSystem.js";

import buildFile from "../../../../images/buildFile.png";
import cmdReset from "../../../../images/cmdReset.png";
import cmdCancel from "../../../../images/cmdCancel.png";
import runBinary from "../../../../images/runBinary.png";
import about from "../../../../images/about.png";
import resetCache from "../../../../images/cacheReset.png";

import About from "./about/About.jsx";
import ResetCache from "./about/ResetCache.jsx";
import ViewControlGroup from "./viewcontrols/ViewControlGroup.jsx";
import Dropdown from "./../../common/Dropdown.jsx";
import ThemeControlGroup from "./themecontrols/ThemeControlGroup.jsx";
import ThemeControlWindow from "./themecontrols/ThemeControlWindow.jsx";
import FullscreenSwitch from "./viewcontrols/FullScreenSwitch.jsx";

const Banner = function Banner({
  filename,
  refApp,
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
}) {
  const [aboutPageOpened, setAboutPageOpened] = useState(false);
  const [resetCachePageOpened, setResetCacheOpened] = useState(false);
  const [themeSettingsOpened, setThemeSettingsOpened] = useState(false);

  const unhideTerminal = () => {
    if (
      refApp.classList[2] == "app-layout--no-cmd" ||
      refApp.classList[2] == "app-layout--only-editor"
    ) {
      console.log("firing event");
      window.dispatchEvent(new CustomEvent("show-cmd"));
    }
  };

  const build = async () => {
    if (/.asm$/.test(filename)) {
      // Sync the current .asm directly into the guest (D:, no echo) and
      // assemble->link->run it in one atomic iframe step. Content comes from the
      // app's storage (IndexedDB, async) with a localStorage fallback for
      // legacy-stored files, so it reflects the latest editor save.
      let content = "";
      try {
        content = await FileSystem.getFileData(filename);
      } catch (error) {
        console.error("build: async read failed, trying sync", error);
      }
      if (!content) content = FileSystem.getFileContentSync(filename);
      assembleAndRun(filename, content);
      unhideTerminal();
    } else {
      console.log("not an assembly file: " + filename);
    }
  };

  //TODO: FIX bug when selecting non asm files
  const getExecutableName = () => {
    return `${filename.substring(0, filename.length - 3)}exe`;
  };

  const checkForFile = () => {
    return !fileList.includes(getExecutableName());
  };

  const reset = () => {
    resetEmulator();
  };

  // Ctrl+C for the terminal: stops the running program/command, keeps the session.
  const cancel = () => {
    interruptEmulator();
    unhideTerminal();
  };

  // The drawer's files live in the root of D:; the user may have cd'd anywhere in the
  // terminal, so run the binary FROM D:\ (pushd/popd: the prompt's own directory is
  // restored afterwards) instead of hoping the current directory is still D:\.
  // A name with spaces (or other cmd-special characters) is quoted for cmd.
  const run = () => {
    if (/.asm$/.test(filename)) {
      writeCommandToCMD("pushd D:\\ & " + quoteForCmd(getExecutableName()) + " & popd");
      unhideTerminal();
    }
  };

  const checkIfAsm = () => {
    return !checkFileExtension(".asm", filename);
  };
  const handleFontChange = (event) => {
    setSelectedFont(fontList[event.target.selectedIndex]);
  };

  //TODO: Move props to objects
  return (
    <>
      {aboutPageOpened && (
        <About close={() => setAboutPageOpened(false)} />
      )}
      {resetCachePageOpened && (
        <ResetCache close={() => setResetCacheOpened(false)}></ResetCache>
      )
      }
      {themeSettingsOpened && (
        <ThemeControlWindow
          setThemeSettingsOpened={setThemeSettingsOpened}
          themeSettingsOpened={setThemeSettingsOpened}
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
            onClick={() => setResetCacheOpened(!resetCachePageOpened)}
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
            handleChange={(event) => {
              handleFontChange(event);
            }}
            classNameDropdown={""}
            options={fontList}
            selected={selectedFont}
            value={selectedFont}
          />
          <ThemeControlGroup
            setThemeSettingsOpened={setThemeSettingsOpened}
            themeSettingsOpened={themeSettingsOpened}
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
            refApp={refApp}
          />
          <FullscreenSwitch />
        </div>
        <div className={"banner__main__group banner__main__group--end"}>
          <Button
            title={"application info"}
            className={"banner__main__btn"}
            onClick={() => setAboutPageOpened(!aboutPageOpened)}
            src={about}
          />
        </div>
      </div>
    </>
  );
};

export default React.memo(Banner);
