import { attachRetroScrollbars } from "./retroScrollbars.js";

// Windows 98 scrollbars for a component that takes an `attachScrollbars(surface, host)` prop (the hex viewer).
// Make one per component and keep it: a new function re-attaches the bars.
export function retroScrollbarHost(label, options = {}) {
  return (surface, host) => {
    host.classList.add("retro-scroll-host");
    const attached = attachRetroScrollbars(surface, host, label, options);
    return {
      update: () => attached.update(),
      destroy() {
        attached.destroy();
        host.classList.remove("retro-scroll-host", "retro-scroll-host--vertical", "retro-scroll-host--horizontal");
      },
    };
  };
}
