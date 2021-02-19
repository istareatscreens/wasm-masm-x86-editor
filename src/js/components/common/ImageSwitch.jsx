import React, { forwardRef } from "react";

const ImageSwitch = ({ className, clickHandler, imgClass, src, ...props }) => {
  return (
    <div className="switch switch__container">
      <input type="checkbox" className={`switch ${className}`} {...props} />
      <img className={`switch__image ${imgClass}`} src={src}></img>
    </div>
  );
};

export default ImageSwitch;
