import { Extension, Node, mergeAttributes, type Editor } from "@tiptap/core";
import { Plugin, TextSelection } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { TOP_LEVEL } from "@/modules/blocks/schema";
import { newBlockId } from "@/modules/blocks/validate";

import { CalloutView, CtaView, FaqItemView, FigureView } from "./node-views";

/** Gives every top-level block a stable id (new, split or pasted blocks get a fresh one). */
export const BlockId = Extension.create({
  name: "blockId",
  addGlobalAttributes() {
    return [
      {
        types: [...TOP_LEVEL],
        attributes: {
          id: {
            default: null,
            keepOnSplit: false,
            parseHTML: (el) => el.getAttribute("data-block-id"),
            renderHTML: (attrs) => (attrs.id ? { "data-block-id": attrs.id } : {}),
          },
        },
      },
    ];
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction(transactions, _old, state) {
          if (!transactions.some((t) => t.docChanged)) return null;
          const tr = state.tr;
          const seen = new Set<string>();
          let changed = false;
          state.doc.forEach((node, offset) => {
            let id = node.attrs.id as string | null;
            if (!id || seen.has(id)) {
              id = newBlockId();
              tr.setNodeMarkup(offset, undefined, { ...node.attrs, id });
              changed = true;
            }
            seen.add(id);
          });
          return changed ? tr.setMeta("addToHistory", false) : null;
        },
      }),
    ];
  },
});

/**
 * Inserts a block after the top-level block holding the cursor, so toolbar
 * blocks (table, callout, FAQ, CTA, image) never land inside a table cell or
 * list item, where the content contract does not allow them.
 */
export function insertBlockAfter(editor: Editor, content: Record<string, unknown>) {
  const { state } = editor;
  const doc = state.doc;
  const depth = state.selection.$from.depth;
  const index = depth >= 1 ? state.selection.$from.index(0) : doc.childCount - 1;
  let pos = 0;
  for (let i = 0; i <= Math.min(index, doc.childCount - 1); i++) pos += doc.child(i).nodeSize;
  // An empty paragraph at the cursor is replaced instead of left behind.
  const current = doc.childCount ? doc.child(Math.max(0, index)) : null;
  if (current && current.type.name === "paragraph" && current.content.size === 0) {
    return editor.chain().focus().insertContentAt({ from: pos - current.nodeSize, to: pos }, content).run();
  }
  return editor.chain().focus().insertContentAt(pos, content).run();
}

/** Moves the top-level block holding the cursor one place up (-1) or down (+1). */
export function moveBlock(editor: Editor, direction: -1 | 1): boolean {
  const { state, view } = editor;
  const doc = state.doc;
  if (state.selection.$from.depth < 1) return false;
  const index = state.selection.$from.index(0);
  const target = index + direction;
  if (target < 0 || target >= doc.childCount) return false;
  const offsets: number[] = [];
  doc.forEach((_n, offset) => offsets.push(offset));
  const node = doc.child(index);
  const from = offsets[index];
  const inside = Math.max(0, state.selection.from - from);
  const tr = state.tr.delete(from, from + node.nodeSize);
  const insertAt = direction < 0 ? offsets[target] : from + doc.child(target).nodeSize;
  tr.insert(insertAt, node);
  tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(insertAt + inside, tr.doc.content.size))));
  view.dispatch(tr.scrollIntoView());
  return true;
}

export const BlockKeymap = Extension.create({
  name: "blockKeymap",
  addKeyboardShortcuts() {
    return {
      "Alt-Shift-ArrowUp": () => moveBlock(this.editor, -1),
      "Alt-Shift-ArrowDown": () => moveBlock(this.editor, 1),
    };
  },
});

/** Image from the site's media, with alt text, caption and aspect ratio. */
export const Figure = Node.create({
  name: "figure",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { src: { default: "" }, alt: { default: "" }, caption: { default: "" }, width: { default: null }, height: { default: null }, ratio: { default: "auto" } };
  },
  parseHTML() {
    return [{ tag: "figure[data-figure]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["figure", mergeAttributes(HTMLAttributes, { "data-figure": "" })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(FigureView);
  },
});

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "(paragraph | bulletList | orderedList)+",
  defining: true,
  addAttributes() {
    return { tone: { default: "info" } };
  },
  parseHTML() {
    return [{ tag: "aside[data-callout]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["aside", mergeAttributes(HTMLAttributes, { "data-callout": "" }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },
});

export const Faq = Node.create({
  name: "faq",
  group: "block",
  content: "faqItem+",
  parseHTML() {
    return [{ tag: "div[data-faq]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-faq": "", class: "flex flex-col gap-3" }), 0];
  },
});

export const FaqItem = Node.create({
  name: "faqItem",
  content: "(paragraph | bulletList | orderedList)+",
  defining: true,
  addAttributes() {
    return { question: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "div[data-faq-item]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-faq-item": "" }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(FaqItemView);
  },
});

/** Call to action: title, text and a button to an internal page or a URL. */
export const Cta = Node.create({
  name: "cta",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { title: { default: "" }, text: { default: "" }, label: { default: "مشاهده" }, href: { default: "entity:page:contact" } };
  },
  parseHTML() {
    return [{ tag: "div[data-cta]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-cta": "" })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(CtaView);
  },
});
