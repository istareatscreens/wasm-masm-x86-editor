// Every image of the UI, preloaded at start so the page appears with all of them at once:
// the icons webpack bundles (require.context lists src/images) and the stylesheet's own
// (the scrollbars' and the dropdown's arrows, next to style.css). The Image objects are
// kept, so a browser that revalidates on every use still has the decoded picture.
const bundled = require.context("../../../../images", false, /\.(png|svg)$/);
const STYLESHEET_IMAGES = ["button-up.svg", "button-down.svg", "button-down-active.svg", "button-left.svg", "button-right.svg", "scrollbar-background.svg"];
const kept = [];

const load = (url) =>
  new Promise((resolve) => {
    const image = new Image();
    kept.push(image);
    image.onload = () => (image.decode ? image.decode().catch(() => {}) : Promise.resolve()).then(resolve, resolve);
    image.onerror = resolve;
    image.src = url;
  });

export const preloadImages = () => {
  const urls = bundled.keys().map((key) => {
    const asset = bundled(key);
    return typeof asset === "string" ? asset : asset.default;
  });
  return Promise.all(urls.concat(STYLESHEET_IMAGES).map(load));
};
