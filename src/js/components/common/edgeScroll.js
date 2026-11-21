// A drag held near the edge of a scrolling area keeps going: each frame it moves a step toward that edge, and the
// area scrolls after it (SplitHandle's `scrolls`). The edges are the area's less its CSS scroll padding.
export const EDGE_PX = 24;
export const MAX_STEP_PX = 8;

// The step for a pointer at `at` in an area from `start` to `end` (client pixels), `moved` pixels from where the drag
// began: toward the start (negative) or the end (positive) within EDGE_PX of it, faster the deeper, MAX_STEP_PX at
// the edge and past it; 0 elsewhere, and 0 toward an edge the pointer is not moving to (a handle pressed near the
// top and dragged down does not shrink).
export function edgeStep(at, start, end, moved, edge = EDGE_PX, max = MAX_STEP_PX) {
  const intoEnd = at - (end - edge);
  const intoStart = start + edge - at;
  if (intoEnd > 0 && intoEnd >= intoStart) return moved > 0 ? Math.ceil(max * Math.min(1, intoEnd / edge)) : 0;
  if (intoStart > 0) return moved < 0 ? -Math.ceil(max * Math.min(1, intoStart / edge)) : 0;
  return 0;
}

// The drag's virtual travel after one step, as a share of `size` pixels: `start + (moved + travel) / size`. It stops
// where the share reaches `min` or `max`, so a drag turned back resizes at once; the pointer's own travel past a limit
// is left alone, as in a drag with no scrolling.
export function addTravel({ start, moved, travel, step, size, min, max }) {
  if (step > 0) return Math.max(travel, Math.min(travel + step, (max - start) * size - moved));
  if (step < 0) return Math.min(travel, Math.max(travel + step, (min - start) * size - moved));
  return travel;
}

// The nearest ancestor that scrolls along the drag's axis, or null.
export function scrollParentOf(element, vertical) {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node)[vertical ? "overflowX" : "overflowY"];
    if (overflow === "auto" || overflow === "scroll") return node;
  }
  return null;
}

// The part of `area` that shows content in full, along the drag's axis: its box less its scroll padding, in client
// pixels.
export function viewOf(area, vertical) {
  const box = area.getBoundingClientRect();
  const style = getComputedStyle(area);
  const pad = (side) => parseFloat(style["scrollPadding" + side]) || 0;
  return vertical ? [box.left + pad("Left"), box.right - pad("Right")] : [box.top + pad("Top"), box.bottom - pad("Bottom")];
}

// Scrolls `area` so `element`'s middle is at `at` (client pixels), or as near as the area can scroll.
export function scrollTo(element, area, at, vertical) {
  const box = element.getBoundingClientRect();
  const middle = vertical ? box.left + box.width / 2 : box.top + box.height / 2;
  if (vertical) area.scrollLeft += middle - at;
  else area.scrollTop += middle - at;
}

// Scrolls `area` just enough to show `element` within its scroll padding.
export function keepInView(element, area, vertical) {
  const box = element.getBoundingClientRect();
  const [from, to] = viewOf(area, vertical);
  const [low, high] = vertical ? [box.left, box.right] : [box.top, box.bottom];
  const by = high > to ? high - to : low < from ? low - from : 0;
  if (vertical) area.scrollLeft += by;
  else area.scrollTop += by;
}
