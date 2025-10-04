import React, { useEffect, useState } from 'react';
import { HexViewer } from 'react-hexviewer-ts';
import FileSystem from "../utility/FileSystem.js";

const HexViewerComponent = ({ data, selectedTheme }) => {

  const theme = {
    background: selectedTheme === 'dark' ? '#1e1e1e' : '#ffffff',
    color: selectedTheme === 'dark' ? '#d4d4d4' : '#000000',
    offsetColor: selectedTheme === 'dark' ? '#9cdcfe' : '#0000ff',
    selectionColor: selectedTheme === 'dark' ? '#264f78' : '#add6ff',
    selectionTextColor: selectedTheme === 'dark' ? '#ffffff' : '#000000',
  };

  // Convert style object to string for inline styles
  const style = Object.entries(theme)
    .map(([key, value]) => `${key}: ${value}`)
    .join(';');

  return (
    <div 
      className="hex-viewer-container"
      style={{
      height: '100%',
      overflow: 'auto',
        ...theme,
      padding: '10px',
      boxSizing: 'border-box'
      }}
    >
      <HexViewer
        data={data}
        showAscii={true}
        showHeader={true}
        showOffsets={true}
        bytesPerLine={16}
        style={{ height: '100%' }}
      />
    </div>
  );
};

export default HexViewerComponent;
