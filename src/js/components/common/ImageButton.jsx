import React from "react";

function ImageButton({ src, className, children, ...props }) {
  return (
    <button className={`btn ${className}`} {...props}>
      <img className="btn__img" src={src} />
      {children}
    </button>
  );
}

export default ImageButton;
