import React, { useCallback, useEffect, useMemo, useState } from "react";

import TextField from "../../../common/TextField.jsx";
import { useStore } from "../session/debugStore";
import { topIndexOf } from "../tree/treePaths.js";
import ValueTree from "../tree/ValueTree.jsx";
import useRows from "../tree/useRows.js";
import { Empty } from "./ScopeTree.jsx";
import SidebarSection from "./SidebarSection.jsx";

const READ_ONLY = { attributes: ["readOnly"] };
const unanswered = (expression, value = "") => ({ name: expression, value, variablesReference: 0, presentationHint: READ_ONLY });

const watchSource = (controller) => ({
  key: (view) => view.version + ":" + view.frame + ":" + view.settings.hex + ":" + JSON.stringify(view.settings.watches),
  load: (view) =>
    Promise.all(
      view.settings.watches.map(async (expression) => {
        const answer = await controller.client.ask("evaluate", { expression, frameId: view.frame, context: "watch", format: { hex: view.settings.hex } });
        if ("refused" in answer) return unanswered(expression, answer.refused);
        const { result, ...rest } = answer.body;
        return { ...rest, name: expression, value: result, evaluateName: expression };
      }),
    ),
});

function WatchRows({ controller, watches, remove, selected, onSelect }) {
  const source = useMemo(() => watchSource(controller), [controller]);
  const { rows, stale } = useRows(controller, "watch", source);
  const shown = rows && rows.length === watches.length ? rows : watches.map((expression) => unanswered(expression));
  const menu = useCallback(
    (row) =>
      row.level === 1
        ? [{ separator: true }, { label: "Remove Watch", onSelect: () => remove(row.index) }, { label: "Remove All Watches", onSelect: () => controller.removeAllWatches() }]
        : [],
    [controller, remove],
  );
  return <ValueTree controller={controller} label="Watch" rows={shown} stale={stale || !rows} menu={menu} onRemove={remove} selected={selected} onSelect={onSelect} />;
}

// Watches (eax, [esi+4], total*2, arr,10) are kept between visits; with no session the list shows them alone.
// Remove takes the selected watch, or the one a selected row is in; nothing is selected after a removal.
function WatchSection({ controller }) {
  const watches = useStore(controller.store, (view) => view.settings.watches);
  const [text, setText] = useState("");
  const [selected, setSelected] = useState("");
  const chosen = topIndexOf(selected, watches);

  // a selection whose watch is gone (Remove All, another tab) goes with it
  useEffect(() => {
    if (selected && chosen < 0) setSelected("");
  }, [selected, chosen]);

  const remove = useCallback(
    (index) => {
      if (index === topIndexOf(selected, watches)) setSelected("");
      controller.setWatches(watches.filter((_, i) => i !== index));
    },
    [controller, watches, selected],
  );

  const add = () => {
    if (text.trim() && watches.indexOf(text.trim()) < 0) controller.setWatches(watches.concat(text.trim()));
    setText("");
  };

  return (
    <SidebarSection id="watch" title="Watch" controller={controller}>
      <div className="debug-section__tools debug-section__tools--head">
        <button type="button" className="btn btn--text debug-section__button" disabled={chosen < 0} title="Remove the selected watch (Delete)" onClick={() => remove(chosen)}>
          Remove
        </button>
        <button type="button" className="btn btn--text debug-section__button" disabled={!watches.length} title="Remove every watch" onClick={() => controller.removeAllWatches()}>
          Remove All
        </button>
      </div>
      {watches.length ? (
        <WatchRows controller={controller} watches={watches} remove={remove} selected={selected} onSelect={setSelected} />
      ) : (
        <Empty>Type an expression below to watch it at every stop.</Empty>
      )}
      <TextField
        className="debug-section__input"
        aria-label="Add a watch"
        placeholder="Add a watch: eax, total, [esi+4]"
        spellCheck={false}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") add();
        }}
      />
    </SidebarSection>
  );
}

export default WatchSection;
