import React, { useEffect, useRef, useState } from "react";
import { drawPixelArt, sideOf, watchPixelRatio } from "./pixelArt.js";

// Pixel art (`pixels` x `pixels`) shown about `rem` wide, every art pixel a whole number of device pixels at any
// screen scale and zoom (pixelArt.js).
function PixelIcon({ src, pixels, rem, className = "", alt = "" }) {
  const [side, setSide] = useState(() => sideOf(rem, pixels));
  const canvas = useRef(null);

  useEffect(() => drawPixelArt(canvas.current, src, pixels), [src, pixels]);
  useEffect(() => watchPixelRatio(() => setSide(sideOf(rem, pixels))), [rem, pixels]);

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
