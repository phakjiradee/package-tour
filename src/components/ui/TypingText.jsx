"use client";

import { useEffect, useState } from "react";

// Split text into user-perceived characters (grapheme clusters) so Thai
// vowels/tone marks are never rendered as dangling combining marks.
function segment(text) {
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    const splitter = new Intl.Segmenter("th", { granularity: "grapheme" });
    return Array.from(splitter.segment(text), (part) => part.segment);
  }
  return Array.from(text);
}

export default function TypingText({
  words = [],
  typeSpeed = 65,
  deleteSpeed = 35,
  pause = 1600,
  loop = true,
  caret = true,
  className = "",
}) {
  const list = words.length ? words : [""];
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const current = segment(list[index % list.length]);
  const done = !loop && list.length === 1;

  useEffect(() => {
    let timeout;
    if (!deleting) {
      if (count < current.length) {
        timeout = setTimeout(() => setCount((value) => value + 1), typeSpeed);
      } else if (!done) {
        timeout = setTimeout(() => setDeleting(true), pause);
      }
    } else if (count > 0) {
      timeout = setTimeout(() => setCount((value) => value - 1), deleteSpeed);
    } else {
      timeout = setTimeout(() => {
        setDeleting(false);
        setIndex((value) => (value + 1) % list.length);
      }, deleteSpeed);
    }
    return () => clearTimeout(timeout);
  }, [
    count,
    deleting,
    index,
    current.length,
    done,
    typeSpeed,
    deleteSpeed,
    pause,
    list.length,
  ]);

  return (
    <>
      <span aria-hidden="true" className={className}>
        {current.slice(0, count).join("")}
        {caret ? <span className="typing-caret" /> : null}
      </span>
      <span className="sr-only">{list.join(" ")}</span>
    </>
  );
}
