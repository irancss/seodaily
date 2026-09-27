"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Icon, SubmitButton } from "@/components/atoms";
import { toast } from "@/lib/toast";
import { cx } from "@/lib/utils";
import { resetMenus, saveMenus } from "@/modules/menus/actions";
import {
  MENU_LABEL_MAX,
  MENU_LOCATION_LABELS,
  MENU_LOCATIONS,
  MENU_MAX_DEPTH,
  MENU_MAX_ITEMS,
  type MenuItem,
  type MenuLocation,
  type Menus,
} from "@/modules/menus/types";

export type MenuSuggestion = { label: string; url: string };

/** Index path from the top level, e.g. [2, 0] = first child of the third item. */
type Path = number[];

const SUGGESTIONS_ID = "menu-url-suggestions";

const LOCATION_HINTS: Record<MenuLocation, string> = {
  desktop: "در نوار بالای سایت نمایش داده می‌شود؛ زیرمنوها با بردن نشانگر روی آیتم یا کلیک روی فلش باز می‌شوند.",
  mobile: "در منوی کشویی موبایل (که از سمت راست باز می‌شود) نمایش داده می‌شود؛ زیرمنوها آکاردئونی باز و بسته می‌شوند.",
};

// ---------------------------------------------------------------- tree helpers

function newId() {
  return `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function blankItem(): MenuItem {
  return { id: newId(), label: "", url: "", children: [] };
}

function countItems(items: MenuItem[]): number {
  return items.reduce((n, item) => n + 1 + countItems(item.children), 0);
}

/** Levels in an item's subtree, counting the item itself. */
function subtreeHeight(item: MenuItem): number {
  return 1 + Math.max(0, ...item.children.map(subtreeHeight));
}

function itemAt(items: MenuItem[], path: Path): MenuItem {
  let list = items;
  let item = list[path[0]];
  for (const i of path) {
    item = list[i];
    list = item.children;
  }
  return item;
}

/** Copy of the tree with the child list of the item at `parent` ([] = top level) replaced. */
function withList(items: MenuItem[], parent: Path, fn: (list: MenuItem[]) => MenuItem[]): MenuItem[] {
  if (parent.length === 0) return fn(items);
  const [head, ...rest] = parent;
  return items.map((item, i) => (i === head ? { ...item, children: withList(item.children, rest, fn) } : item));
}

function freshIds(items: MenuItem[]): MenuItem[] {
  return items.map((item) => ({ ...item, id: newId(), children: freshIds(item.children) }));
}

const ops = {
  update(items: MenuItem[], path: Path, patch: Partial<MenuItem>) {
    const index = path[path.length - 1];
    return withList(items, path.slice(0, -1), (list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  },
  remove(items: MenuItem[], path: Path) {
    const index = path[path.length - 1];
    return withList(items, path.slice(0, -1), (list) => list.filter((_, i) => i !== index));
  },
  move(items: MenuItem[], path: Path, step: -1 | 1) {
    const index = path[path.length - 1];
    return withList(items, path.slice(0, -1), (list) => {
      const target = index + step;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  },
  addChild(items: MenuItem[], path: Path, child: MenuItem) {
    const parent = itemAt(items, path);
    return ops.update(items, path, { children: [...parent.children, child] });
  },
  /** Makes the item the last child of the sibling above it. */
  indent(items: MenuItem[], path: Path) {
    const index = path[path.length - 1];
    if (index === 0) return items;
    const item = itemAt(items, path);
    return withList(items, path.slice(0, -1), (list) => {
      const next = list.filter((_, i) => i !== index);
      next[index - 1] = { ...list[index - 1], children: [...list[index - 1].children, item] };
      return next;
    });
  },
  /** Moves the item out of its parent, right after the parent. */
  outdent(items: MenuItem[], path: Path) {
    if (path.length < 2) return items;
    const item = itemAt(items, path);
    const parentPath = path.slice(0, -1);
    const parentIndex = parentPath[parentPath.length - 1];
    const without = ops.remove(items, path);
    return withList(without, parentPath.slice(0, -1), (list) => [
      ...list.slice(0, parentIndex + 1),
      item,
      ...list.slice(parentIndex + 1),
    ]);
  },
};

/** Items that cannot be saved as they are, keyed by id. */
function findProblems(items: MenuItem[]) {
  const problems = new Map<string, string>();
  const walk = (list: MenuItem[]) => {
    for (const item of list) {
      if (!item.label.trim()) problems.set(item.id, "عنوان این آیتم را وارد کنید.");
      else if (!item.url.trim() && item.children.length === 0)
        problems.set(item.id, "لینک را وارد کنید، یا برای این آیتم زیرمنو بسازید.");
      walk(item.children);
    }
  };
  walk(items);
  return problems;
}

// ---------------------------------------------------------------- UI

function ToolButton({
  icon,
  label,
  onClick,
  disabled,
  danger,
  iconClassName,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  iconClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cx(
        "flex size-9 items-center justify-center rounded-md border border-line bg-white transition-colors disabled:cursor-not-allowed disabled:opacity-35",
        danger ? "text-error hover:bg-error-bg" : "text-ink-2 hover:bg-soft hover:text-brand",
      )}
    >
      <Icon name={icon} size={17} className={iconClassName} />
    </button>
  );
}

type NodeActions = {
  change: (path: Path, patch: Partial<MenuItem>) => void;
  move: (path: Path, step: -1 | 1) => void;
  indent: (path: Path) => void;
  outdent: (path: Path) => void;
  addChild: (path: Path) => void;
  remove: (path: Path) => void;
};

function MenuNode({
  item,
  path,
  siblings,
  canNest,
  problems,
  showProblems,
  suggestions,
  actions,
}: {
  item: MenuItem;
  path: Path;
  siblings: number;
  canNest: boolean;
  problems: Map<string, string>;
  showProblems: boolean;
  suggestions: MenuSuggestion[];
  actions: NodeActions;
}) {
  const depth = path.length;
  const index = path[depth - 1];
  const position = path.map((i) => i + 1).join(".");
  const problem = showProblems ? problems.get(item.id) : undefined;
  const name = item.label.trim() || `آیتم ${position}`;
  const canIndent = index > 0 && depth + subtreeHeight(item) <= MENU_MAX_DEPTH;

  return (
    <li className={cx("rounded-xl border bg-white", problem ? "border-error/50" : "border-line")}>
      <div className="flex flex-col gap-3 p-3 sm:p-4 xl:flex-row xl:items-start">
        <div className="grid min-w-0 grow gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <input
            id={`menu-label-${item.id}`}
            type="text"
            value={item.label}
            maxLength={MENU_LABEL_MAX}
            placeholder="عنوان (مثلاً طراحی سایت)"
            aria-label={`عنوان ${name}`}
            aria-invalid={problem && !item.label.trim() ? true : undefined}
            onChange={(e) => actions.change(path, { label: e.target.value })}
            className="field"
          />
          <input
            type="text"
            dir="ltr"
            value={item.url}
            list={SUGGESTIONS_ID}
            placeholder={item.children.length ? "بدون لینک: فقط زیرمنو باز شود" : "/web-design یا https://…"}
            aria-label={`لینک ${name}`}
            aria-invalid={problem && item.label.trim() ? true : undefined}
            onChange={(e) => {
              const url = e.target.value;
              const match = suggestions.find((s) => s.url === url);
              actions.change(path, { url, ...(match && !item.label.trim() ? { label: match.label } : {}) });
            }}
            className="field text-left"
          />
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-2 md:col-span-2">
            <input
              type="checkbox"
              checked={Boolean(item.newTab)}
              onChange={(e) => actions.change(path, { newTab: e.target.checked || undefined })}
              className="size-[18px] accent-brand"
            />
            باز شدن در تب جدید
            <span className="text-xs text-muted">(برای لینک‌های خارج از سایت)</span>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 xl:mt-1.5 xl:flex-nowrap">
          <span className="me-1 rounded-full bg-soft px-2.5 py-0.5 text-xs leading-[1.8] font-medium text-brand-hover">
            سطح {depth}
          </span>
          <ToolButton icon="arrow-up" label="انتقال به بالا" onClick={() => actions.move(path, -1)} disabled={index === 0} />
          <ToolButton
            icon="arrow-down"
            label="انتقال به پایین"
            onClick={() => actions.move(path, 1)}
            disabled={index === siblings - 1}
          />
          <ToolButton
            icon="outdent"
            label="یک سطح بالاتر (خروج از زیرمنو)"
            onClick={() => actions.outdent(path)}
            disabled={depth === 1}
            iconClassName="-scale-x-100"
          />
          <ToolButton
            icon="indent"
            label="زیرمنوی آیتم بالایی شود"
            onClick={() => actions.indent(path)}
            disabled={!canIndent}
            iconClassName="-scale-x-100"
          />
          <ToolButton icon="plus" label="افزودن زیرمنو" onClick={() => actions.addChild(path)} disabled={!canNest || depth >= MENU_MAX_DEPTH} />
          <ToolButton icon="trash" label="حذف" danger onClick={() => actions.remove(path)} />
        </div>
      </div>
      {problem && (
        <p role="alert" className="flex items-center gap-1.5 px-4 pb-3 text-sm leading-[1.8] text-error">
          <Icon name="alert" size={16} />
          {problem}
        </p>
      )}
      {item.children.length > 0 && (
        <ol className="ms-3 me-3 mb-3 flex flex-col gap-2 border-s-2 border-soft ps-3 sm:ms-5 sm:ps-4">
          {item.children.map((child, i) => (
            <MenuNode
              key={child.id}
              item={child}
              path={[...path, i]}
              siblings={item.children.length}
              canNest={canNest}
              problems={problems}
              showProblems={showProblems}
              suggestions={suggestions}
              actions={actions}
            />
          ))}
        </ol>
      )}
    </li>
  );
}

/**
 * Tree editor for the desktop and mobile menus. Items can be nested up to
 * MENU_MAX_DEPTH levels; both trees are posted as JSON to `saveMenus`, which
 * validates them again on the server.
 */
export function MenuEditor({ initial, suggestions }: { initial: Menus; suggestions: MenuSuggestion[] }) {
  const [menus, setMenus] = useState<Menus>(initial);
  const [tab, setTab] = useState<MenuLocation>("desktop");
  const [showProblems, setShowProblems] = useState(false);
  const pendingFocus = useRef<string | null>(null);

  const dirty = useMemo(() => JSON.stringify(menus) !== JSON.stringify(initial), [menus, initial]);
  const problems = useMemo(
    () => ({ desktop: findProblems(menus.desktop), mobile: findProblems(menus.mobile) }),
    [menus],
  );
  const items = menus[tab];
  const total = countItems(items);
  const full = total >= MENU_MAX_ITEMS;
  const other: MenuLocation = tab === "desktop" ? "mobile" : "desktop";

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Put the cursor in the label of an item that was just added.
  useEffect(() => {
    if (!pendingFocus.current) return;
    document.getElementById(`menu-label-${pendingFocus.current}`)?.focus();
    pendingFocus.current = null;
  });

  const edit = (fn: (list: MenuItem[]) => MenuItem[]) => setMenus((current) => ({ ...current, [tab]: fn(current[tab]) }));

  const actions: NodeActions = {
    change: (path, patch) => edit((list) => ops.update(list, path, patch)),
    move: (path, step) => edit((list) => ops.move(list, path, step)),
    indent: (path) => edit((list) => ops.indent(list, path)),
    outdent: (path) => edit((list) => ops.outdent(list, path)),
    addChild: (path) => {
      const child = blankItem();
      pendingFocus.current = child.id;
      edit((list) => ops.addChild(list, path, child));
    },
    remove: (path) => {
      const item = itemAt(items, path);
      const sub = countItems(item.children);
      const name = item.label.trim() || "این آیتم";
      if (sub > 0 && !window.confirm(`«${name}» و ${sub.toLocaleString("fa-IR")} زیرمنوی آن حذف شوند؟`)) return;
      edit((list) => ops.remove(list, path));
    },
  };

  function addTopLevel() {
    const item = blankItem();
    pendingFocus.current = item.id;
    edit((list) => [...list, item]);
  }

  function copyFromOther() {
    const source = menus[other];
    if (!window.confirm(`${MENU_LOCATION_LABELS[tab]} با یک کپی از ${MENU_LOCATION_LABELS[other]} جایگزین شود؟`)) return;
    edit(() => freshIds(source));
    toast.info(`${MENU_LOCATION_LABELS[other]} کپی شد؛ برای اعمال، ذخیره کنید.`);
  }

  return (
    <div className="flex flex-col gap-5">
      <datalist id={SUGGESTIONS_ID}>
        {suggestions.map((s) => (
          <option key={s.url} value={s.url} label={s.label} />
        ))}
      </datalist>

      <div className="flex flex-col gap-4 rounded-xl border border-line bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" aria-label="نوع منو" className="inline-flex self-start rounded-full border border-line bg-page p-1">
            {MENU_LOCATIONS.map((location) => (
              <button
                key={location}
                id={`menu-tab-${location}`}
                type="button"
                role="tab"
                aria-selected={tab === location}
                aria-controls="menu-panel"
                onClick={() => setTab(location)}
                className={cx(
                  "flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors",
                  tab === location ? "bg-white text-brand shadow-sm" : "text-ink-2 hover:text-ink",
                )}
              >
                <Icon name={location === "desktop" ? "desktop" : "mobile"} size={17} />
                {MENU_LOCATION_LABELS[location]}
                <span className="rounded-full bg-soft px-2 text-xs leading-[1.8] text-brand-hover">
                  {countItems(menus[location]).toLocaleString("fa-IR")}
                </span>
                {showProblems && problems[location].size > 0 && (
                  <span className="size-2 rounded-full bg-error" aria-label="نیاز به اصلاح" />
                )}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copyFromOther} className="btn btn-secondary h-10 px-4 text-sm">
              <Icon name="copy" size={16} />
              کپی از {MENU_LOCATION_LABELS[other]}
            </button>
            <button type="button" onClick={addTopLevel} disabled={full} className="btn btn-primary h-10 px-4 text-sm">
              <Icon name="plus" size={16} />
              افزودن آیتم
            </button>
          </div>
        </div>
        <p className="text-sm leading-[1.9] text-muted">
          {LOCATION_HINTS[tab]} هر آیتم می‌تواند تا {(MENU_MAX_DEPTH - 1).toLocaleString("fa-IR")} سطح زیرمنو داشته باشد؛
          آیتمی که زیرمنو دارد می‌تواند بدون لینک باشد. ({total.toLocaleString("fa-IR")} از{" "}
          {MENU_MAX_ITEMS.toLocaleString("fa-IR")} آیتم)
        </p>
      </div>

      <div id="menu-panel" role="tabpanel" aria-labelledby={`menu-tab-${tab}`}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong bg-white px-6 py-12 text-center">
            <Icon name="menu" size={28} className="text-muted" />
            <p className="font-semibold">{MENU_LOCATION_LABELS[tab]} خالی است</p>
            <p className="max-w-md text-sm leading-[1.9] text-muted">
              با منوی خالی هیچ لینکی در این بخش سایت نمایش داده نمی‌شود. آیتم اضافه کنید یا منوی دیگر را کپی کنید.
            </p>
            <button type="button" onClick={addTopLevel} className="btn btn-primary mt-2 h-10 px-4 text-sm">
              <Icon name="plus" size={16} />
              افزودن آیتم
            </button>
          </div>
        ) : (
          <ol className="flex flex-col gap-3">
            {items.map((item, i) => (
              <MenuNode
                key={item.id}
                item={item}
                path={[i]}
                siblings={items.length}
                canNest={!full}
                problems={problems[tab]}
                showProblems={showProblems}
                suggestions={suggestions}
                actions={actions}
              />
            ))}
          </ol>
        )}
      </div>

      <div className="sticky bottom-0 z-10 -mx-1 flex flex-col gap-3 rounded-xl border border-line bg-white/95 p-4 shadow-md backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <form
          action={saveMenus}
          onSubmit={(event) => {
            const bad = problems.desktop.size + problems.mobile.size;
            if (bad === 0) return;
            event.preventDefault();
            setShowProblems(true);
            if (problems[tab].size === 0) setTab(other);
            toast.error(`${bad.toLocaleString("fa-IR")} آیتم نیاز به اصلاح دارد؛ موارد قرمزشده را کامل کنید.`);
          }}
          className="flex flex-wrap items-center gap-3"
        >
          <input type="hidden" name="desktop" value={JSON.stringify(menus.desktop)} />
          <input type="hidden" name="mobile" value={JSON.stringify(menus.mobile)} />
          <SubmitButton>ذخیره منوها</SubmitButton>
          <span className={cx("text-sm", dirty ? "font-medium text-warning" : "text-muted")}>
            {dirty ? "تغییرات ذخیره‌نشده دارید." : "همه تغییرات ذخیره شده است."}
          </span>
        </form>
        <form action={resetMenus}>
          <button
            type="submit"
            onClick={(event) => {
              if (!window.confirm("هر دو منو به حالت پیش‌فرض برگردند؟ تغییرات فعلی از بین می‌رود.")) event.preventDefault();
            }}
            className="btn h-10 px-3 text-sm text-ink-2 hover:bg-page hover:text-ink"
          >
            <Icon name="refresh" size={16} />
            بازگشت به منوی پیش‌فرض
          </button>
        </form>
      </div>
    </div>
  );
}
