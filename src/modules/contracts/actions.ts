"use server";

import { failed, saved, str } from "@/lib/form-actions";
import { requireAdmin } from "@/modules/auth/session";
import { isPricingService } from "@/modules/pricing/types";
import { writeSetting } from "@/modules/settings/queries";

import { CONTRACTS_SETTING_KEY, readStoredContracts } from "./queries";
import { TEMPLATE_MAX } from "./types";

const PATH = "/admin/contracts";

export async function saveContractCompany(form: FormData) {
  await requireAdmin();
  const stored = await readStoredContracts();
  await writeSetting(CONTRACTS_SETTING_KEY, {
    ...stored,
    company: {
      name: str(form, "name", 160),
      address: str(form, "address", 400),
      phone: str(form, "phone", 60),
      signatory: str(form, "signatory", 120),
      signatoryTitle: str(form, "signatoryTitle", 120),
      nationalId: str(form, "nationalId", 40),
      registrationNo: str(form, "registrationNo", 40),
    },
  });
  saved(PATH, "اطلاعات مجری ذخیره شد.");
}

export async function saveContractTemplate(form: FormData) {
  await requireAdmin();
  const service = str(form, "service");
  if (!isPricingService(service)) failed(PATH, "خدمت نامعتبر است.");
  const back = `${PATH}?service=${service}`;
  const template = str(form, "template", TEMPLATE_MAX + 1);
  if (template.length > TEMPLATE_MAX) failed(back, "متن قرارداد بیش از حد طولانی است.");

  const stored = await readStoredContracts();
  // An emptied template falls back to the sample text.
  await writeSetting(CONTRACTS_SETTING_KEY, { ...stored, templates: { ...stored.templates, [service]: template } });
  saved(back, template ? "قالب قرارداد ذخیره شد." : "قالب به متن نمونه برگشت.");
}

export async function resetContractTemplate(form: FormData) {
  await requireAdmin();
  const service = str(form, "service");
  if (!isPricingService(service)) failed(PATH, "خدمت نامعتبر است.");
  const stored = await readStoredContracts();
  const templates = { ...stored.templates };
  delete templates[service];
  await writeSetting(CONTRACTS_SETTING_KEY, { ...stored, templates });
  saved(`${PATH}?service=${service}`, "قالب به متن نمونه برگشت.");
}
