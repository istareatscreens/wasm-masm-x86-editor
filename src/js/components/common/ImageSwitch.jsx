import React from "react";

function ImageSwitch({ className, clickHandler, src, ...props }) {
  return (
    <div className="switch switch__container">
      <input type="checkbox" className={`switch ${className}`} {...props} />
      <img className="switch__image" src={src}></img>
    </div>
  );
}

export default ImageSwitch;
