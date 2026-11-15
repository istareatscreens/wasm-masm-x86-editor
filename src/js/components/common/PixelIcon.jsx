import React, { useEffect, useRef, useState } from "react";

// Pixel art (`pixels` x `pixels`) shown about `rem` wide, as a whole number of device pixels per art pixel, so each
// pixel stays a square of one colour at every screen scale and zoom. An <img> with `image-rendering: pixelated` blends
// at a scale that is not whole (CSS Images 3), and its device size follows layout's rounding (Chrome's 1/64 px units
// made 51.2 px 51.1875). So the art is drawn on a canvas whose bitmap is the canvas's own size in device pixels
// (ResizeObserver's devicePixelContentBoxSize), scaled up a whole number of times with smoothing off; `pixelated`
// keeps Chrome from smoothing even that one-to-one bitmap (it blended every other row).
const sideOf = (rem, pixels) => {
  const ratio = window.devicePixelRatio || 1;
  const target = rem * parseFloat(getComputedStyle(document.documentElement).fontSize) * ratio;
  return (Math.max(1, Math.round(target / pixels)) * pixels) / ratio;
};

function PixelIcon({ src, pixels, rem, className = "", alt = "" }) {
  const [side, setSide] = useState(() => sideOf(rem, pixels));
  const canvas = useRef(null);

  useEffect(() => {
    const el = canvas.current;
    const art = new Image();
    let size = null;
    const draw = () => {
      if (!size || !art.complete || !art.naturalWidth) return;
      el.width = size.width;
      el.height = size.height;
      const g = el.getContext("2d");
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
      observer.observe(el, { box: "device-pixel-content-box" });
    } catch (error) {
      observer.observe(el); // no device-pixel-content-box: the content box times the device pixel ratio
    }
    art.onload = draw;
    art.src = src;
    return () => {
      art.onload = null;
      observer.disconnect();
    };
  }, [src, pixels]);

  useEffect(() => {
    // the device pixel ratio changes with zoom and with the screen: watched through its resolution query
    let query = null;
    const update = () => {
      setSide(sideOf(rem, pixels));
      if (query) query.removeEventListener("change", update);
      query = window.matchMedia("(resolution: " + (window.devicePixelRatio || 1) + "dppx)");
      query.addEventListener("change", update);
    };
    update();
    return () => query.removeEventListener("change", update);
  }, [rem, pixels]);

  return (
    <canvas
      ref={canvas}
      className={className}
      role="img"
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      style={{ width: side, height: side, imageRendering: "pixelated" }}
    />
  );
}

export default PixelIcon;
