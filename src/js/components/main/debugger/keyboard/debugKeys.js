// Keys as in Visual C++ 6 and Visual Studio. A chord matches `key`, or `code` where it must be the same physical key
// on every layout (Alt+[), with exactly its modifiers. A command's first chord is the one its tooltip names.
export const COMMANDS = {
  go: [{ key: "F5" }],
  stop: [{ key: "F5", shift: true }],
  restart: [{ key: "F5", ctrl: true, shift: true }],
  runWithoutDebugging: [{ key: "F5", ctrl: true }],
  toggleBreakpoint: [{ key: "F9" }],
  enableBreakpoint: [{ key: "F9", ctrl: true }],
  quickWatch: [{ key: "F9", shift: true }],
  next: [{ key: "F10" }],
  // F8, WinDbg's, where F11 belongs to the window: a browser in full screen keeps it to leave full screen
  stepIn: [{ key: "F11" }, { key: "F8" }],
  stepOut: [{ key: "F11", shift: true }],
  stepBack: [{ code: "BracketLeft", alt: true, label: "[" }],
  runToCursor: [{ key: "F10", ctrl: true }],
  setNext: [{ key: "F10", ctrl: true, shift: true }],
  pause: [{ code: "Pause", ctrl: true, alt: true, label: "Break" }],
  showNext: [{ code: "NumpadMultiply", alt: true, label: "Num *" }],
};

// held down, these repeat; the others act once a press
const REPEATS = { next: true, stepIn: true, stepOut: true, stepBack: true };

const fits = (chord, event) =>
  (chord.key ? event.key === chord.key : event.code === chord.code) && !!chord.ctrl === (event.ctrlKey || event.metaKey) && !!chord.shift === event.shiftKey && !!chord.alt === event.altKey;

export function commandOf(event) {
  for (const name of Object.keys(COMMANDS)) {
    if (COMMANDS[name].some((chord) => fits(chord, event))) return event.repeat && !REPEATS[name] ? null : name;
  }
  return null;
}

const chordLabel = (chord) => (chord.ctrl ? "Ctrl+" : "") + (chord.alt ? "Alt+" : "") + (chord.shift ? "Shift+" : "") + (chord.label || chord.key);

// "Ctrl+Shift+F5", "Alt+[": a command's first chord, for a tooltip
export const keyLabel = (name) => chordLabel(COMMANDS[name][0]);

export const keyLabels = (name) => COMMANDS[name].map(chordLabel);

export const KEY_LABELS = Object.keys(COMMANDS).reduce((labels, name) => ({ ...labels, [name]: keyLabel(name) }), {});
