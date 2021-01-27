import React from "react";

const FileDrawer = React.memo(function FileDrawer({
  fileList,
  fileSelected,
  switchFile,
}) {
  console.log({ size: fileList.length, fileList, info: "FILEDRAWER" });
  return (
    <div className="FileDrawer">
      <div className="FileDrawer__menu"></div>
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
                    ? "FileDrawer__listItem FileDrawer__listItem--selected"
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
