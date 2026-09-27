"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { Icon } from "@/components/atoms/icon";
import { cx } from "@/lib/utils";

type Tab = { id: string; label: string; icon: string; panel: ReactNode };

/**
 * Tabs over server-rendered panels (arrow keys, Home and End move between
 * them). The active tab is mirrored in `?service=` so the address can be
 * shared; the page renders that tab first. The first tab is the default.
 */
export function PricingTabs({ tabs, initial, label }: { tabs: Tab[]; initial: string; label: string }) {
  const [active, setActive] = useState(initial);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function select(index: number, focus = false) {
    const tab = tabs[index];
    setActive(tab.id);
    if (focus) buttons.current[index]?.focus();
    const url = new URL(window.location.href);
    if (index === 0) url.searchParams.delete("service");
    else url.searchParams.set("service", tab.id);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = tabs.length - 1;
    // Right-to-left: the next tab sits to the left.
    const targets: Record<string, number> = {
      ArrowLeft: index === last ? 0 : index + 1,
      ArrowRight: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    select(targets[event.key], true);
  }

  return (
    <>
      <div className="relative z-10 -mt-8 flex justify-center px-4 lg:-mt-9">
        <div role="tablist" aria-label={label} className="flex max-w-full gap-1 rounded-full border border-line bg-white p-1.5 shadow-lg">
          {tabs.map((tab, i) => {
            const selected = tab.id === active;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  buttons.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={cx(
                  "inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-[15px] font-semibold whitespace-nowrap transition-colors sm:px-6 lg:h-12 lg:text-base",
                  selected ? "text-white shadow-brand [background:var(--gradient-brand)]" : "text-ink-2 hover:bg-soft hover:text-ink",
                )}
              >
                <Icon name={tab.icon} size={18} className="hidden sm:block" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} role="tabpanel" id={`panel-${tab.id}`} aria-labelledby={`tab-${tab.id}`} hidden={tab.id !== active}>
          {tab.panel}
        </div>
      ))}
    </>
  );
}
