# Backend API image — Bun + Express + Prisma.
FROM oven/bun:1

WORKDIR /app

# Install dependencies first (cached layer while source changes).
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy the rest of the source.
COPY . .

# Generate the Prisma client (generated/ is gitignored, so it must be built here).
RUN bun --bun prisma generate

# The app reads PORT at runtime; document the default.
EXPOSE 3000

# Apply any pending migrations, then start the server.
CMD ["sh", "-c", "bun --bun prisma migrate deploy && bun run start"]
