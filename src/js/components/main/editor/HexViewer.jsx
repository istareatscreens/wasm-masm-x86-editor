import React, { Suspense, useEffect, useState } from 'react';
import { HexViewer } from './library/hexviewer/hex-viewer.js';
import FileSystem from "../utility/FileSystem.js";

const HexViewerComponent = ({ data, lightMode, fontSize = 14, selectedFont = 'monospace' }) => {
  const [loadingState, setLoadingState] = useState('idle');
  const [progress, setProgress] = useState(0);

  const theme = {
    background: lightMode ? '#ffffff' : '#1e1e1e',
    color: lightMode ? '#000000' : '#d4d4d4',
    offsetColor: lightMode ? '#0000ff' : '#9cdcfe',
    selectionColor: lightMode ? '#add6ff' : '#264f78',
    selectionTextColor: lightMode ? '#000000' : '#ffffff',
  };

  const handleLoadingStateChange = (state) => {
    setLoadingState(state);
  };

  const handleProgressChange = (percent) => {
    setProgress(percent);
  };

  const getLoadingMessage = () => {
    switch (loadingState) {
      case 'processing':
        return `Processing data... ${progress}%`;
      case 'preparing':
        return `Preparing view... ${progress}%`;
      case 'rendering':
        return 'Rendering...';
      case 'error':
        return 'Error loading data';
      default:
        return '';
    }
  };

  return (
    <div
      className="hex-viewer-container editor"
      style={{
        overflow: 'auto',
        padding: 0,
        margin: 0,
        boxSizing: 'border-box',
        position: 'relative',
        background: lightMode ? '#ffffff' : '#1e1e1e'
      }}
    >
      {loadingState !== 'idle' && (
        <div
          className="loading-indicator"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000
          }}
        >
          <div className="loading-indicator__title-bar">
            <div className="loading-indicator__title-bar__text">Please Wait...</div>
          </div>
          <div className="loading-indicator__body">
            <div className="loading-indicator__message">
              {loadingState === 'processing' ? 'Processing data...' : 'Preparing display...'}
            </div>
            {(loadingState === 'processing' || loadingState === 'preparing') && (
              <div className="loading-indicator__progress-container">
                <div
                  className="loading-indicator__progress-bar"
                  style={{ width: `${progress}%` }}
                >
                  <div className="loading-indicator__progress-text">{progress}%</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <div style={{
        height: '100%',
        fontSize: `${fontSize}px`,
        fontFamily: selectedFont,
        ...theme,
        margin: 0,
        padding: 0
      }}>
        <HexViewer
          base64
          showAscii={true}
          showHeader={true}
          showOffsets={true}
          bytesPerLine={16}
          onLoadingStateChange={handleLoadingStateChange}
          onProgressChange={handleProgressChange}
          darkMode={!lightMode}
        >
          {data}
        </HexViewer>
      </div>
    </div>
  );
};

export default HexViewerComponent;
