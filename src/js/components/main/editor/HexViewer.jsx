import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HexViewer } from './library/HexViewer/hex-viewer.js';

const HexViewerComponent = ({ data, selectedTheme }) => {

  // Memoize theme to prevent unnecessary re-renders
  const theme = useMemo(() => ({
    background: selectedTheme === 'dark' ? '#1e1e1e' : '#ffffff',
    color: selectedTheme === 'dark' ? '#d4d4d4' : '#000000',
    offsetColor: selectedTheme === 'dark' ? '#9cdcfe' : '#0000ff',
    selectionColor: selectedTheme === 'dark' ? '#264f78' : '#add6ff',
    selectionTextColor: selectedTheme === 'dark' ? '#ffffff' : '#000000',
  }), [selectedTheme]);


  // Render HexViewer with processed data
  return (
    <div
      className="editor"
      style={{
        height: '100%',
        width: '100%',
        overflow: 'auto',
        background: theme.background,
        color: theme.color,
        padding: '10px',
        boxSizing: 'border-box'
      }}
    >
      <HexViewer
        width="100%"
        height="100%"
        base64
        showAscii={true}
        showHeader={true}
        showOffsets={true}
        style={{ height: '100%', width: '100%' }}
      >
        {data}
      </HexViewer>
    </div>
  );
};

export default HexViewerComponent;
