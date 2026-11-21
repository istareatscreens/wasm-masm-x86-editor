import React, { forwardRef, useState } from "react";

// A Windows 98 double-arrow button, as thick as the bar it sits in. A pointer press leaves the keyboard focus
// where it was (editor or terminal); `onPress` gets true when the keyboard pressed it.
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
