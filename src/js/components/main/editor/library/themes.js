// The editor's CodeMirror 6 themes: @uiw/codemirror-themes-all, thememirror and @codemirror/theme-one-dark.
import * as uiw from "@uiw/codemirror-themes-all";
import * as thememirror from "thememirror";
import { oneDark } from "@codemirror/theme-one-dark";

const registry = Object.create(null); // id -> Extension
const ids = []; // insertion order for the dropdown

function addExtension(id, ext) {
  if (registry[id]) return false;
  registry[id] = ext;
  ids.push(id);
  return true;
}

// one-dark first so it can serve as the default.
addExtension("one-dark", oneDark);

// @uiw themes are Array-valued, but so are its `*Style` HighlightStyle exports: those, the `*Init` factories
// and the `defaultSettings*` objects are filtered out by name.
const UIW_NON_THEME = /(Init|Style)$/;
for (const [name, value] of Object.entries(uiw)) {
  if (!Array.isArray(value)) continue;
  if (UIW_NON_THEME.test(name) || name.startsWith("defaultSettings")) continue;
  addExtension(name, value);
}

// thememirror themes: keep Array-valued exports; prefix on collision with @uiw
// so both distinct looks remain available (e.g. tm-dracula vs dracula).
for (const [name, value] of Object.entries(thememirror)) {
  if (!Array.isArray(value)) continue;
  addExtension(registry[name] ? "tm-" + name : name, value);
}

export const themeRegistry = registry;

// The list consumed by App.jsx / ThemeControlWindow dropdowns: { id, text }.
export const themeList = ids.map((id, index) => ({ id: index, key: id, text: id }));

export const DEFAULT_THEME_ID = "one-dark";
const DEFAULT_LIGHT_THEME_ID = registry["basicLight"] ? "basicLight" : DEFAULT_THEME_ID;

// CodeMirror 5 theme names, saved by older versions, mapped to the closest CM6 theme.
const CM5_ALIASES = {
  default: "one-dark",
  abcdef: "abcdef",
  "ambiance-mobile": "andromeda",
  ambiance: "andromeda",
  "ayu-dark": "andromeda",
  "ayu-mirage": "andromeda",
  "base16-dark": "basicDark",
  "base16-light": "basicLight",
  bespin: "bespin",
  blackboard: "vscodeDark",
  cobalt: "cobalt",
  darcula: "darcula",
  dracula: "dracula",
  "duotone-dark": "duotoneDark",
  "duotone-light": "duotoneLight",
  eclipse: "eclipse",
  "gruvbox-dark": "gruvboxDark",
  idea: "eclipse",
  material: "material",
  "material-darker": "materialDark",
  "material-ocean": "materialDark",
  "material-palenight": "materialDark",
  "mdn-like": "githubLight",
  midnight: "vscodeDark",
  monokai: "monokai",
  "oceanic-next": "nord",
  nord: "nord",
  "panda-syntax": "dracula",
  "paraiso-dark": "gruvboxDark",
  "paraiso-light": "gruvboxLight",
  "pastel-on-dark": "vscodeDark",
  railscasts: "monokai",
  solarized: "solarizedDark",
  "solarized dark": "solarizedDark",
  "solarized light": "solarizedLight",
  "the-matrix": "vscodeDark",
  "tomorrow-night-bright": "tomorrowNightBlue",
  "tomorrow-night-eighties": "tomorrowNightBlue",
  twilight: "vscodeDark",
  "xq-dark": "vscodeDark",
  "xq-light": "githubLight",
  yeti: "githubLight",
  zenburn: "gruvboxDark",
};

// A stored theme id (a CM6 id or a CM5 name) as a registry id, or the default.
export function normalizeThemeId(id, dark = true) {
  if (id && registry[id]) return id;
  if (id && CM5_ALIASES[id] && registry[CM5_ALIASES[id]]) return CM5_ALIASES[id];
  return dark ? DEFAULT_THEME_ID : DEFAULT_LIGHT_THEME_ID;
}

export function resolveTheme(id, dark = true) {
  return registry[normalizeThemeId(id, dark)];
}

// Guard against upstream export changes silently shrinking the catalog.
if (themeList.length < 55) {
  // eslint-disable-next-line no-console
  console.warn(
    `MASM editor theme catalog is unexpectedly small (${themeList.length}); check @uiw/codemirror-themes-all / thememirror exports.`
  );
}
