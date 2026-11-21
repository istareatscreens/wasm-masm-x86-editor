import { useEffect, useLayoutEffect, useRef } from "react";

// Each top bar wraps onto further rows when one row cannot hold its controls; the counts go on .app-layout
// (unset for one row). A bar's width comes from the splitters' columns, so the rows cannot change what wraps.
// Collapsed, the main bar counts as one row and the controls on its further rows are inert.
const BARS = [
  { selector: ".banner__main__group--start", property: "--banner-rows", attribute: "data-banner-rows", button: ".banner__collapse" },
  { selector: ".banner__file-drawer__buttons", property: "--drawer-banner-rows", attribute: "data-drawer-banner-rows" },
];
const OVERFLOW = "data-banner-overflow";
// Layout rounds widths (1/64 px in Chrome, 1/60 px in Firefox): a bar within a pixel of fitting counts as
// overflowing, so the button never hides while the controls would wrap without it.
const ROUNDING_PX = 1;

// A bar's drawn controls with their boxes and vertical centres (align-items: center, so a line's centres match).
const controlsOf = (bar) => {
  if (!bar.getBoundingClientRect().width) return [];
  const controls = [];
  for (const child of bar.children) {
    const rect = child.getBoundingClientRect();
    if (rect.width && rect.height) controls.push({ child, rect, centre: rect.top + rect.height / 2 });
  }
  return controls;
};

const rowsOf = (controls) => {
  const centres = controls.map((control) => control.centre).sort((a, b) => a - b);
  let count = centres.length ? 1 : 0;
  for (let i = 1; i < centres.length; i++) if (centres[i] - centres[i - 1] > 8) count++;
  return count;
};

const px = (value) => parseFloat(value) || 0;
const outerWidth = (element, rect = element.getBoundingClientRect()) => {
  const style = getComputedStyle(element);
  return rect.width + px(style.marginLeft) + px(style.marginRight);
};

// Whether the controls fit on one row without the collapse button: the button's share (read from positions; it
// is its group's first control) is added back while it shows, so its own width never decides whether it shows.
const fitsOneRow = (bar, controls, button) => {
  const style = getComputedStyle(bar);
  const needed = controls.reduce((sum, control) => sum + outerWidth(control.child, control.rect), px(style.columnGap) * Math.max(0, controls.length - 1));
  const inner = bar.getBoundingClientRect().width - px(style.paddingLeft) - px(style.paddingRight) - px(style.borderLeftWidth) - px(style.borderRightWidth);
  const rect = button ? button.getBoundingClientRect() : null;
  const shown = rect && rect.width ? rect.right - button.parentElement.getBoundingClientRect().left : 0;
  return needed + ROUNDING_PX <= inner + shown;
};

export default function useBannerRows(rootRef, collapsed) {
  const collapsedRef = useRef(collapsed);
  const measureRef = useRef(null);

  // the setting is applied before the page paints: a collapsing bar never shows a frame of clipped rows in a
  // grid row still as tall as all of them
  useLayoutEffect(() => {
    collapsedRef.current = collapsed;
    if (measureRef.current) measureRef.current();
  }, [collapsed]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const bars = BARS.map((bar) => ({ ...bar, element: root.querySelector(bar.selector) })).filter((bar) => bar.element);
    // the controls this hook made inert: those a collapsed bar hides on its further rows
    const hidden = new Set();
    const hideLaterRows = (controls, clipped) => {
      const first = Math.min(...controls.map((control) => control.centre));
      const later = new Set(clipped ? controls.filter((control) => control.centre - first > 8).map((control) => control.child) : []);
      for (const child of hidden)
        if (!later.has(child)) {
          child.removeAttribute("inert");
          child.removeAttribute("aria-hidden");
          hidden.delete(child);
        }
      for (const child of later)
        if (!hidden.has(child)) {
          child.setAttribute("inert", "");
          child.setAttribute("aria-hidden", "true");
          hidden.add(child);
        }
    };
    let frame = 0;
    const measureBar = (bar, again = false) => {
      const controls = controlsOf(bar.element);
      let clipped = false;
      if (bar.button) {
        const overflow = controls.length > 0 && !fitsOneRow(bar.element, controls, root.querySelector(bar.button));
        if (overflow !== root.hasAttribute(OVERFLOW) && !again) {
          // the button shows or goes, so the bar's width and its rows change: measured again as they are now
          root.toggleAttribute(OVERFLOW, overflow);
          return measureBar(bar, true);
        }
        clipped = root.hasAttribute(OVERFLOW) && collapsedRef.current;
        hideLaterRows(controls, clipped);
      }
      const count = rowsOf(controls);
      if (count > 1 && !clipped) {
        root.setAttribute(bar.attribute, String(count));
        root.style.setProperty(bar.property, String(count));
      } else {
        root.removeAttribute(bar.attribute);
        root.style.removeProperty(bar.property);
      }
    };
    const measure = () => {
      frame = 0;
      bars.forEach((bar) => measureBar(bar));
    };
    measureRef.current = measure;
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
      measureRef.current = null;
      if (frame) cancelAnimationFrame(frame);
      if (resized) resized.disconnect();
      if (changed) changed.disconnect();
      window.removeEventListener("resize", schedule);
      hideLaterRows([], false);
    };
  }, [rootRef]);
}
