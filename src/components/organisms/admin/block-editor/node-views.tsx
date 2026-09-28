"use client";

import { NodeViewContent, NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useState } from "react";

import { CALLOUT_TONES, ENTITY_LINK_RE, SITE_PAGES } from "@/modules/blocks/schema";

import { LinkPicker } from "./link-picker";

const TONE_LABEL: Record<string, string> = { info: "اطلاع", warning: "هشدار", success: "نکته مثبت" };
const RATIO_LABEL: Record<string, string> = { auto: "اندازه اصلی", "16/9": "۱۶:۹", "4/3": "۴:۳", "1/1": "مربع" };

function BlockShell({ label, selected, onDelete, children }: { label: string; selected: boolean; onDelete: () => void; children: React.ReactNode }) {
  return (
    <div className={`my-3 rounded-xl border bg-white p-3 ${selected ? "border-brand ring-2 ring-brand/20" : "border-line"}`}>
      <div className="mb-2 flex items-center justify-between gap-2" contentEditable={false}>
        <span className="text-xs font-semibold text-muted">{label}</span>
        <button type="button" onClick={onDelete} className="rounded px-2 py-1 text-xs text-error hover:bg-error-bg">
          حذف بلوک
        </button>
      </div>
      {children}
    </div>
  );
}

export function FigureView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  const a = node.attrs as { src: string; alt: string; caption: string; ratio: string; width?: number; height?: number };
  return (
    <NodeViewWrapper>
      <BlockShell label="تصویر" selected={selected} onDelete={deleteNode}>
        <div className="grid gap-3 sm:grid-cols-[200px_minmax(0,1fr)]" contentEditable={false}>
          { }
          <img src={a.src} alt="" className="w-full rounded-md border border-line object-cover" style={a.ratio !== "auto" ? { aspectRatio: a.ratio } : undefined} />
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">متن جایگزین (alt) — برای کاربران صفحه‌خوان و موتور جست‌وجو</span>
              <input className="field h-9" value={a.alt} maxLength={250} onChange={(e) => updateAttributes({ alt: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">توضیح زیر تصویر (اختیاری)</span>
              <input className="field h-9" value={a.caption} maxLength={300} onChange={(e) => updateAttributes({ caption: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">نسبت ابعاد</span>
              <select className="field h-9" value={a.ratio} onChange={(e) => updateAttributes({ ratio: e.target.value })}>
                {Object.entries(RATIO_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            {!a.alt && <p className="text-xs text-warning">متن جایگزین خالی است.</p>}
          </div>
        </div>
      </BlockShell>
    </NodeViewWrapper>
  );
}

export function CalloutView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  return (
    <NodeViewWrapper>
      <BlockShell label="باکس توضیح" selected={selected} onDelete={deleteNode}>
        <div contentEditable={false} className="mb-2">
          <label className="flex items-center gap-2 text-sm">
            <span>نوع:</span>
            <select className="field h-8 w-auto" value={String(node.attrs.tone)} onChange={(e) => updateAttributes({ tone: e.target.value })}>
              {CALLOUT_TONES.map((t) => (
                <option key={t} value={t}>
                  {TONE_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <NodeViewContent className={`block-callout block-callout-${String(node.attrs.tone)}`} />
      </BlockShell>
    </NodeViewWrapper>
  );
}

export function FaqItemView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  return (
    <NodeViewWrapper>
      <div className={`rounded-xl border p-3 ${selected ? "border-brand" : "border-line"}`}>
        <div contentEditable={false} className="mb-2 flex items-center gap-2">
          <input
            className="field h-9 grow font-semibold"
            placeholder="متن پرسش"
            aria-label="متن پرسش"
            value={String(node.attrs.question)}
            maxLength={300}
            onChange={(e) => updateAttributes({ question: e.target.value })}
          />
          <button type="button" onClick={deleteNode} className="rounded px-2 py-1 text-xs text-error hover:bg-error-bg">
            حذف پرسش
          </button>
        </div>
        <NodeViewContent className="min-h-8 rounded-md bg-page px-3 py-1" />
      </div>
    </NodeViewWrapper>
  );
}

function hrefLabel(href: string) {
  const m = ENTITY_LINK_RE.exec(href);
  if (!m) return href;
  if (m[1] === "page") return SITE_PAGES[m[2]]?.label ?? href;
  return m[1] === "plugin" ? `افزونه #${m[2]}` : `دسته #${m[2]}`;
}

export function CtaView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  const a = node.attrs as { title: string; text: string; label: string; href: string };
  const [picking, setPicking] = useState(false);
  return (
    <NodeViewWrapper>
      <BlockShell label="دعوت به اقدام (CTA)" selected={selected} onDelete={deleteNode}>
        <div className="flex flex-col gap-2" contentEditable={false}>
          <input className="field h-9" placeholder="عنوان" aria-label="عنوان CTA" value={a.title} maxLength={150} onChange={(e) => updateAttributes({ title: e.target.value })} />
          <textarea className="field" rows={2} placeholder="متن" aria-label="متن CTA" value={a.text} maxLength={400} onChange={(e) => updateAttributes({ text: e.target.value })} />
          <div className="flex flex-wrap items-center gap-2">
            <input className="field h-9 w-48" placeholder="متن دکمه" aria-label="متن دکمه" value={a.label} maxLength={60} onChange={(e) => updateAttributes({ label: e.target.value })} />
            <span className="text-sm text-muted">مقصد: {hrefLabel(a.href)}</span>
            <button type="button" className="btn btn-secondary h-9 px-3 text-sm" onClick={() => setPicking((v) => !v)}>
              {picking ? "بستن" : "تغییر مقصد"}
            </button>
          </div>
          {picking && (
            <LinkPicker
              value={a.href}
              onChange={(href) => {
                updateAttributes({ href });
                setPicking(false);
              }}
            />
          )}
        </div>
      </BlockShell>
    </NodeViewWrapper>
  );
}
