import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * Resolves `@/x` against the repository root and `./x` to `./x.ts`. `next/server`
 * and `next/navigation` become `next/server.js` and `next/navigation.js`: the
 * `next` package has no exports map, so Node's ESM resolver needs the file name
 * the bundler would have found.
 */
export async function resolve(specifier, context, next) {
  if (specifier === "next/server" || specifier === "next/navigation") return next(`${specifier}.js`, context);
  let base = null;
  if (specifier.startsWith("@/")) {
    base = path.join(root, specifier.slice(2));
  } else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.endsWith(".ts")) {
    base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
  }

  if (base && !path.extname(base)) {
    for (const candidate of [`${base}.ts`, path.join(base, "index.ts")]) {
      if (existsSync(candidate)) return next(pathToFileURL(candidate).href, context);
    }
  }
  if (base) return next(pathToFileURL(base).href, context);
  return next(specifier, context);
}

/**
 * Marks the app's own `.ts` files as TypeScript ES modules. Without this Node
 * guesses the format of each one and prints a warning per file.
 */
export async function load(url, context, next) {
  if (url.endsWith(".ts") && !url.includes("/node_modules/")) {
    return next(url, { ...context, format: "module-typescript" });
  }
  return next(url, context);
}
