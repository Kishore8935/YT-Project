// Single source of truth for the backend API base URL.
//
// In production, set BUN_PUBLIC_API_URL in the deploy environment — Bun inlines
// any BUN_PUBLIC_* var into the browser bundle at build time (e.g.
// https://your-api.onrender.com). In local dev the var is usually unset, so we
// guard `process` (which doesn't exist in the browser) and fall back to localhost.
const fromEnv =
    typeof process !== "undefined" ? process.env.BUN_PUBLIC_API_URL : undefined;

export const API_URL = fromEnv || "http://localhost:3000";
