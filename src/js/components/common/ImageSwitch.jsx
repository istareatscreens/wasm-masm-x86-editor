import React, { forwardRef } from "react";

const ImageSwitch = forwardRef(
  ({ className, clickHandler, imgClass, src, checked, onChange, ...props }, ref) => {
    const handleChange = (e) => {
      if (onChange) {
        onChange(e);
      }
      if (clickHandler) {
        clickHandler(e);
      }
    };

    return (
      <div className="switch switch__container">
        <input
          ref={ref}
          type="checkbox"
          className={`switch ${className}`}
          checked={checked}
          onChange={handleChange}
          {...props}
        />
        <img className={`switch__image ${imgClass}`} src={src} alt="" />
      </div>
    );
  }
);

export default ImageSwitch;
