import React from "react";

const FileDrawer = React.memo(function FileDrawer({ fileList, fileSelected }) {
  console.log({ size: fileList.length, fileList, info: "FILEDRAWER" });
  return (
    <div className="FileDrawer">
      <ol className="FileDrawer__list">
        {fileList.length
          ? fileList.map((filename, index) =>
              filename == fileSelected ? (
                <li className="FileDrawer__listItem selected-item" key={index}>
                  {filename}
                </li>
              ) : (
                <li
                  className="FileDrawer__listItem FileDrawer__listItem--selected"
                  key={index}
                >
                  {filename}
                </li>
              )
            )
          : ""}
      </ol>
    </div>
  );
});

export default FileDrawer;
