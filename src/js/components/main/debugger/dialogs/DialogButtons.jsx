import React from "react";

// A dialog's OK and Cancel, as the app's message boxes have their buttons.
function DialogButtons({ onOk, onCancel, okDisabled = false }) {
  return (
    <div className="window__confirm__buttons">
      <div className="window__confirm__group">
        <button type="button" className="btn btn--text window__confirm__btn" disabled={okDisabled} onClick={onOk}>
          OK
        </button>
        <button type="button" className="btn btn--text window__confirm__btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default DialogButtons;
