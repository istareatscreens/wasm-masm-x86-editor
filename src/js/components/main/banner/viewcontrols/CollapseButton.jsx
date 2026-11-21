import React from "react";

// Collapses the main toolbar to its first row. It only shows while the toolbar's controls cannot all stand on
// one row (data-banner-overflow, useBannerRows.js).
const CollapseButton = ({ collapsed, onChange }) => (
  <button
    type="button"
    className={"btn banner__main__btn banner__collapse" + (collapsed ? " banner__collapse--collapsed" : "")}
    title={collapsed ? "show all toolbar buttons" : "collapse the toolbar to one row"}
    aria-expanded={!collapsed}
    onClick={() => onChange(!collapsed)}
  />
);

export default CollapseButton;
