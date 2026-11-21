// Pixel art with a whole number of device pixels per art pixel. An <img> with `image-rendering: pixelated` blends at
// non-whole scales and its device size follows layout rounding, so the art goes on a canvas sized in device pixels
// (devicePixelContentBoxSize); `pixelated` still keeps Chrome from smoothing that one-to-one bitmap.

// the side, in CSS pixels, nearest `rem` that gives every art pixel a whole number of device pixels
export const sideOf = (rem, pixels) => {
  const ratio = window.devicePixelRatio || 1;
  const target = rem * parseFloat(getComputedStyle(document.documentElement).fontSize) * ratio;
  return (Math.max(1, Math.round(target / pixels)) * pixels) / ratio;
};

// Draws `src` on `canvas`, and again whenever the canvas's size in device pixels changes. Returns what stops it.
export function drawPixelArt(canvas, src, pixels) {
  const art = new Image();
  let size = null;
  const draw = () => {
    if (!size || !art.complete || !art.naturalWidth) return;
    canvas.width = size.width;
    canvas.height = size.height;
    const g = canvas.getContext("2d");
    g.imageSmoothingEnabled = false;
    const k = Math.max(1, Math.floor(Math.min(size.width, size.height) / pixels)), drawn = k * pixels;
    g.drawImage(art, Math.floor((size.width - drawn) / 2), Math.floor((size.height - drawn) / 2), drawn, drawn);
  };
  const observer = new ResizeObserver(([entry]) => {
    const box = entry.devicePixelContentBoxSize && entry.devicePixelContentBoxSize[0];
    const ratio = window.devicePixelRatio || 1;
    size = box
      ? { width: box.inlineSize, height: box.blockSize }
      : { width: Math.round(entry.contentRect.width * ratio), height: Math.round(entry.contentRect.height * ratio) };
    draw();
  });
  try {
    observer.observe(canvas, { box: "device-pixel-content-box" });
  } catch (error) {
    observer.observe(canvas); // no device-pixel-content-box: the content box times the device pixel ratio
  }
  art.onload = draw;
  art.src = src;
  return () => {
    art.onload = null;
    observer.disconnect();
  };
}

// Calls `changed` now and whenever the device pixel ratio changes (zoom, another screen): watched through its
// resolution query. Returns what stops it.
export function watchPixelRatio(changed) {
  let query = null;
  const update = () => {
    changed();
    if (query) query.removeEventListener("change", update);
    query = window.matchMedia("(resolution: " + (window.devicePixelRatio || 1) + "dppx)");
    query.addEventListener("change", update);
  };
  update();
  return () => query.removeEventListener("change", update);
}

// A canvas showing pixel art outside React (a CodeMirror gutter marker): sized, drawn and kept so until the
// returned function is called.
export function pixelArtCanvas(src, pixels, rem, className = "") {
  const canvas = document.createElement("canvas");
  canvas.className = className;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.imageRendering = "pixelated";
  const stopSizing = watchPixelRatio(() => {
    const side = sideOf(rem, pixels) + "px";
    canvas.style.width = side;
    canvas.style.height = side;
  });
  const stopDrawing = drawPixelArt(canvas, src, pixels);
  return {
    canvas,
    destroy: () => {
      stopSizing();
      stopDrawing();
    },
  };
}
