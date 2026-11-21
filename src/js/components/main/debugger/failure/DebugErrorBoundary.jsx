import React from "react";

import RetroNotice from "../../../common/RetroNotice.jsx";
import { DebugFailure } from "../../utility/debug/report/failure";

// A render error in the sidebar ends the session and leaves a notice in its place; the editor and terminal carry on.
class DebugErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failure: null, url: "" };
  }

  static getDerivedStateFromError(error) {
    return { failure: error, url: "" };
  }

  componentDidCatch(error) {
    const { controller } = this.props;
    const failure = new DebugFailure("internal-error", "the sidebar: " + String((error && error.message) || error));
    console.error("[debugger] internal-error: " + failure.message, error);
    this.setState({ url: controller.adapter.reportUrl(failure) });
    controller.endQuietly("The debugger stopped");
  }

  render() {
    if (!this.state.failure) return this.props.children;
    const again = () => this.setState({ failure: null, url: "" });
    const actions = [{ label: "Reload the debugger", onClick: again }];
    if (this.state.url) actions.unshift({ label: "Report bug", onClick: () => window.open(this.state.url) });
    return (
      <div className="debug-sidebar debug-sidebar--failed" id="debug-pane">
        <div className="debug-notice">
          <RetroNotice id="debug-failure-notice" title="Debugger stopped:" onDismiss={again} actions={actions}>
            <span className="freeze-banner__msg">The debug sidebar hit an internal error.</span>
            <span className="freeze-banner__hint">A bug in the debugger, not in your program: please report it.</span>
            <span className="freeze-banner__safe">Your program and files are untouched.</span>
          </RetroNotice>
        </div>
      </div>
    );
  }
}

export default DebugErrorBoundary;
