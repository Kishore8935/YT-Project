import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

export const commentRouter = Router();

const commentSchema = z.object({
    text: z.string().min(1).max(1000),
});

// List comments for a video — newest first, paginated via cursor
commentRouter.get("/videos/:id/comments", asyncHandler(async (req, res) => {
    const videoId = req.params["id"] as string;
    const limit = Math.min(Number(req.query["limit"]) || 20, 100);
    const cursor = req.query["cursor"] as string | undefined;

    const comments = await prisma.comment.findMany({
        where: { videoId },
        orderBy: { createdAt: "desc" },
        take: limit,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        include: {
            user: { select: { id: true, channelName: true, profilePicture: true } },
        },
    });

    const nextCursor = comments.length === limit ? comments[comments.length - 1]?.id : null;
    res.json({ comments, nextCursor });
}));

// Add a comment — auth required
commentRouter.post("/videos/:id/comments", requireAuth, asyncHandler(async (req, res) => {
    const videoId = req.params["id"] as string;

    const parsed = commentSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: "Invalid request body", errors: parsed.error.message });
        return;
    }

    const video = await prisma.uploads.findUnique({ where: { id: videoId } });
    if (!video) {
        res.status(404).json({ message: "Video not found" });
        return;
    }

    const comment = await prisma.comment.create({
        data: { text: parsed.data.text, userId: req.userId, videoId },
        include: { user: { select: { id: true, channelName: true, profilePicture: true } } },
    });

    res.status(201).json(comment);
}));

// Delete a comment — auth required + must be your own comment
commentRouter.delete("/comments/:id", requireAuth, asyncHandler(async (req, res) => {
    const comment = await prisma.comment.findUnique({
        where: { id: req.params["id"] as string },
    });

    if (!comment) {
        res.status(404).json({ message: "Comment not found" });
        return;
    }

    // Authorization: only the comment owner can delete it
    if (comment.userId !== req.userId) {
        res.status(403).json({ message: "Forbidden" });
        return;
    }

    await prisma.comment.delete({ where: { id: comment.id } });
    res.status(204).send();
}));
