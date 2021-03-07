import React, { useState } from "react";

import Switch from "../../../common/ImageSwitch.jsx";
import Button from "../../../common/ImageButton.jsx";

import themeMenu from "../../../../../images/themeMenu.png";
//source: http://pixelartmaker.com/art/67c5bb4f1a79b43
import sun from "../../../../../images/sun.png";
//source: http://pixelartmaker.com/art/4bc9a3f2fb39a94
import moon from "../../../../../images/moon.png";

function ThemeSwitchGroup({
  setLightMode,
  lightMode,
  themeSettingsOpened,
  setThemeSettingsOpened,
}) {
  return (
    <>
      <Switch
        checked={lightMode}
        title={`switch to ${lightMode ? "light mode" : "dark mode"}`}
        onChange={(event) => setLightMode(event.target.checked)}
        src={lightMode ? moon : sun}
      />
      <Button
        title="Adjust theming"
        onClick={() => setThemeSettingsOpened(!themeSettingsOpened)}
        className={"banner__main__btn"}
        title={"dark-mode"}
        src={themeMenu}
      />
    </>
  );
}

export default ThemeSwitchGroup;
