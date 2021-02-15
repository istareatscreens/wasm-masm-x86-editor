import React from "react";

function ImageButton({ src, className, ...props }) {
  return (
    <button className={`btn ${className}`} {...props}>
      <img className="btn__img" src={src} />
    </button>
  );
}

export default ImageButton;
