import { useEffect } from "react";

import { useStore } from "../session/debugStore";

// Keys typed ahead for the program must never land in the source or press a button: at a stop, focus in the
// terminal moves to the status line (`status`, a ref), which ignores keys. Anywhere else it stays.
export default function useDebugFocus(controller, status) {
  const stop = useStore(controller.store, (view) => (view.stop ? view.stop.number : 0));
  useEffect(() => {
    if (!stop || !status.current) return;
    const focused = document.activeElement;
    if (focused && focused.id === "boxedwine") status.current.focus({ preventScroll: true });
  }, [stop, status]);
}
