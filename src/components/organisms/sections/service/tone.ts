/**
 * Background of a light section. The template alternates them in the order the
 * sections actually render, so two neighbours never share a colour.
 */
export type SectionTone = "white" | "page";

export function toneClass(tone: SectionTone = "white") {
  return tone === "white" ? "bg-white" : undefined;
}
