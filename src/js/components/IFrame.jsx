/*source
https://stackoverflow.com/questions/34743264/how-to-set-iframe-content-of-a-react-component
*/
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

function IFrame({ children, ...props }) {
  const [contentRef, setContentRef] = useState(null);
  const mountNode = contentRef?.contentWindow?.document?.body;

  return (
    <iframe
      width="100%"
      height="100%"
      sandbox="allow-same-origin allow-scripts"
      {...props}
      ref={setContentRef}
    >
      <head>{mountNode && createPortal(children, mountNode)}</head>
    </iframe>
  );
}

export default IFrame;
