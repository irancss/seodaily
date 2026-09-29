"use client";
import { useState } from "react";
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [message, setMessage] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(url); setMessage("لینک کپی شد."); }
    catch { const previous = document.activeElement; const input = document.createElement("textarea"); input.value = url; input.style.position = "fixed"; input.style.opacity = "0"; document.body.append(input); input.select(); const ok = document.execCommand("copy"); input.remove(); if (previous instanceof HTMLElement) previous.focus(); setMessage(ok ? "لینک کپی شد." : `لینک مقاله: ${url}`); }
  }
  return <div className="flex flex-wrap items-center gap-3 text-sm" aria-label="اشتراک‌گذاری مقاله"><a className="btn btn-secondary h-10 px-4" href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer">تلگرام</a><a className="btn btn-secondary h-10 px-4" href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} target="_blank" rel="noopener noreferrer">واتس‌اپ</a><button type="button" className="btn btn-secondary h-10 px-4" onClick={copy}>کپی لینک</button><span role="status" className="break-all text-xs">{message}</span></div>;
}
