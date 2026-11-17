import { useCallback, useEffect, useRef } from "react";

// Explorer's slow double click: a click on the name of the row that is already selected renames it once a double
// click can no longer follow. Windows' tree and list views (TVS_EDITLABELS, LVS_EDITLABELS) start the edit the
// system's double-click time after such a click, and a double click cancels it; a page cannot read that time, so
// Windows' default is used. As in the list view, the press is a plain one (no Ctrl, Shift, Alt or Meta), the click
// ends on the same name, and when the time is up the tree still has the focus and the row is still the one selected;
// any other press in the list, or a key, cancels the wait. A touch never starts it (its long press opens the menu).
//   canArm(row): is the row selected, may it be renamed, and is no rename or menu open (the press only ends those);
//   canStart(path): is it still the selected and focused row, shown, with no menu, drag or rename under way;
//   start(path): rename it.
export const DOUBLE_CLICK_MS = 500;
const NAME = ".file-tree__label";

export default function useSlowClickRename({ list, canArm, canStart, start }) {
  const handlers = useRef({});
  handlers.current = { canArm, canStart, start };
  const armed = useRef(null); // the row whose name a press is on, until its click
  const timer = useRef(0);

  const cancel = useCallback(() => {
    armed.current = null;
    clearTimeout(timer.current);
    timer.current = 0;
  }, []);

  // any press in the list ends a wait (the press on a selected name arms the next one, after this)
  useEffect(() => {
    if (!list) return undefined;
    list.addEventListener("pointerdown", cancel, true);
    return () => {
      list.removeEventListener("pointerdown", cancel, true);
      cancel();
    };
  }, [list, cancel]);

  const pointerDown = useCallback((event, row) => {
    const plain = event.button === 0 && !event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey;
    armed.current = plain && event.pointerType !== "touch" && event.target.closest(NAME) && handlers.current.canArm(row) ? row.path : null;
  }, []);

  // a single click that ends the armed press on the same name starts the wait
  const click = useCallback(
    (event, row) => {
      const path = armed.current;
      armed.current = null;
      if (path !== row.path || event.detail !== 1 || !event.target.closest(NAME)) return;
      timer.current = setTimeout(() => {
        timer.current = 0;
        const { canStart, start } = handlers.current;
        if (list && list.contains(document.activeElement) && canStart(path)) start(path);
      }, DOUBLE_CLICK_MS);
    },
    [list],
  );

  return { pointerDown, click, cancel };
}
