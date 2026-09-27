import "server-only";

import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { cached } from "@/lib/cache";

import { defaultMenus } from "./defaults";
import { normalizeMenu } from "./normalize";
import type { Menus } from "./types";

export const MENUS_SETTING_KEY = "menus";

/** Both menus; a location that was never saved (or is invalid) uses the default. */
export const getMenus = cached(async (): Promise<Menus> => {
  const row = await db.query.settings.findFirst({ where: eq(schema.settings.key, MENUS_SETTING_KEY) });
  const stored = (row?.value ?? {}) as Partial<Record<keyof Menus, unknown>>;
  const defaults = defaultMenus();
  const desktop = stored.desktop === undefined ? defaults.desktop : normalizeMenu(stored.desktop);
  const mobile = stored.mobile === undefined ? defaults.mobile : normalizeMenu(stored.mobile);
  return { desktop, mobile };
}, "menus");
