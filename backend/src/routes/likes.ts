import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

export const likeRouter = Router();

const likeSchema = z.object({
    type: z.enum(["LIKE", "DISLIKE"]),
});

// Toggle like/dislike on a video.
// - Sending the same type again removes the reaction (unlike/undislike).
// - Sending the opposite type switches the reaction.
likeRouter.post("/videos/:id/like", requireAuth, asyncHandler(async (req, res) => {
    const videoId = req.params["id"] as string;
    const userId = req.userId;

    const parsed = likeSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: "Invalid request body", errors: parsed.error.message });
        return;
    }

    const { type } = parsed.data;

    const existing = await prisma.like.findUnique({
        where: { userId_videoId: { userId, videoId } },
    });

    if (existing?.type === type) {
        // Same reaction clicked again → remove it
        await prisma.like.delete({ where: { userId_videoId: { userId, videoId } } });
    } else {
        // New reaction or switch — upsert handles both
        await prisma.like.upsert({
            where: { userId_videoId: { userId, videoId } },
            create: { userId, videoId, type },
            update: { type },
        });
    }

    // Return fresh counts so the frontend can update without a refetch
    const [likes, dislikes] = await Promise.all([
        prisma.like.count({ where: { videoId, type: "LIKE" } }),
        prisma.like.count({ where: { videoId, type: "DISLIKE" } }),
    ]);

    const userReaction = existing?.type === type
        ? null
        : type;

    res.json({ likes, dislikes, userReaction });
}));
