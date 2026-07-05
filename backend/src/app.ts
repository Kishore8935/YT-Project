import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./docs/openapi";
import { prisma } from "./lib/db";
import { authRouter } from "./routes/auth";
import { videoRouter } from "./routes/videos";
import { commentRouter } from "./routes/comments";
import { likeRouter } from "./routes/likes";
import { subscriptionRouter } from "./routes/subscriptions";
import { channelRouter } from "./routes/channels";
import { errorHandler } from "./middleware/error";

const app = express();

// Interactive API docs. Mounted before helmet so its inline assets aren't
// blocked by the Content-Security-Policy, and before the rate limiter.
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, {
    customSiteTitle: "StreamHub API Docs",
}));

// Security headers (CSP, X-Frame-Options, etc.) — one line, 15 protections.
app.use(helmet());

// Structured JSON request logging: method, url, status, response time.
// Disabled under tests to keep the test output readable.
app.use(pinoHttp({ enabled: process.env.NODE_ENV !== "test" }));

app.use(cors());
app.use(express.json());

// Strict limit on auth routes — stops brute-force and credential stuffing.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { message: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Looser limit for general API reads.
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { message: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use("/api/signup", authLimiter);
app.use("/api/signin", authLimiter);
app.use("/api", apiLimiter);

// Health check — deploy platforms ping this to confirm the container is alive.
app.get("/health", async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
});

app.use("/api", authRouter);
app.use("/api", videoRouter);
app.use("/api", commentRouter);
app.use("/api", likeRouter);
app.use("/api", subscriptionRouter);
app.use("/api", channelRouter);

// Must be last — Express identifies error handlers by their 4-parameter signature.
app.use(errorHandler);

export default app;
