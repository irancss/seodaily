import "server-only";

import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { cached } from "@/lib/cache";

import { defaultServicePricing } from "./defaults";
import { normalizeServicePricing } from "./normalize";
import { PRICING_SERVICES, type PricingConfig, type PricingService } from "./types";

export const PRICING_SETTING_KEY = "pricing";

/** The stored value as saved; a service that was never saved (or was reset) is missing. */
export async function readStoredPricing(): Promise<Partial<Record<PricingService, unknown>>> {
  const row = await db.query.settings.findFirst({ where: eq(schema.settings.key, PRICING_SETTING_KEY) });
  const value = row?.value;
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Partial<Record<PricingService, unknown>>) : {};
}

/** Plans and calculator of every service; one that was never saved uses the default structure. */
export const getPricing = cached(async (): Promise<PricingConfig> => {
  const stored = await readStoredPricing();
  const config = {} as PricingConfig;
  for (const service of PRICING_SERVICES) {
    config[service] = stored[service] === undefined ? defaultServicePricing(service) : normalizeServicePricing(stored[service]);
  }
  return config;
}, "pricing");
