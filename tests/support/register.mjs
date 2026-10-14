// Lets `node --test` load the app's TypeScript modules directly, with no new
// dependency: Node 22.18+ strips TypeScript types itself, and this hook adds
// the two things the Next.js bundler normally provides - the `@/` path alias
// from tsconfig.json and extensionless imports of `.ts` files.
import { register } from "node:module";

register("./resolve-hook.mjs", import.meta.url);
