// A theme sets --hexviewer-<token> custom properties (the stylesheet's defaults are the light preset): a preset's
// name, set as data-hexviewer-theme on the root, or camelCase token values set inline (an object may name a
// `preset` to start from). A page may add presets as [data-hexviewer-theme="<name>"] rules that set tokens only.
export const TOKENS = [
  // text
  "font-family",
  "font-size",
  "cell-width",
  "set-gap",
  // surface
  "background",
  "color",
  "frame-shadow",
  "border",
  // columns
  "heading-color",
  "heading-background",
  "ascii-color",
  "header-background",
  "header-color",
  "header-shadow",
  // pointer and selection
  "hover-background",
  "hover-color",
  "set-hover-color",
  "selection-background",
  "selection-color",
  "selection-inactive-background",
  "selection-inactive-color",
  // caret
  "caret-outline",
  "caret-mirror-background",
  // cell states
  "changed-color",
  "unreadable-color",
  // disabled
  "disabled-background",
  "disabled-color",
];

export const PRESETS = ["light", "dark"];

const camel = (token) => token.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
const KNOWN = new Map(TOKENS.map((token) => [camel(token), "--hexviewer-" + token]));

// What a theme puts on the root element: the preset's name as an attribute, and token values as custom
// properties. Names that are not tokens are left out.
export function themeAttributes(theme) {
  if (!theme) return { preset: undefined, style: {} };
  if (typeof theme === "string") return { preset: theme, style: {} };
  const style = {};
  for (const name of Object.keys(theme)) {
    const property = KNOWN.get(name);
    if (property && theme[name] !== undefined && theme[name] !== null) style[property] = String(theme[name]);
  }
  return { preset: typeof theme.preset === "string" ? theme.preset : undefined, style };
}
