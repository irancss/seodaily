"use client";

import { useEffect } from "react";

import { ctaTarget, placementOf, track } from "@/lib/analytics";

/** One delegated listener for the site's lead-intent clicks (tel: links, links to /contact and /pricing). */
export function AnalyticsListener() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      if (href.startsWith("tel:")) {
        track({ event: "phone_click", placement: placementOf(link) });
        return;
      }
      const target = ctaTarget(href, location.pathname);
      if (target) track({ event: "cta_click", placement: placementOf(link), target });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
