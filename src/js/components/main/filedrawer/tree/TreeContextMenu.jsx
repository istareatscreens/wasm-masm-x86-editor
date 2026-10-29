import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Win98 context menu. items: [{ label, onSelect, disabled }] or { separator: true }.
// Up/Down/Home/End move, Enter selects, Escape or a press outside closes.
function TreeContextMenu({ x, y, items, onClose }) {
  const menu = useRef(null);
  const enabled = items.map((item, i) => (!item.separator && !item.disabled ? i : -1)).filter((i) => i >= 0);
  const [active, setActive] = useState(enabled.length ? enabled[0] : -1);
  const [position, setPosition] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const box = menu.current.getBoundingClientRect();
    setPosition({
      left: Math.max(0, Math.min(x, window.innerWidth - box.width - 2)),
      top: Math.max(0, Math.min(y, window.innerHeight - box.height - 2)),
    });
    menu.current.focus();
  }, [x, y]);

  useEffect(() => {
    const outside = (event) => {
      if (menu.current && !menu.current.contains(event.target)) onClose();
    };
    window.addEventListener("pointerdown", outside, true);
    window.addEventListener("blur", onClose);
    return () => {
      window.removeEventListener("pointerdown", outside, true);
      window.removeEventListener("blur", onClose);
    };
  }, [onClose]);

  const choose = (i) => {
    const item = items[i];
    if (!item || item.separator || item.disabled) return;
    onClose();
    item.onSelect();
  };

  const onKeyDown = (event) => {
    const at = enabled.indexOf(active);
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (step && enabled.length) setActive(enabled[(at + step + enabled.length) % enabled.length]);
    else if (event.key === "Home" && enabled.length) setActive(enabled[0]);
    else if (event.key === "End" && enabled.length) setActive(enabled[enabled.length - 1]);
    else if (event.key === "Enter" || event.key === " ") choose(active);
    else if (event.key === "Escape" || event.key === "Tab") onClose();
    else return;
    event.preventDefault();
    event.stopPropagation();
  };

  return createPortal(
    <ul
      ref={menu}
      role="menu"
      tabIndex={-1}
      className="tree-menu"
      style={position}
      onKeyDown={onKeyDown}
      onContextMenu={(event) => event.preventDefault()}
    >
      {items.map((item, i) =>
        item.separator ? (
          <li key={i} role="separator" className="tree-menu__separator" />
        ) : (
          <li
            key={i}
            role="menuitem"
            aria-disabled={!!item.disabled}
            className={"tree-menu__item" + (i === active ? " tree-menu__item--active" : "") + (item.disabled ? " tree-menu__item--disabled" : "")}
            onPointerEnter={() => !item.disabled && setActive(i)}
            onClick={() => choose(i)}
          >
            {item.label}
          </li>
        ),
      )}
    </ul>,
    document.body,
  );
}

export default TreeContextMenu;
