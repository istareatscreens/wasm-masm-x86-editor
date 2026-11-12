import React, { forwardRef, useState } from "react";

// A Windows 98 button with two arrowheads pointing one way (down, up, left or right), as thick as the
// bar it sits in (components/_arrow-button.scss). A press with a pointer leaves the keyboard focus where
// it was, in the editor or the terminal; `onPress` gets true when the keyboard pressed it.
const ArrowButton = forwardRef(function ArrowButton({ direction, label, onPress, className = "", style }, ref) {
  const [pressed, setPressed] = useState(false);
  const release = () => setPressed(false);
  return (
    <button
      ref={ref}
      type="button"
      className={`arrow-button arrow-button--${direction}${pressed ? " arrow-button--pressed" : ""} ${className}`.trim()}
      style={style}
      aria-label={label}
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onPointerDown={(event) => event.button === 0 && setPressed(true)}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      onClick={(event) => onPress(event.detail === 0)}
    />
  );
});

export default ArrowButton;
