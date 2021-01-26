import React from "react";

function FileDrawer({ fileList, fileSelected }) {
  return (
    <div className="FileDrawer">
      <ol className="FileDrawer__list">
        {fileList.legnth &&
          fileList.map((filename) => (
            <li className="FileDrawer__listItem">{filename}</li>
          ))}
      </ol>
    </div>
  );
}

export default FileDrawer;
