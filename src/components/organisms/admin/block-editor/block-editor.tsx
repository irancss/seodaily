"use client";

import { TableKit } from "@tiptap/extension-table";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { uploadBlockImage } from "@/modules/blocks/actions";
import { CODE_LANGUAGES, LIMITS, emptyDocument, isSafeHref, type BlockDocument } from "@/modules/blocks/schema";
import { toast } from "@/lib/toast";

import { BlockId, BlockKeymap, Callout, Cta, Faq, FaqItem, Figure, moveBlock } from "./extensions";
import { LinkPicker } from "./link-picker";

type Props = {
  /** Name of the hidden form field that carries the JSON document. */
  name: string;
  initial: BlockDocument | null | undefined;
  label: string;
  hint?: string;
  placeholder?: string;
};

function ToolButton({ label, onClick, active, disabled, children }: { label: string; onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm transition-colors disabled:opacity-40 ${
        active ? "bg-brand text-white" : "text-ink hover:bg-soft"
      }`}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <span aria-hidden="true" className="mx-1 h-6 w-px bg-line" />;
}

async function measure(file: File): Promise<{ width?: number; height?: number }> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return {};
  }
}

function Toolbar({ editor, onLink, onImage }: { editor: Editor; onLink: () => void; onImage: () => void }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      block: e.isActive("heading", { level: 2 }) ? "h2" : e.isActive("heading", { level: 3 }) ? "h3" : e.isActive("heading", { level: 4 }) ? "h4" : "p",
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      link: e.isActive("link"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      language: String(e.getAttributes("codeBlock").language ?? ""),
      table: e.isActive("table"),
      faq: e.isActive("faq"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const chain = () => editor.chain().focus();

  return (
    <div role="toolbar" aria-label="ابزار ویرایش" className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-line bg-white p-1.5">
      <label className="sr-only" htmlFor={`${editor.instanceId}-block`}>
        نوع متن
      </label>
      <select
        id={`${editor.instanceId}-block`}
        className="field h-9 w-auto py-0 text-sm"
        value={s.block}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "p") chain().setParagraph().run();
          else chain().setHeading({ level: Number(v.slice(1)) as 2 | 3 | 4 }).run();
        }}
      >
        <option value="p">پاراگراف</option>
        <option value="h2">تیتر ۲</option>
        <option value="h3">تیتر ۳</option>
        <option value="h4">تیتر ۴</option>
      </select>
      <Separator />
      <ToolButton label="پررنگ (Ctrl+B)" active={s.bold} onClick={() => chain().toggleBold().run()}>
        <b>B</b>
      </ToolButton>
      <ToolButton label="کج (Ctrl+I)" active={s.italic} onClick={() => chain().toggleItalic().run()}>
        <i>I</i>
      </ToolButton>
      <ToolButton label="زیرخط (Ctrl+U)" active={s.underline} onClick={() => chain().toggleUnderline().run()}>
        <u>U</u>
      </ToolButton>
      <ToolButton label="خط‌خورده" active={s.strike} onClick={() => chain().toggleStrike().run()}>
        <s>S</s>
      </ToolButton>
      <ToolButton label="کد درون‌خطی" active={s.code} onClick={() => chain().toggleCode().run()}>
        {"</>"}
      </ToolButton>
      <ToolButton label="لینک" active={s.link} onClick={onLink}>
        لینک
      </ToolButton>
      <Separator />
      <ToolButton label="فهرست نقطه‌ای" active={s.bullet} onClick={() => chain().toggleBulletList().run()}>
        •≡
      </ToolButton>
      <ToolButton label="فهرست شماره‌دار" active={s.ordered} onClick={() => chain().toggleOrderedList().run()}>
        ۱≡
      </ToolButton>
      <ToolButton label="نقل‌قول" active={s.quote} onClick={() => chain().toggleBlockquote().run()}>
        «»
      </ToolButton>
      <ToolButton label="بلوک کد" active={s.codeBlock} onClick={() => chain().toggleCodeBlock().run()}>
        {"{ }"}
      </ToolButton>
      {s.codeBlock && (
        <select
          aria-label="زبان کد"
          className="field h-9 w-auto py-0 text-sm"
          dir="ltr"
          value={s.language}
          onChange={(e) => chain().updateAttributes("codeBlock", { language: e.target.value }).run()}
        >
          {CODE_LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l || "بدون زبان"}
            </option>
          ))}
        </select>
      )}
      <ToolButton label="جداکننده" onClick={() => chain().setHorizontalRule().run()}>
        ―
      </ToolButton>
      <Separator />
      <ToolButton label="تصویر" onClick={onImage}>
        تصویر
      </ToolButton>
      <ToolButton label="جدول" onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
        جدول
      </ToolButton>
      <ToolButton label="باکس توضیح" onClick={() => chain().insertContent({ type: "callout", attrs: { tone: "info" }, content: [{ type: "paragraph" }] }).run()}>
        باکس
      </ToolButton>
      <ToolButton
        label="پرسش و پاسخ"
        onClick={() =>
          s.faq
            ? chain().insertContent({ type: "faqItem", attrs: { question: "" }, content: [{ type: "paragraph" }] }).run()
            : chain().insertContent({ type: "faq", content: [{ type: "faqItem", attrs: { question: "" }, content: [{ type: "paragraph" }] }] }).run()
        }
      >
        {s.faq ? "+ پرسش" : "FAQ"}
      </ToolButton>
      <ToolButton label="دعوت به اقدام" onClick={() => chain().insertContent({ type: "cta", attrs: { title: "", text: "", label: "درخواست مشاوره", href: "entity:page:contact" } }).run()}>
        CTA
      </ToolButton>
      <Separator />
      <ToolButton label="انتقال بلوک به بالا (Alt+Shift+↑)" onClick={() => moveBlock(editor, -1)}>
        ↑
      </ToolButton>
      <ToolButton label="انتقال بلوک به پایین (Alt+Shift+↓)" onClick={() => moveBlock(editor, 1)}>
        ↓
      </ToolButton>
      <ToolButton label="واگرد (Ctrl+Z)" disabled={!s.canUndo} onClick={() => chain().undo().run()}>
        ↶
      </ToolButton>
      <ToolButton label="ازنو (Ctrl+Shift+Z)" disabled={!s.canRedo} onClick={() => chain().redo().run()}>
        ↷
      </ToolButton>
      {s.table && (
        <div className="flex w-full flex-wrap items-center gap-0.5 border-t border-line pt-1" aria-label="ابزار جدول">
          <ToolButton label="ردیف بعد" onClick={() => chain().addRowAfter().run()}>
            + ردیف
          </ToolButton>
          <ToolButton label="ستون بعد" onClick={() => chain().addColumnAfter().run()}>
            + ستون
          </ToolButton>
          <ToolButton label="حذف ردیف" onClick={() => chain().deleteRow().run()}>
            − ردیف
          </ToolButton>
          <ToolButton label="حذف ستون" onClick={() => chain().deleteColumn().run()}>
            − ستون
          </ToolButton>
          <ToolButton label="ردیف سرستون" onClick={() => chain().toggleHeaderRow().run()}>
            سرستون
          </ToolButton>
          <ToolButton label="حذف جدول" onClick={() => chain().deleteTable().run()}>
            حذف جدول
          </ToolButton>
        </div>
      )}
    </div>
  );
}

/**
 * The panel's block editor (TipTap/ProseMirror). The document goes to the
 * server action as JSON in a hidden field; the server validates it again.
 */
export function BlockEditor({ name, initial, label, hint, placeholder = "متن را اینجا بنویسید…" }: Props) {
  const id = useId();
  const hidden = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const start = initial ?? emptyDocument();

  const sync = useCallback((editor: Editor, markDirty: boolean) => {
    if (!hidden.current) return;
    hidden.current.value = JSON.stringify({ v: start.v, doc: editor.getJSON() });
    // Toolbar changes fire no native input event; tell the unsaved-changes guard.
    if (markDirty) hidden.current.dispatchEvent(new Event("input", { bubbles: true }));
  }, [start.v]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, isAllowedUri: (url) => isSafeHref(url), HTMLAttributes: { rel: null, target: null } },
      }),
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: LIMITS.textChars }),
      BlockId,
      BlockKeymap,
      Figure,
      Callout,
      Faq,
      FaqItem,
      Cta,
    ],
    content: start.doc as object,
    editorProps: {
      attributes: { dir: "rtl", class: "block-content min-h-64 px-4 py-3 outline-none", "aria-labelledby": `${id}-label`, "aria-multiline": "true", role: "textbox" },
      handlePaste: (_view, event) => {
        const html = event.clipboardData?.getData("text/html") ?? "";
        const text = event.clipboardData?.getData("text/plain") ?? "";
        if (html.length > LIMITS.pasteChars || text.length > LIMITS.pasteChars) {
          toast.error("متن کپی‌شده بیش از حد بزرگ است؛ آن را در چند بخش جای‌گذاری کنید.");
          return true;
        }
        return false;
      },
      // Pasted HTML is parsed against the editor schema (unknown tags, styles
      // and handlers are dropped); scripts and embeds are removed first as well.
      transformPastedHTML: (html) => html.replace(/<(script|style|iframe|object|embed|noscript)[\s\S]*?<\/\1>/gi, ""),
    },
    onCreate: ({ editor: e }) => sync(e, false),
    onUpdate: ({ editor: e }) => sync(e, true),
  });

  useEffect(() => () => editor?.destroy(), [editor]);

  async function onFile(file: File | undefined) {
    if (!file || !editor) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const size = await measure(file);
      if (size.width) fd.set("width", String(size.width));
      if (size.height) fd.set("height", String(size.height));
      const result = await uploadBlockImage(fd);
      if (!result.ok) toast.error(result.error);
      else editor.chain().focus().insertContent({ type: "figure", attrs: { src: result.src, alt: "", caption: "", width: result.width ?? null, height: result.height ?? null, ratio: "auto" } }).run();
    } catch {
      toast.error("بارگذاری تصویر انجام نشد.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function applyLink(href: string, text?: string) {
    if (!editor) return;
    setLinkOpen(false);
    if (editor.state.selection.empty && !editor.isActive("link")) {
      editor.chain().focus().insertContent({ type: "text", text: text || href, marks: [{ type: "link", attrs: { href } }] }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
  }

  const count = editor?.storage.characterCount?.characters?.() ?? 0;
  return (
    <div className="flex flex-col gap-2">
      <span id={`${id}-label`} className="field-label">
        {label}
      </span>
      {hint && <p className="text-xs leading-[1.8] text-muted">{hint}</p>}
      <input ref={hidden} type="hidden" name={name} defaultValue={JSON.stringify(start)} />
      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => onFile(e.target.files?.[0])} />
      <div className="overflow-hidden rounded-lg border border-line-strong bg-white focus-within:ring-2 focus-within:ring-brand/30">
        {editor ? (
          <>
            <Toolbar editor={editor} onLink={() => setLinkOpen((v) => !v)} onImage={() => fileInput.current?.click()} />
            {linkOpen && (
              <div className="border-b border-line bg-page p-3">
                <LinkPicker value={String(editor.getAttributes("link").href ?? "")} onChange={applyLink} autoFocus />
                <div className="mt-2 flex gap-2">
                  {editor.isActive("link") && (
                    <button type="button" className="btn btn-secondary h-9 px-3 text-sm" onClick={() => { editor.chain().focus().extendMarkRange("link").unsetLink().run(); setLinkOpen(false); }}>
                      حذف لینک
                    </button>
                  )}
                  <button type="button" className="btn btn-secondary h-9 px-3 text-sm" onClick={() => setLinkOpen(false)}>
                    انصراف
                  </button>
                </div>
              </div>
            )}
            <EditorContent editor={editor} />
          </>
        ) : (
          <div className="min-h-64 px-4 py-3 text-sm text-muted">در حال بارگذاری ویرایشگر…</div>
        )}
      </div>
      <p className="flex justify-between text-xs text-muted" aria-live="polite">
        <span>{uploading ? "در حال بارگذاری تصویر…" : "جابه‌جایی بلوک: Alt+Shift+↑/↓ · واگرد: Ctrl+Z"}</span>
        <span>
          {count.toLocaleString("fa-IR")} / {LIMITS.textChars.toLocaleString("fa-IR")} نویسه
        </span>
      </p>
    </div>
  );
}
