// Server-side gate for block documents: whatever the browser sends, only the
// contract in ./schema is stored. Unknown nodes, marks and attributes are
// dropped (and reported), limits are enforced, top-level ids made unique.
import {
  BLOCK_DOC_VERSION,
  CALLOUT_TONES,
  CODE_LANGUAGES,
  LIMITS,
  MARKS,
  TOP_LEVEL,
  isSafeHref,
  isSafeImageSrc,
  type BlockDocument,
  type BlockNode,
  type Mark,
} from "./schema";

const INLINE = ["text", "hardBreak"];
const LISTS = ["bulletList", "orderedList"];
const CHILDREN: Record<string, readonly string[]> = {
  doc: TOP_LEVEL,
  paragraph: INLINE,
  heading: INLINE,
  bulletList: ["listItem"],
  orderedList: ["listItem"],
  listItem: ["paragraph", ...LISTS],
  blockquote: ["paragraph", ...LISTS],
  codeBlock: ["text"],
  table: ["tableRow"],
  tableRow: ["tableHeader", "tableCell"],
  tableHeader: ["paragraph"],
  tableCell: ["paragraph"],
  callout: ["paragraph", ...LISTS],
  faq: ["faqItem"],
  faqItem: ["paragraph", ...LISTS],
  horizontalRule: [],
  figure: [],
  cta: [],
  hardBreak: [],
};
const RATIOS = ["auto", "16/9", "4/3", "1/1"];
const ID_RE = /^[a-z0-9]{8,24}$/;

export type ValidationResult = { document: BlockDocument; problems: string[]; textChars: number };

function str(value: unknown, max = LIMITS.attrChars) {
  return typeof value === "string" ? stripControl(value).trim().slice(0, max) : "";
}
function stripControl(value: string) {
  // Control characters other than newline/tab never belong in content.
   
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}
function int(value: unknown, min: number, max: number) {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
}

export function newBlockId() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 12);
}

/** Validates and cleans a block document. Never throws: bad input becomes an empty or reduced document. */
export function validateBlockDocument(input: unknown): ValidationResult {
  const problems: string[] = [];
  const note = (message: string) => {
    if (problems.length < 20 && !problems.includes(message)) problems.push(message);
  };
  let textChars = 0;

  const raw = input as { v?: unknown; doc?: unknown } | null;
  if (!raw || typeof raw !== "object") return { document: { v: BLOCK_DOC_VERSION, doc: { type: "doc", content: [] } }, problems: ["محتوا خالی یا نامعتبر بود."], textChars };
  if (raw.v !== BLOCK_DOC_VERSION) note(`نسخه ناشناخته محتوا (${String(raw.v)}) به نسخه ${BLOCK_DOC_VERSION} تبدیل شد.`);

  function marks(list: unknown): Mark[] | undefined {
    if (!Array.isArray(list)) return undefined;
    const out: Mark[] = [];
    for (const m of list as Mark[]) {
      if (!m || !(MARKS as readonly string[]).includes(m.type)) {
        note(`قالب‌بندی ناشناخته «${String(m?.type)}» حذف شد.`);
        continue;
      }
      if (m.type === "link") {
        const href = str(m.attrs?.href);
        if (!isSafeHref(href)) {
          note("لینکی با آدرس نامجاز حذف شد.");
          continue;
        }
        out.push({ type: "link", attrs: { href } });
      } else if (!out.some((x) => x.type === m.type)) out.push({ type: m.type });
    }
    return out.length ? out : undefined;
  }

  function node(n: BlockNode, parent: string, depth: number): BlockNode | null {
    if (!n || typeof n !== "object" || typeof n.type !== "string") return null;
    const allowed = CHILDREN[parent] ?? [];
    if (!allowed.includes(n.type)) {
      note(`بلوک «${n.type}» در این جایگاه مجاز نیست و حذف شد.`);
      return null;
    }
    if (depth > LIMITS.depth) {
      note("تو در تویی بیش از حد مجاز حذف شد.");
      return null;
    }
    if (n.type === "text") {
      let text = stripControl(typeof n.text === "string" ? n.text : "");
      const room = LIMITS.textChars - textChars;
      if (room <= 0) return null;
      if (text.length > room) {
        text = text.slice(0, room);
        note(`متن بیش از ${LIMITS.textChars.toLocaleString("fa-IR")} نویسه کوتاه شد.`);
      }
      if (!text) return null;
      textChars += text.length;
      const m = parent === "codeBlock" ? undefined : marks(n.marks);
      return m ? { type: "text", text, marks: m } : { type: "text", text };
    }

    const out: BlockNode = { type: n.type };
    const a = n.attrs ?? {};
    switch (n.type) {
      case "heading": {
        const level = int(a.level, 1, 6) ?? 2;
        out.attrs = { level: Math.min(4, Math.max(2, level)) };
        if (level === 1) note("H1 مخصوص عنوان صفحه است؛ به H2 تبدیل شد.");
        break;
      }
      case "orderedList":
        out.attrs = { start: int(a.start, 1, 10_000) ?? 1 };
        break;
      case "codeBlock": {
        const language = str(a.language, 20);
        out.attrs = { language: (CODE_LANGUAGES as readonly string[]).includes(language) ? language : "" };
        break;
      }
      case "table":
        out.attrs = { caption: str(a.caption, 200) };
        break;
      case "tableHeader":
      case "tableCell":
        out.attrs = { colspan: int(a.colspan, 1, LIMITS.tableCols) ?? 1, rowspan: int(a.rowspan, 1, LIMITS.tableRows) ?? 1 };
        break;
      case "callout": {
        const tone = str(a.tone, 20);
        out.attrs = { tone: (CALLOUT_TONES as readonly string[]).includes(tone) ? tone : "info" };
        break;
      }
      case "faqItem":
        out.attrs = { question: str(a.question, 300) };
        if (!out.attrs.question) note("پرسشی بدون متن سؤال بود.");
        break;
      case "figure": {
        const src = str(a.src);
        if (!isSafeImageSrc(src)) {
          note("تصویری که از رسانه‌های سایت نبود حذف شد.");
          return null;
        }
        out.attrs = {
          src,
          alt: str(a.alt, 250),
          caption: str(a.caption, 300),
          width: int(a.width, 1, 10_000),
          height: int(a.height, 1, 10_000),
          ratio: RATIOS.includes(str(a.ratio, 10)) ? str(a.ratio, 10) : "auto",
        };
        break;
      }
      case "cta": {
        const href = str(a.href);
        if (!isSafeHref(href)) {
          note("دکمه دعوت به اقدام با مقصد نامجاز حذف شد.");
          return null;
        }
        out.attrs = { title: str(a.title, 150), text: str(a.text, 400), label: str(a.label, 60) || "مشاهده", href };
        break;
      }
    }

    if (Array.isArray(n.content) && (CHILDREN[n.type]?.length ?? 0) > 0) {
      let children = n.content;
      if (n.type === "table" && children.length > LIMITS.tableRows) {
        children = children.slice(0, LIMITS.tableRows);
        note(`جدول به ${LIMITS.tableRows} ردیف محدود شد.`);
      }
      if (n.type === "tableRow" && children.length > LIMITS.tableCols) {
        children = children.slice(0, LIMITS.tableCols);
        note(`جدول به ${LIMITS.tableCols} ستون محدود شد.`);
      }
      const kids = children.map((c) => node(c, n.type, depth + 1)).filter((c): c is BlockNode => c !== null);
      if (kids.length) out.content = kids;
    }
    // Containers that lost all their content are not worth keeping.
    const needsContent = ["bulletList", "orderedList", "listItem", "blockquote", "table", "tableRow", "callout", "faq"];
    if (needsContent.includes(n.type) && !out.content?.length) return null;
    return out;
  }

  const docIn = raw.doc as BlockNode | undefined;
  const top = Array.isArray(docIn?.content) ? docIn.content : [];
  if (top.length > LIMITS.topLevelBlocks) note(`بیش از ${LIMITS.topLevelBlocks} بلوک؛ بلوک‌های اضافه حذف شدند.`);
  const seen = new Set<string>();
  const content: BlockNode[] = [];
  for (const child of top.slice(0, LIMITS.topLevelBlocks)) {
    const clean = node(child, "doc", 1);
    if (!clean) continue;
    let id = str(child.attrs?.id, 24);
    if (!ID_RE.test(id) || seen.has(id)) id = newBlockId();
    seen.add(id);
    clean.attrs = { ...(clean.attrs ?? {}), id };
    content.push(clean);
  }
  return { document: { v: BLOCK_DOC_VERSION, doc: { type: "doc", content } }, problems, textChars };
}
