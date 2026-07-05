import { Router } from "express";
import { prisma } from "../lib/db";
import { optionalAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

export const channelRouter = Router();

// Channel profile — public, but personalizes isSubscribed/isOwner when logged in.
channelRouter.get("/channels/:id", optionalAuth, asyncHandler(async (req, res) => {
    const channelId = req.params["id"] as string;
    const limit = Math.min(Number(req.query["limit"]) || 20, 50);
    const cursor = req.query["cursor"] as string | undefined;

    const channel = await prisma.user.findUnique({
        where: { id: channelId },
        select: {
            id: true,
            channelName: true,
            profilePicture: true,
            banner: true,
            description: true,
            subscriberCount: true,
        },
    });

    if (!channel) {
        res.status(404).json({ message: "Channel not found" });
        return;
    }

    const videos = await prisma.uploads.findMany({
        where: { userId: channelId },
        orderBy: { createdAt: "desc" },
        take: limit,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const isSubscribed = req.userId
        ? !!(await prisma.subscription.findUnique({
              where: { subscriberId_channelId: { subscriberId: req.userId, channelId } },
          }))
        : false;

    const nextCursor = videos.length === limit ? videos[videos.length - 1]?.id : null;

    res.json({
        channel,
        videos,
        nextCursor,
        isSubscribed,
        isOwner: req.userId === channelId,
    });
}));
