"use client";

import { useEffect } from "react";

const MESSAGE = "تغییرات ذخیره‌نشده دارید. بدون ذخیره از این صفحه خارج شوید؟";

/**
 * Warns before leaving a panel page with unsaved edits: typing in any save
 * form (POST) marks the page as changed; submitting clears it. Covers closing
 * or reloading the tab and clicks on links inside the panel.
 */
export function UnsavedChangesGuard() {
  useEffect(() => {
    let dirty = false;
    const isSaveForm = (target: EventTarget | null) =>
      target instanceof Element && target.closest("form")?.getAttribute("method")?.toUpperCase() === "POST";

    const onEdit = (event: Event) => {
      if (isSaveForm(event.target)) dirty = true;
    };
    const onSubmit = () => {
      dirty = false;
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const onClick = (event: MouseEvent) => {
      if (!dirty || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link || link.getAttribute("target") === "_blank" || link.getAttribute("href")?.startsWith("#")) return;
      if (window.confirm(MESSAGE)) dirty = false;
      else {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("input", onEdit, true);
    document.addEventListener("change", onEdit, true);
    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("input", onEdit, true);
      document.removeEventListener("change", onEdit, true);
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);
  return null;
}
