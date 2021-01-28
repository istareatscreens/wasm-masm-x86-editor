import React from "react";
import newFile from "../../../../images/newFile.png";

const FileDrawer = React.memo(function FileDrawer({
  fileList,
  fileSelected,
  switchFile,
}) {
  console.log({ size: fileList.length, fileList, info: "FILEDRAWER" });
  return (
    <div className="FileDrawer">
      <div className="FileDrawer__menu">
        <img
          className="FileDrawer__menu__btn FileDrawer__menu__btn--newFile windows--btn"
          src={newFile}
          alt="create new assembly (.asm) text file"
        />
      </div>
      <ul className="FileDrawer__list tree-view">
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
      </ul>
    </div>
  );
});

export default FileDrawer;
