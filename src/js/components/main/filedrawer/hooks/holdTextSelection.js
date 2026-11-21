// While a drawer press is held the page starts no text selection: a drag that leaves the drawer would otherwise
// select the toolbar's, the banner's and the editor's text. Text boxes (the rename box) keep their own selection.
let holds = 0;

const inTextBox = (target) => {
  const element = target && target.nodeType === 1 ? target : target && target.parentElement;
  return !!(element && element.closest("input, textarea"));
};

const blockSelection = (event) => {
  if (!inTextBox(event.target)) event.preventDefault();
};

// Returns the release; releasing twice does nothing.
export default function holdTextSelection() {
  if (holds++ === 0) {
    document.addEventListener("selectstart", blockSelection, true);
    document.documentElement.classList.add("no-text-selection");
  }
  let held = true;
  return () => {
    if (!held) return;
    held = false;
    if (--holds === 0) {
      document.removeEventListener("selectstart", blockSelection, true);
      document.documentElement.classList.remove("no-text-selection");
    }
  };
}
