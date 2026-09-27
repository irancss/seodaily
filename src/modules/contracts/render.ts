// Turns a contract template into printable blocks for one lead. Pure: the
// output is plain text for React to render (and escape), never HTML.

import type { EstimateItem, Lead } from "@/db/schema";
import { SERVICE_CHOICE_LABELS } from "@/modules/leads/constants";
import { formatPrice } from "@/modules/pricing/format";
import { isPricingService, PRICING_SERVICE_LABELS, pricingServiceFor, type PricingService } from "@/modules/pricing/types";

import type { BlockPlaceholder, ContractSettings, TextPlaceholder } from "./types";
import { tomanInWords } from "./words";

/** Printed where a value is missing, so it can be filled in by hand. */
export const BLANK = "…………………";

export type ContractBlock =
  | { type: "title" | "heading" | "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: BlockPlaceholder };

export type ContractValues = Record<TextPlaceholder, string>;

const TOKEN = /\{\{\s*([a-z_]+)\s*\}\}/g;
const BLOCK_SPLIT = /(\{\{\s*(?:items_table|signatures)\s*\}\})/;
const BLOCK_TOKEN = /^\{\{\s*(items_table|signatures)\s*\}\}$/;

/** Unknown placeholders are left as typed, so a misspelt one is easy to spot. */
export function fillPlaceholders(text: string, values: ContractValues) {
  return text.replace(TOKEN, (match, key: string) => (Object.hasOwn(values, key) ? values[key as TextPlaceholder] : match));
}

/**
 * Template syntax: «# » title, «## » heading, «- » list item, a blank line
 * ends a paragraph; {{items_table}} and {{signatures}} become blocks.
 */
export function parseContract(template: string, values: ContractValues): ContractBlock[] {
  const blocks: ContractBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  const fill = (text: string) => fillPlaceholders(text, values);

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", text: fill(paragraph.join("\n")) });
    paragraph = [];
  };
  const flushList = () => {
    if (list.length) blocks.push({ type: "list", items: list.map(fill) });
    list = [];
  };

  for (const rawLine of template.replace(/\r\n?/g, "\n").split("\n")) {
    for (const part of rawLine.split(BLOCK_SPLIT)) {
      const token = part.match(BLOCK_TOKEN);
      const line = part.trim();
      if (token || !line) {
        flushParagraph();
        flushList();
        if (token) blocks.push({ type: token[1] as BlockPlaceholder });
        continue;
      }
      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      const item = line.match(/^[-•*]\s+(.+)$/);
      if (heading) {
        flushParagraph();
        flushList();
        blocks.push({ type: heading[1].length === 1 ? "title" : "heading", text: fill(heading[2]) });
      } else if (item) {
        flushParagraph();
        list.push(item[1]);
      } else {
        flushList();
        paragraph.push(line);
      }
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

const dateFormat = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Tehran",
});
const plainNumber = new Intl.NumberFormat("fa-IR", { useGrouping: false });

/** Keeps a phone number left-to-right inside Persian text. */
function ltr(value: string) {
  return value ? `⁦${value}⁩` : "";
}

export type LeadContract = {
  /** Which service's template was used. */
  service: PricingService;
  blocks: ContractBlock[];
  items: EstimateItem[];
  total: number;
  values: ContractValues;
};

/**
 * The contract of a lead. The template follows `template` when given, else
 * the lead's estimate, else its service choice (combined and unsure choices
 * use the web design template).
 */
export function buildLeadContract(lead: Lead, settings: ContractSettings, { template, now = new Date() }: { template?: string; now?: Date } = {}): LeadContract {
  const service = isPricingService(template) ? template : (lead.estimate?.service ?? pricingServiceFor(lead.service));
  const ownChoice = lead.service !== "not-sure" && pricingServiceFor(lead.service) === service;
  const items = lead.estimate?.items ?? [];
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const year = dateFormat.formatToParts(now).find((p) => p.type === "year")?.value ?? "";
  const c = settings.company;

  const values: ContractValues = {
    contract_no: `${year}-${plainNumber.format(lead.id)}`,
    date: dateFormat.format(now),
    company_name: c.name || BLANK,
    company_address: c.address || BLANK,
    company_phone: ltr(c.phone) || BLANK,
    company_national_id: c.nationalId || BLANK,
    company_registration_no: c.registrationNo || BLANK,
    signatory: c.signatory || BLANK,
    signatory_title: c.signatoryTitle || BLANK,
    client_name: lead.name || BLANK,
    client_phone: ltr(lead.phone) || BLANK,
    client_business: lead.business || BLANK,
    service: ownChoice ? (SERVICE_CHOICE_LABELS[lead.service] ?? PRICING_SERVICE_LABELS[service]) : PRICING_SERVICE_LABELS[service],
    total: total > 0 ? formatPrice(total) : `${BLANK} تومان`,
    total_words: total > 0 ? tomanInWords(total) : BLANK,
  };

  return { service, blocks: parseContract(settings.templates[service], values), items, total, values };
}
