import { useLayoutEffect, useState } from "react";
import { fitRowLength } from "./columns.js";

// The bytes a row shows: the `requested` number, or with "auto" the most of 16, 8 and 4 that fit the list's
// width. Two hidden rows, of 8 and of 16 bytes, are measured in the viewer's own font (`templates`), and again
// whenever they or the list change size (a font that loads late, a narrower pane).
export function useRowLength(requested, listElement, templates) {
  const [fitted, setFitted] = useState(16);
  const auto = requested === "auto";

  useLayoutEffect(() => {
    if (!auto || !listElement) return undefined;
    const eight = templates.eight.current;
    const sixteen = templates.sixteen.current;
    if (!eight || !sixteen) return undefined;
    const update = () => setFitted(fitRowLength(listElement.clientWidth, eight.getBoundingClientRect().width, sixteen.getBoundingClientRect().width));
    update();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(update);
    [listElement, eight, sixteen].forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [auto, listElement, templates]);

  return auto ? fitted : requested;
}
