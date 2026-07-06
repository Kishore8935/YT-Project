// Single source of truth for the backend API base URL.
//
// Bun inlines any BUN_PUBLIC_* var into the browser bundle at build time by
// statically replacing `process.env.BUN_PUBLIC_API_URL` with the literal value.
// - Production (Render): BUN_PUBLIC_API_URL is set in the service env.
// - Local dev: the `dev` script in package.json sets it to http://localhost:3000.
//
// Because the var is always set in both environments, Bun always replaces the
// reference with a string literal — no bare `process` access survives into the
// browser (which would throw). The `|| localhost` is just a last-resort default.
export const API_URL = process.env.BUN_PUBLIC_API_URL || "http://localhost:3000";
