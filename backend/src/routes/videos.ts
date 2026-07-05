import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "../lib/db";
import { createPresignedUploadUrl } from "../lib/r2";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

export const videoRouter = Router();

const uploadSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    videoUrl: z.url(),
    thumbnail: z.url(),
});

const uploadUrlSchema = z.object({
    fileName: z.string().min(1),
    contentType: z.string().min(1),
    kind: z.enum(["video", "thumbnail"]),
});

const channelSelect = {
    id: true,
    channelName: true,
    profilePicture: true,
    subscriberCount: true,
} as const;

// List videos — supports ?search= and cursor-based pagination (?cursor=&limit=)
videoRouter.get("/videos", asyncHandler(async (req, res) => {
    const search = req.query["search"] as string | undefined;
    const limit = Math.min(Number(req.query["limit"]) || 20, 50);
    const cursor = req.query["cursor"] as string | undefined;

    const videos = await prisma.uploads.findMany({
        where: search
            ? { title: { contains: search, mode: "insensitive" } }
            : undefined,
        include: { user: { select: channelSelect } },
        orderBy: { createdAt: "desc" },
        take: limit,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const nextCursor = videos.length === limit ? videos[videos.length - 1]?.id : null;
    res.json({ videos, nextCursor });
}));

// Get a single video with like counts
videoRouter.get("/videos/:id", asyncHandler(async (req, res) => {
    const id = req.params["id"] as string;

    const [video, likes, dislikes] = await Promise.all([
        prisma.uploads.findUnique({
            where: { id },
            include: { user: { select: channelSelect } },
        }),
        prisma.like.count({ where: { videoId: id, type: "LIKE" } }),
        prisma.like.count({ where: { videoId: id, type: "DISLIKE" } }),
    ]);

    if (!video) {
        res.status(404).json({ message: "Video not found" });
        return;
    }

    res.json({ ...video, likes, dislikes });
}));

// Create a video record after upload
videoRouter.post("/videos", requireAuth, asyncHandler(async (req, res) => {
    const parsed = uploadSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: "Invalid request body", errors: parsed.error.message });
        return;
    }

    const video = await prisma.uploads.create({
        data: { ...parsed.data, userId: req.userId },
    });
    res.status(201).json(video);
}));

// Record a view + add to watch history (upsert prevents duplicate history entries)
videoRouter.post("/videos/:id/view", asyncHandler(async (req, res) => {
    const videoId = req.params["id"] as string;

    // Increment view count regardless of auth
    await prisma.uploads.update({
        where: { id: videoId },
        data: { views: { increment: 1 } },
    });

    // Only record history if the user is logged in
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
        try {
            const jwt = await import("jsonwebtoken");
            const { env } = await import("../config/env");
            const payload = jwt.default.verify(auth.slice(7), env.JWT_SECRET) as { userId: string };

            await prisma.watchHistory.create({
                data: { userId: payload.userId, videoId },
            });
        } catch {
            // Not a valid token — skip history, don't fail the request
        }
    }

    res.json({ ok: true });
}));

// Get signed upload URL for R2
videoRouter.post("/upload-url", requireAuth, asyncHandler(async (req, res) => {
    const parsed = uploadUrlSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: "Invalid request body", errors: parsed.error.message });
        return;
    }

    const { fileName, contentType, kind } = parsed.data;
    const safeName = fileName.split(/[\\/]/).pop()!.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${kind}s/${req.userId}/${randomUUID()}-${safeName}`;

    const { uploadUrl, publicUrl } = await createPresignedUploadUrl(key, contentType);
    res.json({ uploadUrl, publicUrl });
}));
