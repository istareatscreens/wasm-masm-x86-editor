// iced-x86 (Boxedwine/decoder-src/build-iced.sh), loaded on the first illegal-instruction crash:
// a classic script beside the page that declares the global `wasm_bindgen`, and its wasm.
declare const wasm_bindgen: any;

const VERSION = "1.21.0";
let loading: Promise<any> | null = null;

const scriptLoaded = () => typeof wasm_bindgen === "function";

export function loadX86Decoder(): Promise<any> {
  if (!loading) {
    loading = new Promise<void>((resolve, reject) => {
      if (scriptLoaded()) return resolve();
      const script = document.createElement("script");
      script.src = "iced_x86.js?v=" + VERSION;
      script.onload = () => (scriptLoaded() ? resolve() : reject(new Error("iced_x86.js did not define wasm_bindgen")));
      script.onerror = () => reject(new Error("iced_x86.js did not load"));
      document.head.appendChild(script);
    })
      .then(() => wasm_bindgen("iced_x86_bg.wasm?v=" + VERSION))
      .then(() => wasm_bindgen)
      .catch((e) => {
        loading = null;
        throw e;
      });
  }
  return loading;
}
