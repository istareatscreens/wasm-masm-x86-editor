import React, { useCallback, useState } from "react";
import { List } from "react-window";

import useRetroScrollbars from "../../../common/useRetroScrollbars.js";
import { ROW_PX } from "./SidebarSection.jsx";

// `row` draws one row ({ index, style, ...rowProps }); `onList` gets the list's handle (scrollToRow) once it exists.
function VirtualList({ label, count, row, rowProps, onList, className = "" }) {
  const [host, setHost] = useState(null);
  const [list, setList] = useState(null);
  useRetroScrollbars(list ? list.element : null, host, label);
  const take = useCallback(
    (api) => {
      setList(api);
      if (onList) onList(api);
    },
    [onList],
  );
  return (
    <div ref={setHost} className={("retro-scroll-host debug-virtual " + className).trim()}>
      <List listRef={take} rowComponent={row} rowCount={count} rowHeight={ROW_PX} rowProps={rowProps} overscanCount={4} role="list" aria-label={label} tabIndex={0} className="debug-virtual__list" />
    </div>
  );
}

export default VirtualList;
