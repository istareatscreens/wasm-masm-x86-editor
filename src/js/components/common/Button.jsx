import React from "react";

function Button({ src, ...props }) {
  return (
    <button {...props}>
      <img src={src} />
    </button>
  );
}

export default Button;
