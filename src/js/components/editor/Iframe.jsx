import React, { useEffect, useRef, useCallback } from "react";

function Iframe(props) {
  const iframeRef = useRef(null);

  const iframeCallbackRef = useCallback((node) => {
    iframeRef.current = node;
  }, []);

  useEffect(() => {
    const onBlur = () => {
      if (
        document.activeElement &&
        document.activeElement.nodeName.toLowerCase() === "iframe" &&
        iframeRef.current &&
        iframeRef.current === document.activeElement
      ) {
        // infer a click event
        props.onInferredClick(iframeRef.current);
      }
    };

    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return <iframe {...props} ref={iframeCallbackRef} />;
}

export default Iframe;
