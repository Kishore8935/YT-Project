# Frontend image — Bun serves the React SPA (bundles on the fly, SPA fallback via /* route).
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Bun.serve honors the PORT env var (injected by the host); 3000 by default.
EXPOSE 3000

# NODE_ENV=production is set inside the start script.
# BUN_PUBLIC_API_URL must be provided as an env var (inlined into the bundle).
CMD ["bun", "run", "start"]
