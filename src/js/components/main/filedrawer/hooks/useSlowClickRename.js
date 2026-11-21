import { useCallback, useEffect, useRef } from "react";

// Explorer's slow double click: a plain click on the selected row's name renames it after the double-click time
// (Windows' default: a page cannot read the system's), unless a double click, another press or a key comes first.
// A touch never starts it (its long press opens the menu).
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
