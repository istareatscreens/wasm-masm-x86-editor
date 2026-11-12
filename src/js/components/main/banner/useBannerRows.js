import { useEffect } from "react";

// Each top bar wraps its controls onto further rows when one row cannot hold them, and is as many rows
// tall as it needs whatever the other bar needs: the main bar's count (--banner-rows and
// data-banner-rows on .app-layout) is the grid's first row (layout/_layout.scss), the drawer toolbar's
// (--drawer-banner-rows and data-drawer-banner-rows) its height at the top of the drawer's column.
// Neither is set for one row. A bar's width comes from the splitters' columns, not from the rows, so the
// rows cannot change what wraps (no oscillation). The drawer's select-all box is not counted: it goes to
// the toolbar's last row.
const BARS = [
  { selector: ".banner__main__group--start", property: "--banner-rows", attribute: "data-banner-rows" },
  { selector: ".banner__file-drawer__buttons", property: "--drawer-banner-rows", attribute: "data-drawer-banner-rows" },
];

// A bar's rows: its controls' vertical centres, one per line (align-items: center puts
// every centre of a line on the same height; lines are a row apart).
const rows = (bar) => {
  if (!bar.getBoundingClientRect().width) return 0; // a bar the layout does not draw
  const centres = [];
  for (const child of bar.children) {
    const rect = child.getBoundingClientRect();
    if (rect.width && rect.height) centres.push(rect.top + rect.height / 2);
  }
  centres.sort((a, b) => a - b);
  let count = centres.length ? 1 : 0;
  for (let i = 1; i < centres.length; i++) if (centres[i] - centres[i - 1] > 8) count++;
  return count;
};

export default function useBannerRows(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const bars = BARS.map((bar) => ({ ...bar, element: root.querySelector(bar.selector) })).filter((bar) => bar.element);
    let frame = 0;
    const measure = () => {
      frame = 0;
      for (const { element, property, attribute } of bars) {
        const count = rows(element);
        if (count > 1) {
          root.setAttribute(attribute, String(count));
          root.style.setProperty(property, String(count));
        } else {
          root.removeAttribute(attribute);
          root.style.removeProperty(property);
        }
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    // the bars' own boxes are fixed by the grid: watch their controls (size, and
    // controls appearing or going) and the window
    const resized = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    const watchControls = () => {
      if (resized) for (const { element } of bars) for (const child of element.children) resized.observe(child);
    };
    const changed = typeof MutationObserver === "undefined" ? null : new MutationObserver(() => {
      watchControls();
      schedule();
    });
    for (const { element } of bars) {
      if (resized) resized.observe(element);
      if (changed) changed.observe(element, { childList: true });
    }
    watchControls();
    window.addEventListener("resize", schedule);
    measure();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (resized) resized.disconnect();
      if (changed) changed.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [rootRef]);
}
