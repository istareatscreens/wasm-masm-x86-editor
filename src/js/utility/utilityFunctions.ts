//Remove and add scripts for react
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

//Handle post messages and rethrow in document as event
export const createMessageListner = () => {
  window.addEventListener("message", handleMessage, true);
};

const handleMessage = (event: MessageEvent) => {
  //prevent acting on boxedwine execution code
  if (event.data != "zero-timeout-message" && event.data != "") {
    //prevent errors thrown for boxedwine events
    try {
      const { eventName, data } = <{ eventName: string; data: any }>(
        JSON.parse(event.data)
      );
      window.dispatchEvent(new CustomEvent(eventName, { detail: data.data }));
    } catch {}
  }
};

//send post messages
export const postMessage = (eventName: string, data: any) => {
  (<HTMLIFrameElement>(
    document.getElementById("boxedwine")
  )).contentWindow.postMessage(
    JSON.stringify({ eventName: eventName, data: data }),
    "/"
  );
};

//Generic debounce
export const debounce = (fn: () => any, delay: number) => {
  let timer;
  return (function () {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn();
    }, delay);
  })();
};
