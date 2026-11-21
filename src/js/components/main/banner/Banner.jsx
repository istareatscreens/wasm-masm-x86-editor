import React from "react";
import Button from "../../common/ImageButton.jsx";
import TextField from "../../common/TextField.jsx";
import Switch from "../../common/ImageSwitch.jsx";
import useWindowToggle from "../../common/useWindowToggle.js";
import vimImage from "../../../../images/vim.svg";
import {
  interruptEmulator,
  checkFileExtension,
  focusTerminal,
} from "../../../utility/utilityFunctions.ts";

import { resetTerminal } from "../cmd/terminalReset";
import useBuild from "./build/useBuild.jsx";
import DebugSwitch from "./debug/DebugSwitch.jsx";
import useDebugBanner from "./debug/useDebugBanner.js";

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
import CollapseButton from "./viewcontrols/CollapseButton.jsx";

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
  //collapsing the toolbar to one row
  bannerCollapsed,
  setBannerCollapsed,
  //drives (Hard Reset Everything)
  drives,
  deleteExtraDrives,
  //debugging
  debugMode,
  setDebugMode,
  debugController,
}) {
  const about = useWindowToggle();
  const hardReset = useWindowToggle();
  const themeSettings = useWindowToggle();

  // Build and Run: the open file's build plan (its program's when it is a module)
  const builder = useBuild({ filename, fileList, viewMode });

  const reset = () => {
    void resetTerminal();
  };

  // Ctrl+C for the terminal: stops the running program/command, keeps the session.
  const cancel = () => {
    interruptEmulator();
    viewMode.showTerminal();
    focusTerminal();
  };

  const checkIfAsm = () => {
    return !checkFileExtension(".asm", filename);
  };

  // the build buttons: RUN's own, or what they mean while Debug is on
  const buttons = useDebugBanner({
    on: !!debugMode,
    controller: debugController,
    filename,
    plain: {
      run: { onClick: builder.build, disabled: checkIfAsm(), title: "compile, link and run .asm file" },
      runBinary: { onClick: builder.run, disabled: !builder.canRun, title: "run compiled binary" },
      cancel: { onClick: cancel, title: "cancel the running command (Ctrl+C)" },
      reset: { onClick: reset, title: "reset command prompt" },
    },
  });

  //TODO: Move props to objects
  return (
    <>
      {about.isOpen && <About close={about.close} />}
      {builder.element}
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
        <div className={"banner__main__group banner__main__group--start" + (bannerCollapsed ? " banner__main__group--collapsed" : "")}>
          <div className={"banner__main__together"}>
            <Button className={"banner__main__btn"} {...buttons.run} id={"pushData"} src={buildFile} />
            <Button className={"banner__main__btn"} {...buttons.runBinary} id={"runEXE"} src={runBinary} />
            <DebugSwitch on={!!debugMode} onChange={setDebugMode} />
          </div>
          <Button className={"banner__main__btn"} {...buttons.cancel} id={"cancelCMD"} src={cmdCancel} />
          <Button className={"banner__main__btn"} {...buttons.reset} id={"resetCMD"} src={cmdReset} />
          <Button
            title={"hard reset"}
            className={"banner__main__btn"}
            onClick={hardReset.toggle}
            {...hardReset.opener}
            src={resetCache}
          />
          <TextField
            type="number"
            value={fontSize}
            onChange={(event) => {
              if (event.target.value >= 1) {
                setFontSize(event.target.value);
              }
            }}
            className="input-box--font"
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
          <CollapseButton collapsed={!!bannerCollapsed} onChange={setBannerCollapsed} />
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
