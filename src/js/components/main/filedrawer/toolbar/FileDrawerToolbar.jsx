import React from "react";

import Button from "../../../common/ImageButton.jsx";
import Checkbox from "../../../common/Checkbox.jsx";
import Switch from "../../../common/ImageSwitch.jsx";

import newFileIcon from "../../../../../images/newFile.png";
import newFolderIcon from "../../../../../images/newFolder.png";
import newDriveIcon from "../../../../../images/newDrive.png";
import uploadFile from "../../../../../images/uploadFile.png";
import importFolder from "../../../../../images/importFolder.png";
import saveFile from "../../../../../images/saveFile.png";
import shareLinkIcon from "../../../../../images/shareLink.png";
import importLinkIcon from "../../../../../images/importLink.png";
import deleteFile from "../../../../../images/deleteFile.png";
import files from "../../../../../images/files.png";

// The browser's directory picker. Hidden only where the property does not exist: older
// mobile browsers have it but return plain files without paths, which the import
// detects and handles (FileSystem.importDirectoryFiles).
const canPickFolders = typeof HTMLInputElement !== "undefined" && "webkitdirectory" in HTMLInputElement.prototype;

// The drawer's top bar: the controls it always had, in their order, plus "create new
// folder" and "import a folder". The select-all box has a column of its own, on the
// banner's last row; the buttons wrap to its right (layout/_banner.scss). A button that opens
// a window toggles it ({ toggle, opener }: common/useWindowToggle.js).
function FileDrawerToolbar({
  fileUploadInput,
  folderUploadInput,
  selectAll,
  onSelectAll,
  newFile,
  newFolder,
  newDrive,
  onUploadFiles,
  onImportFolder,
  onSave,
  shareLink,
  importLink,
  remove,
  asmOnly,
  onAsmOnly,
  showLegacyDownload,
  onDownloadLegacy,
}) {
  return (
    <div className="banner__file-drawer">
      <Checkbox
        title="Select all"
        className="checkbox--filedrawer checkbox--selectAll"
        checked={selectAll === "checked"}
        indeterminate={selectAll === "mixed"}
        onChange={(event) => onSelectAll(event.target.checked)}
      />
      <div className="banner__file-drawer__buttons">
        <Button
          src={newFileIcon}
          className={"banner__file-drawer__btn"}
          title="create new assembly (.asm) text file"
          onClick={newFile.toggle}
          {...newFile.opener}
        />
        <Button
          src={newFolderIcon}
          className={"banner__file-drawer__btn"}
          title="create new folder"
          onClick={newFolder.toggle}
          {...newFolder.opener}
        />
        <Button
          src={newDriveIcon}
          className={"banner__file-drawer__btn"}
          title="create new drive, holding a new test.asm"
          onClick={newDrive.toggle}
          {...newDrive.opener}
        />
        <Button
          src={uploadFile}
          className={"banner__file-drawer__btn"}
          title="add file(s) to project"
          onClick={() => fileUploadInput.current.click()}
        />
        <input
          onChange={onUploadFiles}
          id="uploadFilesInput"
          ref={fileUploadInput}
          className={"file-upload-input file-upload-input--hidden"}
          type="file"
          multiple
        />
        {canPickFolders && (
          <>
            <Button
              src={importFolder}
              className={"banner__file-drawer__btn"}
              title="import a folder"
              onClick={() => folderUploadInput.current.click()}
            />
            <input
              onChange={onImportFolder}
              id="uploadFolderInput"
              ref={folderUploadInput}
              className={"file-upload-input file-upload-input--hidden"}
              type="file"
              webkitdirectory=""
              directory=""
              multiple
            />
          </>
        )}
        <Button
          src={saveFile}
          className={"banner__file-drawer__btn"}
          title="save selected file(s)"
          type="button"
          onClick={onSave}
        />
        <Button
          src={shareLinkIcon}
          className={"banner__file-drawer__btn"}
          title="share by URL: a link holding the selected files"
          type="button"
          onClick={shareLink.toggle}
          {...shareLink.opener}
        />
        <Button
          src={importLinkIcon}
          className={"banner__file-drawer__btn"}
          title="import by URL: share links, each onto a drive of its own"
          type="button"
          onClick={importLink.toggle}
          {...importLink.opener}
        />
        <Button
          src={deleteFile}
          className={"banner__file-drawer__btn"}
          title="delete selected file(s)"
          onClick={remove.toggle}
          {...remove.opener}
        />
        <Switch
          className={"switch--file-drawer"}
          imgClass={"switch--file-switch"}
          title={asmOnly ? "show all files" : "show only .asm files"}
          checked={asmOnly}
          onChange={(event) => onAsmOnly(event.target.checked)}
          src={files}
        />
        {showLegacyDownload && (
          <Button
            src={saveFile}
            className={"banner__file-drawer__btn banner__file-drawer__btn--legacy"}
            title="Download your legacy browser-storage files as a .zip (backup before migration)"
            type="button"
            onClick={onDownloadLegacy}
          />
        )}
      </div>
    </div>
  );
}

export default FileDrawerToolbar;
