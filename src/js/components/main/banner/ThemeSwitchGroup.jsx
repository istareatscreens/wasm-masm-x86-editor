import React, { useState } from "react";
import darkMode from "../../../../images/darkMode.png";
import themeMenu from "../../../../images/themeMenu.png";

function ThemeSwitchGroup({ selectedTheme, setSelectedTheme }) {
  const [themeList, setThemeList] = useState(null);

  return (
    <>
      <Switch title="Adjust theming" src={themeMenu} onChange={(event) => {}} />
      <Button
        title="switch to dark mode"
        onClick={run}
        className={"banner__main__btn"}
        title={"dark-mode"}
        src={monitorMoon}
      />
    </>
  );
}

export default ThemeSwitchGroup;
