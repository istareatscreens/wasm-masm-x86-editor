import React, { useEffect, useRef, useState } from "react";
import masmwatch from "../../../images/masmwatch.png";

/*
Modified from https://codepen.io/duptitung
https://codepen.io/duptitung/pen/XMVNyZ
*/
// Shown over the console canvas until the console is visible (isLoading in
// Boxedwine.jsx). The stage line mirrors window.bwBootStage(...) calls made by
// boxedwine.html / the shell / the snapshot layer ("Loading emulator",
// "Restoring your session", "Loading system image", "Booting Windows console").
//
// The composition (_loading-screen.scss) is the original artwork at its designed
// size; when the cmd iframe cannot hold it, the WHOLE group is scaled by one factor
// (transform: scale) so every offset stays proportional - it is never re-laid out.
// DESIGN_W/H = the group's visible bounds at 1x (measured 2026-09-19: 183 x 252 px
// around the centred box, incl. the watch image's overhang above it) plus room for
// a second stage-text line.
const DESIGN_W = 212;
const DESIGN_H = 280;
const LoadingScreen = () => {
    const [stage, setStage] = useState(() => (typeof window !== "undefined" && window.BW_BOOT_STAGE) || "Loading emulator");
    const screenRef = useRef(null);
    const groupRef = useRef(null);
    useEffect(() => {
        const onStage = (e) => setStage(String(e.detail || ""));
        window.addEventListener("bw-boot-stage", onStage);
        return () => window.removeEventListener("bw-boot-stage", onStage);
    }, []);
    useEffect(() => {
        const screen = screenRef.current, group = groupRef.current;
        if (!screen || !group) return undefined;
        const fit = () => {
            const k = Math.min(1, screen.clientWidth / DESIGN_W, screen.clientHeight / DESIGN_H);
            group.style.transform = k < 1 ? `scale(${k.toFixed(4)})` : "";
        };
        fit();
        if (typeof ResizeObserver !== "undefined") {
            const ro = new ResizeObserver(fit);
            ro.observe(screen);
            return () => ro.disconnect();
        }
        window.addEventListener("resize", fit);
        return () => window.removeEventListener("resize", fit);
    }, []);
    return (
        <div className="loading-screen" ref={screenRef}>
            <div className="loading" ref={groupRef}>
                <div className="loading__logo">
                    <div className="logo">
                        <img className="logo__image" src={masmwatch} alt="" />
                        <p className="logo__top">MASM</p>
                        <p className="logo__mid">Runner</p>
                        <p className="logo__bottom">Web</p>
                        <span className="logo__x86">x86</span>
                    </div>
                </div>
                <div className="loading__container">
                    <div className="loading__container__box"></div>
                    <div className="loading__container__box"></div>
                    <div className="loading__container__box"></div>
                </div>
                <p className="loading__stage" role="status">{stage}&hellip;</p>
            </div>
        </div>
    );
};

export default LoadingScreen;
