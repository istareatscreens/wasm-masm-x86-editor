import React from "react";

function Button({ src, ...props }) {
  return (
    <button className="btn" {...props}>
      <img className="btn__img" src={src} />
    </button>
  );
}

export default Button;
