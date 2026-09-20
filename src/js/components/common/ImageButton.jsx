import React from "react";

function ImageButton({ src, srcSet, sizes, alt = "", imageClass = "", className = "", children, ...props }) {
  return (
    <button className={`btn ${className}`} {...props}>
      <img className={`btn__img ${imageClass}`} src={src} srcSet={srcSet} sizes={sizes} alt={alt} />
      {children}
    </button>
  );
}

export default ImageButton;
