import React, { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Draggable from "react-draggable";
import RetroScrollArea from "./RetroScrollArea.jsx";

const MARGIN = 8;

// Every window of the app: a Windows 98 title bar with the close button, the body and, when given, a
// row of buttons that never scrolls. It is rendered into <body>, sized by `size` (fit: as wide as its
// content, medium) or by the `width` it asks for (a CSS length), never wider than the page, and kept
// inside the visible page while it is dragged, while the page changes size and while its content grows.
// A body with `scrollLabel` is a text region whose vertical bar is always shown (the About window's);
// any other body only gets a bar when it does not fit.
const Window = ({ title, onClose, size = "medium", width, className = "", scrollLabel, footer = null, children }) => {
  const windowRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const positionRef = useRef(position);
  positionRef.current = position;
  const [bounds, setBounds] = useState(undefined);

  useLayoutEffect(() => {
    const element = windowRef.current;
    const fit = () => {
      const rect = element.getBoundingClientRect();
      const current = positionRef.current;
      const next = {
        left: current.x + MARGIN - rect.left,
        right: current.x + window.innerWidth - MARGIN - rect.right,
        top: current.y + MARGIN - rect.top,
        bottom: current.y + window.innerHeight - MARGIN - rect.bottom,
      };
      setBounds(next);
      const x = Math.max(next.left, Math.min(next.right, current.x));
      const y = Math.max(next.top, Math.min(next.bottom, current.y));
      if (x !== current.x || y !== current.y) setPosition({ x, y });
    };
    fit();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(fit);
    observer?.observe(element);
    window.addEventListener("resize", fit);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);

  return createPortal(
    <Draggable
      cancel={".no-drag"}
      positionOffset={{ x: "-50%", y: "-50%" }}
      nodeRef={windowRef}
      position={position}
      bounds={bounds}
      onDrag={(_, data) => setPosition({ x: data.x, y: data.y })}
    >
      <div
        ref={windowRef}
        className={`window window--${size} ${className} no-cursor`}
        style={width ? { "--window-width": width } : undefined}
        role="dialog"
        aria-label={title}
      >
        <div className="title-bar cursor">
          <div className="title-bar-text">{title}</div>
          <div className="title-bar-controls no-drag">
            <button
              type="button"
              onClick={onClose}
              className={"title-bar__btn btn"}
              aria-label="Close"
            ></button>
          </div>
        </div>
        <div className="window-body no-drag">
          <RetroScrollArea
            className="window__scroll"
            label={scrollLabel || title}
            region={!!scrollLabel}
            vertical={scrollLabel ? "always" : "auto"}
          >
            {children}
          </RetroScrollArea>
          {footer && <div className="window__footer">{footer}</div>}
        </div>
      </div>
    </Draggable>,
    document.body
  );
};

export default Window;
