import { useEffect } from "react";

// The top bars' controls wrap onto further rows when one row cannot hold them; then the
// shared first grid row is as many rows tall as the bar with the most: --banner-rows and
// data-banner-rows="N" on .app-layout (layout/_layout.scss), neither set for one row. A
// bar's width comes from vw columns, not from the row's height, so the rows cannot change
// what wraps (no oscillation). The drawer's select-all box is not counted: it goes to the
// last row of whatever the banner has.
const BARS = [".banner__main__group--start", ".banner__file-drawer__buttons"];

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
    const bars = BARS.map((selector) => root.querySelector(selector)).filter(Boolean);
    let frame = 0;
    const measure = () => {
      frame = 0;
      const count = Math.max(1, ...bars.map(rows));
      if (count > 1) {
        root.setAttribute("data-banner-rows", String(count));
        root.style.setProperty("--banner-rows", String(count));
      } else {
        root.removeAttribute("data-banner-rows");
        root.style.removeProperty("--banner-rows");
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    // the bars' own boxes are fixed by the grid: watch their controls (size, and
    // controls appearing or going) and the window
    const resized = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    const watchControls = () => {
      if (resized) for (const bar of bars) for (const child of bar.children) resized.observe(child);
    };
    const changed = typeof MutationObserver === "undefined" ? null : new MutationObserver(() => {
      watchControls();
      schedule();
    });
    for (const bar of bars) {
      if (resized) resized.observe(bar);
      if (changed) changed.observe(bar, { childList: true });
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
