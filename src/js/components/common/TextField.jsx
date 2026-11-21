import React, { forwardRef } from "react";

// A Windows 98 single-line text field, grey while it is read-only or disabled (_textinput.scss), as RetroTextArea is.
const TextField = forwardRef(function TextField({ className = "", type = "text", ...props }, ref) {
  return <input ref={ref} type={type} className={("input-box " + className).trim()} {...props} />;
});

export default TextField;
