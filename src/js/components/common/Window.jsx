import React, { useLayoutEffect, useRef, useState } from "react";
import Draggable from "react-draggable";

const Window = ({
  closeWindow,
  windowClass,
  titlebarClass,
  titlebarText,
  keepInViewport = false,
  children,
}) => {
  const windowRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const positionRef = useRef(position);
  positionRef.current = position;
  const [bounds, setBounds] = useState(undefined);

  useLayoutEffect(() => {
    if (!keepInViewport) return;
    const element = windowRef.current;
    const fit = () => {
      const rect = element.getBoundingClientRect();
      const current = positionRef.current;
      const next = {
        left: current.x + 8 - rect.left,
        right: current.x + window.innerWidth - 8 - rect.right,
        top: current.y + 8 - rect.top,
        bottom: current.y + window.innerHeight - 8 - rect.bottom,
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
  }, [keepInViewport]);

  return (
    <Draggable
      cancel={".no-drag"}
      positionOffset={{ x: "-50%", y: "-50%" }}
      nodeRef={windowRef}
      {...(keepInViewport ? {
        position,
        bounds,
        onDrag: (_, data) => setPosition({ x: data.x, y: data.y }),
      } : {})}
    >
      <div ref={windowRef} className={`window ${windowClass} no-cursor`}>
        <div className={`title-bar ${titlebarClass} cursor `}>
          <div className="title-bar-text">{titlebarText}</div>
          <div className="title-bar-controls no-drag">
            <button
              onClick={closeWindow}
              className={"title-bar__btn btn"}
              aria-label="Close"
            ></button>
          </div>
        </div>
        <div className="window-body no-drag">{children}</div>
      </div>
    </Draggable>
  );
};

export default Window;
