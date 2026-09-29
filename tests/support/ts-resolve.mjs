// Lets the Node test runner import the app's TypeScript modules directly:
// "@/x" → src/x, and extensionless relative imports → .ts/.tsx/index.ts.
// Node strips the types itself (no build step, no dependencies).
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = fileURLToPath(new URL("../../src/", import.meta.url));

export async function resolve(specifier, context, next) {
  // Next's CommonJS subpath entry points have no ESM extension mapping.
  if (["next/cache", "next/headers", "next/navigation"].includes(specifier)) return next(`${specifier}.js`, context);
  let target = null;
  if (specifier.startsWith("@/")) target = SRC + specifier.slice(2);
  else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.includes("/src/")) {
    target = fileURLToPath(new URL(specifier, context.parentURL));
  }
  if (target && !/\.[cm]?[jt]sx?$/.test(target)) {
    const found = [".ts", ".tsx", "/index.ts"].map((ext) => target + ext).find(existsSync);
    if (found) return next(pathToFileURL(found).href, context);
  }
  if (target) return next(pathToFileURL(target).href, context);
  return next(specifier, context);
}
