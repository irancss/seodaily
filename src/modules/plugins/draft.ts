import type { PluginInput } from "./catalog";
import type { MetaField } from "./labels";
import { META_FIELDS } from "./labels";

/** Editorial snapshot. Public columns change atomically at publication. */
export type PluginDraft = Omit<PluginInput, "content" | "meta"> & Record<MetaField, string> & {
  manualFields: string[];
  iconSource: string;
};

/** Sources can fill automatic fields while an editorial draft is open. */
export function editorialSnapshot<T extends { draftData: PluginDraft | null; iconUrl: string; iconSource: string } & Record<MetaField, string>>(current: T) {
  const draft = current.draftData;
  return {
    ...current, ...draft,
    ...Object.fromEntries(META_FIELDS.filter((k) => draft && !draft.manualFields.includes(k)).map((k) => [k, current[k]])),
    ...(!draft?.iconUrl && current.iconSource === "auto" ? { iconUrl: current.iconUrl, iconSource: current.iconSource } : {}),
  };
}
