// CodeMirror 6 theme catalog + registry for the editor.
//
// CodeMirror 6 no longer ships CSS themes; themes are JS Extensions. We combine
// @uiw/codemirror-themes-all (~46 themes), thememirror (16 themes) and
// @codemirror/theme-one-dark to offer a wide catalog (~60), comparable to the
// 64 CM5 CSS themes the app used to bundle.
//
// Only real theme Extensions are included: @uiw exports also contain `*Init`
// (factory functions), `*Style` (HighlightStyle objects) and `defaultSettings*`
// (settings objects) — all filtered out because a theme Extension is an Array.
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

// @uiw themes: the theme Extensions are Array-valued, but so are the `*Style`
// HighlightStyle-extension exports — so filter those (and `*Init` factories and
// `defaultSettings*` objects) out by name, keeping only the plain theme names.
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

// Map legacy CodeMirror 5 theme names (still in some users' localStorage) to the
// closest CM6 id, so returning users keep a sensible theme instead of crashing.
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

// Normalize a stored theme id (which may be a CM6 id or a legacy CM5 name) to a
// valid registry id, falling back to a default.
export function normalizeThemeId(id, dark = true) {
  if (id && registry[id]) return id;
  if (id && CM5_ALIASES[id] && registry[CM5_ALIASES[id]]) return CM5_ALIASES[id];
  return dark ? DEFAULT_THEME_ID : DEFAULT_LIGHT_THEME_ID;
}

// Resolve a theme id to its Extension (with fallback). Used by TextEditor.
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
