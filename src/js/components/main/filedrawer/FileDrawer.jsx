import React from "react";

const FileDrawer = React.memo(function FileDrawer({
  fileList,
  fileSelected,
  switchFile,
}) {
  console.log({ size: fileList.length, fileList, info: "FILEDRAWER" });
  return (
    <div className="FileDrawer">
      <ol className="FileDrawer__list">
        {fileList.length
          ? fileList.map((filename, index) => (
              <li
                onClick={(e) => {
                  console.log(e.currentTarget.innerText);
                  switchFile(e.currentTarget.innerText);
                }}
                className={
                  filename == fileSelected
                    ? "FileDrawer__listItem selected-item"
                    : "FileDrawer__listItem"
                }
                key={index}
              >
                {filename}
              </li>
            ))
          : ""}
      </ol>
    </div>
  );
});

export default FileDrawer;
