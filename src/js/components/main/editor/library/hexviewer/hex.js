import React, { useRef, useEffect, useLayoutEffect, useState, useMemo } from 'react';
import { List } from 'react-window';
import { Row } from './row';

const ROW_HEIGHT = 25; // Height of each row in pixels
const OVERSCAN_COUNT = 5; // Number of items to render outside of the visible area
const PAD = "000000";

// Define RowRenderer OUTSIDE component to keep it stable across renders
// This is CRITICAL for react-window to work properly
// v2.2.0 spreads rowProps directly, NOT as a 'data' prop
const RowRenderer = ({ index, style, rows, bytesper }) => {
    
    // Safety checks
    if (!style || !rows || !Array.isArray(rows) || index < 0 || index >= rows.length) {
        return null;
    }
    
    const row = rows[index];
    if (!row || !Array.isArray(row)) {
        return null;
    }

    let heading = `${index * bytesper}`;
    heading = PAD.substring(0, PAD.length - heading.length) + heading;

    return (
        <div style={{ ...style, width: '100%' }}>
            <Row sets={row} heading={heading} />
        </div>
    );
};

const Hex = ({ rows = [], bytesper }) => {
    const [windowHeight, setWindowHeight] = useState(0);
    const containerRef = useRef(null);
    const heightRef = useRef(0);
    const resizeObserverRef = useRef(null);

    // Use LayoutEffect to measure synchronously before paint
    useLayoutEffect(() => {
        if (containerRef.current) {
            const height = containerRef.current.offsetHeight;
            if (height > 0 && height !== heightRef.current) {
                heightRef.current = height;
                setWindowHeight(height);
            }
        }
    }, [rows]); // Update when rows change

    useEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                const height = containerRef.current.offsetHeight;
                if (height > 0 && height !== heightRef.current) {
                    heightRef.current = height;
                    setWindowHeight(height);
                }
            }
        };

        // Delayed initial update
        const initialTimer = setTimeout(updateHeight, 0);
        const fallbackTimer = setTimeout(updateHeight, 100);

        // DELAY ResizeObserver attachment to avoid interfering with initial render
        const observerTimer = setTimeout(() => {
            if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
                resizeObserverRef.current = new ResizeObserver(updateHeight);
                resizeObserverRef.current.observe(containerRef.current);
            }
        }, 300); // Wait 300ms after mount

        const resizeHandler = () => updateHeight();
        const resizeTimer = setTimeout(() => {
            window.addEventListener('resize', resizeHandler);
        }, 300);

        return () => {
            clearTimeout(initialTimer);
            clearTimeout(fallbackTimer);
            clearTimeout(observerTimer);
            clearTimeout(resizeTimer);
            window.removeEventListener('resize', resizeHandler);
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
                resizeObserverRef.current = null;
            }
        };
    }, []); // Only run once!

    // Memoize data passed to row renderer for performance
    const itemData = useMemo(() => ({
        rows,
        bytesper
    }), [rows, bytesper]);

    // Validate all required props
    const validHeight = typeof windowHeight === 'number' && windowHeight > 0;
    const validRows = Array.isArray(rows) && rows.length > 0;
    const validBytesper = typeof bytesper === 'number' && bytesper > 0;
    const hasContainer = !!containerRef.current;
    
    // Check if we're ready to render - all conditions must be met
    const isReady = hasContainer && validHeight && validRows && validBytesper;
    
    const listProps = {
        height: Math.floor(windowHeight),
        itemCount: rows.length,
        itemSize: ROW_HEIGHT,
        width: "100%"
    };

    return (
        <div className="hexviewer" ref={containerRef} style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
            <div className="hex" style={{ height: '100%', position: 'relative' }}>
                {!isReady ? (
                    <div style={{ padding: '10px', color: '#888' }}>
                        {!validRows ? 'Preparing view...' : !validHeight ? 'Calculating dimensions...' : 'Initializing...'}
                    </div>
                ) : (
                    <List
                        rowComponent={RowRenderer}
                        rowCount={listProps.itemCount}
                        rowHeight={listProps.itemSize}
                        height={listProps.height}
                        width={listProps.width}
                        rowProps={itemData}
                        overscanCount={OVERSCAN_COUNT}
                        style={{ outline: 'none' }}
                    />
                )}
            </div>
        </div>
    );
};

export { Hex };
