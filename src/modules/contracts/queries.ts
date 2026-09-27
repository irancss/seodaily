import "server-only";

import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { cached } from "@/lib/cache";
import { PRICING_SERVICES, type PricingService } from "@/modules/pricing/types";

import { DEFAULT_COMPANY, DEFAULT_TEMPLATES } from "./defaults";
import type { ContractCompany, ContractSettings } from "./types";

export const CONTRACTS_SETTING_KEY = "contracts";

export type StoredContracts = {
  company?: Partial<ContractCompany>;
  templates?: Partial<Record<PricingService, string>>;
};

/** The stored value as saved (uncached, for the actions that update part of it). */
export async function readStoredContracts(): Promise<StoredContracts> {
  const row = await db.query.settings.findFirst({ where: eq(schema.settings.key, CONTRACTS_SETTING_KEY) });
  const value = row?.value;
  return value && typeof value === "object" && !Array.isArray(value) ? (value as StoredContracts) : {};
}

/** Company details and one template per service; an empty template uses the sample text. */
export const getContractSettings = cached(async (): Promise<ContractSettings> => {
  const stored = await readStoredContracts();
  const company = { ...DEFAULT_COMPANY };
  for (const key of Object.keys(DEFAULT_COMPANY) as (keyof ContractCompany)[]) {
    const value = stored.company?.[key];
    if (typeof value === "string") company[key] = value;
  }
  const templates = {} as ContractSettings["templates"];
  const customized = {} as ContractSettings["customized"];
  for (const service of PRICING_SERVICES) {
    const text = stored.templates?.[service];
    customized[service] = typeof text === "string" && text.trim() !== "";
    templates[service] = customized[service] ? (text as string) : DEFAULT_TEMPLATES[service];
  }
  return { company, templates, customized };
}, "contracts");
