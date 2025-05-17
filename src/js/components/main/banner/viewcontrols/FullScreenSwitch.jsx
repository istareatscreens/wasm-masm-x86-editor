import React, { useState } from 'react';
import Switch from "../../../common/ImageSwitch.jsx";
import fullScreenImage from "../../../../../images/fullscreen.png"

const FullscreenSwitch = () => {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
            setIsFullScreen(true);
            return;
        }
        document.exitFullscreen();
        setIsFullScreen(false)
    };

    return (
        <Switch
            className={"switch--file-drawer"}
            imgClass={"switch--file-switch"}
            title={"Toggle Full Screen"}
            onClick={toggleFullScreen}
            checked={isFullScreen}
            src={fullScreenImage}
        />
    );
};

export default FullscreenSwitch;