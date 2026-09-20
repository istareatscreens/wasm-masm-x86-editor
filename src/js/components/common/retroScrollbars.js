let nextId = 0;
const clamp = (value, max) => Math.max(0, Math.min(max, value));

// Keep the native scroll element: CodeMirror uses it for selection and reveal.
//
// Windows 95 rule: the vertical scrollbar of a scrollable control is ALWAYS there.
// When the content fits it is drawn disabled (both arrows embossed, checkered track,
// no thumb) - it never disappears and it never leaves a bare gutter. The horizontal
// bar only exists while there is a horizontal range (a wrapped editor never has
// one), and the corner only while both bars are live.
export function attachRetroScrollbars(surface, host, label) {
  const win = surface.ownerDocument.defaultView;
  const doc = surface.ownerDocument;
  if (!win.ResizeObserver || !win.PointerEvent) return { update() {}, destroy() {} };

  const originalId = surface.id;
  if (!originalId) surface.id = `retro-scroll-surface-${++nextId}`;
  let frame = 0;
  let disposed = false;
  let stopInteraction = () => {};
  const listeners = [];
  const on = (node, name, fn, options) => {
    node.addEventListener(name, fn, options);
    listeners.push(() => node.removeEventListener(name, fn, options));
  };
  const make = (tag, className, parent) => {
    const el = doc.createElement(tag);
    el.className = className;
    parent.appendChild(el);
    return el;
  };
  const corner = make("div", "retro-scrollbar__corner", host);
  corner.hidden = true;
  corner.setAttribute("aria-hidden", "true");
  const axes = ["vertical", "horizontal"].map((orientation) => {
    const vertical = orientation === "vertical";
    const rail = make("div", `retro-scrollbar retro-scrollbar--${orientation}`, host);
    rail.hidden = true;
    rail.tabIndex = 0;
    rail.setAttribute("role", "scrollbar");
    rail.setAttribute("aria-label", `${label} ${orientation} scroll`);
    rail.setAttribute("aria-controls", surface.id);
    rail.setAttribute("aria-orientation", orientation);
    rail.setAttribute("aria-valuemin", "0");
    const before = make("button", "retro-scrollbar__arrow", rail);
    const track = make("div", "retro-scrollbar__track", rail);
    const thumb = make("div", "retro-scrollbar__thumb", track);
    const after = make("button", "retro-scrollbar__arrow", rail);
    for (const [button, direction] of [[before, vertical ? "up" : "left"], [after, vertical ? "down" : "right"]]) {
      button.type = "button";
      button.tabIndex = -1;
      button.dataset.direction = direction;
      button.setAttribute("aria-label", `Scroll ${direction}`);
    }
    return { vertical, rail, track, thumb, before, after, max: 0, travel: 0, size: 0, disabled: true };
  });
  // disabled (no range): keep the rail, drop the thumb, grey both arrows, no focus
  const setDisabled = (axis, disabled) => {
    axis.disabled = disabled;
    axis.rail.classList.toggle("retro-scrollbar--disabled", disabled);
    axis.rail.setAttribute("aria-disabled", disabled ? "true" : "false");
    axis.rail.tabIndex = disabled ? -1 : 0;
    axis.thumb.hidden = disabled;
    if (disabled) {
      axis.rail.setAttribute("aria-valuemax", "0");
      axis.rail.setAttribute("aria-valuenow", "0");
      axis.before.disabled = true;
      axis.after.disabled = true;
      if (axis.rail.contains(doc.activeElement)) axis.rail.blur();
    }
  };
  const position = (axis) => axis.vertical ? surface.scrollTop : surface.scrollLeft;
  const viewport = (axis) => axis.vertical ? surface.clientHeight : surface.clientWidth;
  const setPosition = (axis, value) => {
    if (axis.vertical) surface.scrollTop = clamp(value, axis.max);
    else surface.scrollLeft = clamp(value, axis.max);
    update();
  };
  function update() {
    if (!disposed && !frame) frame = win.requestAnimationFrame(measure);
  }
  const colors = win.matchMedia("(forced-colors: active)");
  function measure() {
    frame = 0;
    if (disposed) return;
    const enabled = !colors.matches;
    host.classList.toggle("retro-scroll-host--ready", enabled);
    surface.classList.toggle("retro-scroll-surface", enabled);
    if (!enabled) {
      stopInteraction();
      host.classList.remove("retro-scroll-host--horizontal");
      axes.forEach(({ rail }) => { rail.hidden = true; });
      corner.hidden = true;
      return;
    }
    const style = win.getComputedStyle(surface);
    const x = /^(auto|scroll)$/.test(style.overflowX) && surface.scrollWidth > surface.clientWidth + 1;
    host.classList.toggle("retro-scroll-host--horizontal", x);
    for (const axis of axes) {
      const total = axis.vertical ? surface.scrollHeight : surface.scrollWidth;
      const client = viewport(axis);
      axis.max = Math.max(0, total - client);
      const allowed = /^(auto|scroll)$/.test(axis.vertical ? style.overflowY : style.overflowX);
      const active = allowed && axis.max > 1 && client > 0;
      // vertical: always present (disabled when nothing scrolls); horizontal: only with a range
      axis.rail.hidden = axis.vertical ? false : !active;
      setDisabled(axis, !active);
      if (!active) continue;
      const length = axis.vertical ? axis.track.clientHeight : axis.track.clientWidth;
      axis.size = Math.min(length, Math.max(18, length * client / total));
      axis.travel = Math.max(0, length - axis.size);
      const offset = clamp(position(axis), axis.max);
      axis.thumb.style[axis.vertical ? "height" : "width"] = `${axis.size}px`;
      axis.thumb.style.transform = `translate${axis.vertical ? "Y" : "X"}(${axis.travel * offset / axis.max}px)`;
      axis.rail.setAttribute("aria-valuemax", String(Math.round(axis.max)));
      axis.rail.setAttribute("aria-valuenow", String(Math.round(offset)));
      axis.before.disabled = offset <= 0;
      axis.after.disabled = offset >= axis.max - 1;
    }
    corner.hidden = !x || axes[0].disabled;
  }

  for (const axis of axes) {
    const coordinate = (event) => axis.vertical ? event.clientY : event.clientX;
    const step = () => parseFloat(win.getComputedStyle(surface).lineHeight) || 20;
    const page = () => Math.max(step(), viewport(axis) - step());

    const start = (event, action, drag) => {
      if (event.button !== 0 || axis.rail.hidden || axis.disabled) return;
      stopInteraction();
      event.preventDefault();
      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);
      target.classList.add("is-pressed");
      let timer = 0;
      const move = (e) => { if (e.pointerId === event.pointerId && drag) drag(e); };
      const end = (e) => { if (!e || e.pointerId === event.pointerId) stopInteraction(); };
      const blur = () => stopInteraction();
      stopInteraction = () => {
        win.clearTimeout(timer);
        target.classList.remove("is-pressed");
        target.removeEventListener("pointermove", move);
        target.removeEventListener("lostpointercapture", end);
        win.removeEventListener("pointerup", end);
        win.removeEventListener("pointercancel", end);
        win.removeEventListener("blur", blur);
        if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
        stopInteraction = () => {};
      };
      target.addEventListener("pointermove", move);
      target.addEventListener("lostpointercapture", end);
      win.addEventListener("pointerup", end);
      win.addEventListener("pointercancel", end);
      win.addEventListener("blur", blur);
      if (action) {
        action();
        const repeat = () => { action(); timer = win.setTimeout(repeat, 60); };
        timer = win.setTimeout(repeat, 350);
      }
    };

    for (const [button, direction] of [[axis.before, -1], [axis.after, 1]]) {
      on(button, "pointerdown", (event) => start(event, () => setPosition(axis, position(axis) + direction * step())));
      on(button, "click", (event) => {
        if (event.detail === 0 && !axis.disabled) setPosition(axis, position(axis) + direction * step());
      });
    }
    on(axis.thumb, "pointerdown", (event) => {
      const origin = coordinate(event);
      const initial = position(axis);
      const ratio = axis.travel ? axis.max / axis.travel : 0;
      start(event, null, (e) => setPosition(axis, initial + (coordinate(e) - origin) * ratio));
    });
    on(axis.track, "pointerdown", (event) => {
      if (event.target !== axis.track) return;
      const point = coordinate(event);
      const bounds = axis.thumb.getBoundingClientRect();
      const direction = point < (axis.vertical ? bounds.top : bounds.left) ? -1 : 1;
      start(event, () => {
        const rect = axis.thumb.getBoundingClientRect();
        const before = point < (axis.vertical ? rect.top : rect.left);
        const after = point > (axis.vertical ? rect.bottom : rect.right);
        if ((direction < 0 && before) || (direction > 0 && after)) setPosition(axis, position(axis) + direction * page());
      });
    });
    on(axis.rail, "keydown", (event) => {
      if (axis.disabled) return;
      const values = {
        [axis.vertical ? "ArrowUp" : "ArrowLeft"]: position(axis) - step(),
        [axis.vertical ? "ArrowDown" : "ArrowRight"]: position(axis) + step(),
        PageUp: position(axis) - page(), PageDown: position(axis) + page(),
        Home: 0, End: axis.max,
      };
      if (Object.prototype.hasOwnProperty.call(values, event.key)) {
        event.preventDefault();
        event.stopPropagation();
        setPosition(axis, values[event.key]);
      }
    });
    // A wheel over a rail must scroll the same surface as a wheel over content.
    on(axis.rail, "wheel", (event) => {
      if (event.ctrlKey || axis.disabled) return;
      const unit = event.deltaMode === 1 ? step() : event.deltaMode === 2 ? viewport(axis) : 1;
      const delta = axis.vertical ? event.deltaY : event.deltaX || event.deltaY;
      if (delta && clamp(position(axis) + delta * unit, axis.max) !== position(axis)) {
        event.preventDefault();
        setPosition(axis, position(axis) + delta * unit);
      }
    }, { passive: false });
  }

  const resize = new win.ResizeObserver(update);
  resize.observe(surface);
  resize.observe(host);
  let observedContent = null;
  const observeContent = () => {
    if (observedContent !== surface.firstElementChild) {
      if (observedContent) resize.unobserve(observedContent);
      observedContent = surface.firstElementChild;
      if (observedContent) resize.observe(observedContent);
    }
    update();
  };
  const mutations = new win.MutationObserver(observeContent);
  mutations.observe(surface, { childList: true, subtree: true, characterData: true, attributes: true });
  on(surface, "scroll", update, { passive: true });
  on(win, "resize", update);
  on(colors, "change", update);
  if (doc.fonts) on(doc.fonts, "loadingdone", update);
  observeContent();

  return {
    update,
    destroy() {
      disposed = true;
      stopInteraction();
      win.cancelAnimationFrame(frame);
      resize.disconnect();
      mutations.disconnect();
      listeners.forEach((remove) => remove());
      axes.forEach(({ rail }) => rail.remove());
      corner.remove();
      host.classList.remove("retro-scroll-host--ready", "retro-scroll-host--horizontal");
      surface.classList.remove("retro-scroll-surface");
      if (!originalId) surface.removeAttribute("id");
    },
  };
}
