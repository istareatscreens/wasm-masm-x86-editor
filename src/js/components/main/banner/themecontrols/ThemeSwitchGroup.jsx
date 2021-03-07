import React, { useState } from "react";

import Switch from "../../../common/ImageSwitch.jsx";
import Button from "../../../common/ImageButton.jsx";

import darkMode from "../../../../../images/darkMode.png";
import themeMenu from "../../../../../images/themeMenu.png";
import sun from "../../../../../images/sun.png";
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
