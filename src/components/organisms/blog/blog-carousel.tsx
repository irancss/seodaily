"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
export function BlogCarousel({ children, interval }: { children: ReactNode; interval: number }) {
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false), [hovered, setHovered] = useState(false), [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false), [reduced, setReduced] = useState(true), [overflow, setOverflow] = useState(false);
  const active = useRef(0);
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReduced(motion.matches), visibility = () => setHidden(document.hidden);
    syncMotion(); visibility(); motion.addEventListener("change", syncMotion); document.addEventListener("visibilitychange", visibility);
    const observer = new ResizeObserver(() => { if (track.current) setOverflow(track.current.scrollWidth > track.current.clientWidth + 2); });
    if (track.current) observer.observe(track.current);
    return () => { motion.removeEventListener("change", syncMotion); document.removeEventListener("visibilitychange", visibility); observer.disconnect(); };
  }, []);
  function move(delta: number) {
    const el = track.current; if (!el) return;
    const items = Array.from(el.children) as HTMLElement[];
    const atEnd = Math.abs(el.scrollLeft) >= el.scrollWidth - el.clientWidth - 2;
    active.current = delta > 0 && atEnd ? 0 : (active.current + delta + items.length) % items.length;
    const item = items[active.current];
    // Relative physical offset works with RTL's negative scrollLeft, without moving the page vertically.
    el.scrollBy({ left: item.getBoundingClientRect().right - el.getBoundingClientRect().right, behavior: reduced ? "instant" : "smooth" });
  }
  useEffect(() => {
    if (paused || hovered || focused || hidden || reduced || !overflow) return;
    const timer = setInterval(() => move(1), interval);
    return () => clearInterval(timer);
  // move reads refs and the reduced-motion mode already listed below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, hovered, focused, hidden, reduced, overflow, interval]);
  return <div role="region" aria-roledescription="اسلایدر" aria-label="آخرین مقاله‌ها" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false); }}>
    {overflow && <div className="mb-4 flex flex-wrap gap-2"><button className="btn btn-secondary h-10 px-4 text-sm" type="button" onClick={() => { setPaused(true); move(-1); }}>مقاله‌های قبلی اسلایدر</button><button className="btn btn-secondary h-10 px-4 text-sm" type="button" onClick={() => { setPaused(true); move(1); }}>مقاله‌های بعدی اسلایدر</button><button className="btn btn-secondary h-10 px-4 text-sm" type="button" aria-pressed={paused || reduced} onClick={() => { setPaused(!(paused || reduced)); setReduced(false); }}>{paused || reduced ? "ادامه حرکت خودکار" : "توقف حرکت خودکار"}</button></div>}
    <div ref={track} className="blog-carousel" onPointerDown={() => setPaused(true)} onScroll={() => { const el = track.current; if (!el) return; const edge = el.getBoundingClientRect().right; const distances = Array.from(el.children).map((c) => Math.abs(c.getBoundingClientRect().right - edge)); active.current = distances.indexOf(Math.min(...distances)); }}>{children}</div>
  </div>;
}
