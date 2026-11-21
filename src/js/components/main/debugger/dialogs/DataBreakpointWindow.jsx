import React, { useEffect, useRef, useState } from "react";

import GroupBox from "../../../common/GroupBox.jsx";
import RadioOption from "../../../common/RadioOption.jsx";
import TextField from "../../../common/TextField.jsx";
import Window from "../../../common/Window.jsx";
import { useStore } from "../session/debugStore";
import DialogButtons from "./DialogButtons.jsx";

const SIZES = [
  { bytes: 0, text: "The value's own size" },
  { bytes: 1, text: "1 byte" },
  { bytes: 2, text: "2 bytes (WORD)" },
  { bytes: 4, text: "4 bytes (DWORD)" },
  { bytes: 8, text: "8 bytes (QWORD)" },
];

// The value is a variable or any expression that names memory; with a size, its address is watched for that many bytes.
function DataBreakpointWindow({ controller, close }) {
  const frame = useStore(controller.store, (view) => view.frame);
  const [text, setText] = useState("");
  const [bytes, setBytes] = useState(0);
  const [problem, setProblem] = useState("");
  const input = useRef(null);
  useEffect(() => input.current.focus(), []);

  const add = async () => {
    const expression = text.trim();
    if (!expression) return;
    const client = controller.client;
    let args = { name: expression, frameId: frame };
    if (bytes) {
      const value = await client.ask("evaluate", { expression, frameId: frame, context: "watch" });
      if ("refused" in value) return setProblem(value.refused);
      if (!value.body.memoryReference) return setProblem("'" + expression + "' is not in memory: only a value with an address can be watched");
      args = { name: value.body.memoryReference, asAddress: true, bytes };
    }
    const info = await client.ask("dataBreakpointInfo", args);
    if ("refused" in info) return setProblem(info.refused);
    if (!info.body.dataId) return setProblem(info.body.description);
    await controller.breakpoints.addData(info.body.dataId, info.body.description);
    close();
  };
  const onKeyDown = (event) => {
    if (event.key === "Enter" && event.target.tagName === "INPUT" && event.target.type === "text") add();
    else if (event.key === "Escape") close();
  };

  return (
    <Window title="New Data Breakpoint" size="fit" className="window__debug" onClose={close} footer={<DialogButtons onOk={add} onCancel={close} okDisabled={!text.trim()} />}>
      <div className="window__debug__body" onKeyDown={onKeyDown}>
        <GroupBox caption="Stop when this changes">
          <TextField
            ref={input}
            aria-label="Variable or expression"
            aria-invalid={!!problem}
            placeholder="total, table[8], [esi]"
            spellCheck={false}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setProblem("");
            }}
          />
          <p className="window__problem" aria-live="polite">
            {problem || " "}
          </p>
        </GroupBox>
        <GroupBox caption="Watch">
          {SIZES.map((size) => (
            <RadioOption key={size.bytes} name="debug-data-size" checked={bytes === size.bytes} onChange={() => setBytes(size.bytes)}>
              {size.text}
            </RadioOption>
          ))}
        </GroupBox>
        <p className="window__debug__hint">Up to four data breakpoints. While one is set the program runs more slowly.</p>
      </div>
    </Window>
  );
}

export default DataBreakpointWindow;
