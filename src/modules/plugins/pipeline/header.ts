import type { PluginHeader } from "@/db/plugins-schema";

// Reads WordPress plugin metadata as text, the way WordPress' get_file_data()
// does — the PHP is never executed. readme.txt adds "Tested up to" and the
// changelog, which are not plugin-file headers.

const HEADER_FIELDS: [keyof PluginHeader, string][] = [
  ["pluginName", "Plugin Name"],
  ["pluginUri", "Plugin URI"],
  ["version", "Version"],
  ["author", "Author"],
  ["authorUri", "Author URI"],
  ["textDomain", "Text Domain"],
  ["requiresAtLeast", "Requires at least"],
  ["requiresPhp", "Requires PHP"],
  ["license", "License"],
  ["requiresPlugins", "Requires Plugins"],
];

function field(text: string, name: string): string {
  const re = new RegExp(`^(?:[ \\t]*<\\?php)?[ \\t/*#@]*${name.replace(/ /g, "[ \\t]*")}:(.*)$`, "mi");
  const m = re.exec(text);
  if (!m) return "";
  return m[1]
    .replace(/\s*(?:\*\/|\?>).*/, "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, 300);
}

/** Header of a plugin's main PHP file (first 8 KB, as WordPress reads it). */
export function parsePluginHeader(source: string): PluginHeader {
  const text = source.slice(0, 8192).replace(/\r\n?/g, "\n");
  const out: PluginHeader = {};
  for (const [key, name] of HEADER_FIELDS) {
    const v = field(text, name);
    if (v) (out as Record<string, string>)[key] = v;
  }
  return out;
}

export function isThemeStylesheet(source: string) {
  return Boolean(field(source.slice(0, 8192).replace(/\r\n?/g, "\n"), "Theme Name"));
}

export type Readme = { stableTag: string; testedUpTo: string; requiresAtLeast: string; requiresPhp: string; changelog: Record<string, string> };

/** readme.txt: header fields and the changelog per version (plain text, capped). */
export function parseReadme(source: string): Readme {
  const text = source.slice(0, 400_000).replace(/\r\n?/g, "\n");
  const head = text.split(/\n==\s*[^=]+==/)[0] ?? "";
  const get = (name: string) => {
    const m = new RegExp(`^[ \\t*]*${name}:[ \\t]*(.+)$`, "mi").exec(head);
    return m ? m[1].trim().slice(0, 50) : "";
  };
  const changelog: Record<string, string> = {};
  const section = /\n==\s*changelog\s*==\s*\n([\s\S]*?)(?=\n==\s*[^=\n]+\s*==|$)/i.exec(text);
  if (section) {
    const parts = `\n${section[1]}`.split(/\n\s*=+\s*(.+?)\s*=+\s*\n/);
    for (let i = 1; i < parts.length; i += 2) {
      const m = /v?(\d+(?:\.\d+){0,4}(?:[-.]?[a-z]+\d*)?)/i.exec(parts[i]);
      if (!m || changelog[m[1]]) continue;
      changelog[m[1]] = parts[i + 1]
        .replace(/<[^>]*>/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, 3000);
    }
  }
  return {
    stableTag: get("Stable tag"),
    testedUpTo: get("Tested up to"),
    requiresAtLeast: get("Requires at least"),
    requiresPhp: get("Requires PHP"),
    changelog,
  };
}
