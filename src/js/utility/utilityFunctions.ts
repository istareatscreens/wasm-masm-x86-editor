export const removeScript = (scriptToremove: string): void => {
  let allsuspects = <HTMLCollectionOf<HTMLScriptElement>>(
    document.getElementsByTagName("script")
  );
  for (let i = allsuspects.length; i >= 0; i--) {
    if (
      allsuspects[i] &&
      allsuspects[i].getAttribute("src") !== null &&
      allsuspects[i].getAttribute("src").indexOf(`${scriptToremove}`) !== -1
    ) {
      allsuspects[i].parentNode.removeChild(allsuspects[i]);
    }
  }
};

export const addScript = (scriptName: string) => {
  const script = <HTMLScriptElement>document.createElement("script");
  script.src = scriptName;
  script.async = true;
  script.type = "text/javascript";
  document.body.appendChild(script);
};

export const createMessageListner = () => {
  window.addEventListener("message", handleMessage, true);
};

const handleMessage = (event: MessageEvent) => {
  if (event.data != "zero-timeout-message" && event.data != "") {
    //prevent acting on boxedwine execution code
    const { eventName, data } = <{ eventName: string; data: any }>(
      JSON.parse(event.data)
    );
    window.dispatchEvent(new Event(eventName, data));
  }
};
