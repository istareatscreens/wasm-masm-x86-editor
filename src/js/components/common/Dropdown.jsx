import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { attachRetroScrollbars } from "./retroScrollbars";

const ROW_HEIGHT = 20;
const MAX_MENU_HEIGHT = 244;

function Dropdown({ options = [], selected, classNameDropdown = "", onChange, disabled, ...buttonProps }) {
  const id = useId();
  const listId = `${id}-list`;
  const buttonRef = useRef(null);
  const popupRef = useRef(null);
  const scrollHostRef = useRef(null);
  const listRef = useRef(null);
  const typeAhead = useRef({ text: "", time: 0 });
  const selectedIndex = Math.max(0, options.findIndex((option) => option.id === selected?.id));
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const [placement, setPlacement] = useState(null);
  const label = buttonProps["aria-label"] || "Options";

  const openList = (index = selectedIndex) => {
    if (disabled || !options.length) return;
    typeAhead.current = { text: "", time: 0 };
    setActiveIndex(index);
    setPlacement(null);
    setOpen(true);
  };

  const commit = (index, restoreFocus = true) => {
    if (options[index] && index !== selectedIndex) onChange(options[index]);
    setOpen(false);
    typeAhead.current = { text: "", time: 0 };
    if (restoreFocus) buttonRef.current.focus();
  };

  useEffect(() => setActiveIndex(selectedIndex), [selectedIndex]);
  useEffect(() => {
    if (disabled || !options.length) setOpen(false);
    setActiveIndex((index) => Math.min(index, Math.max(0, options.length - 1)));
  }, [disabled, options.length]);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = buttonRef.current.getBoundingClientRect();
      const margin = 4;
      const desiredHeight = Math.min(MAX_MENU_HEIGHT, options.length * ROW_HEIGHT + 4);
      const below = window.innerHeight - rect.bottom - margin;
      const above = rect.top - margin;
      const upward = below < desiredHeight && above > below;
      const height = Math.max(0, Math.min(desiredHeight, upward ? above : below, window.innerHeight - margin * 2));
      const width = Math.min(rect.width, window.innerWidth - margin * 2);
      setPlacement({
        left: Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin)),
        top: Math.max(margin, Math.min(upward ? rect.top - height : rect.bottom, window.innerHeight - height - margin)),
        width,
        height,
      });
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(buttonRef.current);
    window.addEventListener("resize", place);
    // Ignore scrolling inside the list itself: it doesn't move the trigger.
    const onScroll = (event) => { if (!popupRef.current?.contains(event.target)) place(); };
    document.addEventListener("scroll", onScroll, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [open, options.length]);

  useLayoutEffect(() => {
    if (!open) return;
    const scrollbars = attachRetroScrollbars(listRef.current, scrollHostRef.current, label);
    return () => scrollbars.destroy();
  }, [open, label]);

  useLayoutEffect(() => {
    if (!open || !placement) return;
    const list = listRef.current;
    const row = list.children[activeIndex];
    if (!row) return;
    if (row.offsetTop < list.scrollTop) list.scrollTop = row.offsetTop;
    else if (row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight;
    }
  }, [open, activeIndex, placement]);

  useEffect(() => {
    if (!open) return;
    const outside = (event) => {
      if (!buttonRef.current.contains(event.target) && !popupRef.current?.contains(event.target)) setOpen(false);
    };
    const dismiss = () => setOpen(false);
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("focusin", outside);
    window.addEventListener("blur", dismiss);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("focusin", outside);
      window.removeEventListener("blur", dismiss);
    };
  }, [open]);

  const onKeyDown = (event) => {
    if (disabled || !options.length || event.isComposing) return;
    const key = event.key;
    if (key === "Tab") {
      if (open) commit(activeIndex, false);
      return; // The browser moves focus to the next/previous control.
    }
    if (key === "Escape") {
      if (open) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        buttonRef.current.focus();
      }
      return;
    }
    if (event.ctrlKey || event.metaKey) return;
    const typingSpace = key === " " && typeAhead.current.text && Date.now() - typeAhead.current.time < 700;
    if (key === "Enter" || (key === " " && !typingSpace)) {
      event.preventDefault();
      event.stopPropagation();
      if (open) commit(activeIndex);
      else openList();
      return;
    }
    const steps = { ArrowDown: 1, ArrowUp: -1, PageDown: 10, PageUp: -10 };
    if (key in steps || key === "Home" || key === "End") {
      event.preventDefault();
      event.stopPropagation();
      typeAhead.current = { text: "", time: 0 };
      if (event.altKey && key === "ArrowUp" && open) return commit(activeIndex);
      const index = key === "Home" ? 0 : key === "End" ? options.length - 1
        : Math.max(0, Math.min(options.length - 1, activeIndex + steps[key]));
      if (!open) openList(key === "Home" || key === "End" ? index : selectedIndex);
      else setActiveIndex(index);
      return;
    }
    if (key.length !== 1 || event.altKey) return;
    event.preventDefault();
    event.stopPropagation();
    const now = Date.now();
    const previous = now - typeAhead.current.time < 700 ? typeAhead.current.text : "";
    const text = previous + key.toLocaleLowerCase();
    typeAhead.current = { text, time: now };
    const repeated = [...text].every((character) => character === text[0]);
    const prefix = repeated ? text[0] : text;
    const start = (open ? activeIndex : selectedIndex) + (repeated || !previous ? 1 : 0);
    for (let offset = 0; offset < options.length; offset++) {
      const index = (start + offset) % options.length;
      if (options[index].text.toLocaleLowerCase().startsWith(prefix)) {
        setActiveIndex(index);
        if (!open && index !== selectedIndex) onChange(options[index]);
        break;
      }
    }
  };

  return (
    <>
      <button
        {...buttonProps}
        ref={buttonRef}
        type="button"
        role="combobox"
        disabled={disabled || !options.length}
        className={`select-box ${classNameDropdown}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${id}-option-${activeIndex}` : undefined}
        onClick={() => open ? setOpen(false) : openList()}
        onKeyDown={onKeyDown}
      >
        <span className="select-box__value">{selected?.text || options[0]?.text}</span>
        <span className="select-box__sizer" aria-hidden="true">
          {options.map((option) => <span key={option.id}>{option.text}</span>)}
        </span>
      </button>
      {open && createPortal(
        <div
          ref={popupRef}
          className="dropdown-popup no-drag"
          style={{ ...placement, visibility: placement ? "visible" : "hidden" }}
          onPointerDownCapture={(event) => {
            // Keep the combobox focused while selecting or dragging a scrollbar.
            if (event.pointerType === "mouse" && event.button === 0) event.preventDefault();
          }}
          onMouseDown={(event) => event.stopPropagation()}
          onKeyDown={onKeyDown}
        >
          <div ref={scrollHostRef} className="dropdown-popup__scroll-host retro-scroll-host">
            <div ref={listRef} id={listId} role="listbox" aria-label={label} className="dropdown-popup__list">
              {options.map((option, index) => (
                <div
                  key={option.id}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={index === selectedIndex}
                  className={`dropdown-popup__option${index === activeIndex ? " is-active" : ""}`}
                  onPointerMove={(event) => {
                    if (event.pointerType === "mouse") setActiveIndex(index);
                  }}
                  onClick={() => commit(index)}
                >{option.text}</div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default Dropdown;
