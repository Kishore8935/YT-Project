import { Router } from "express";
import { prisma } from "../lib/db";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

export const subscriptionRouter = Router();

// Toggle subscribe/unsubscribe to a channel.
// Updates subscriberCount in a transaction so it's always consistent.
subscriptionRouter.post("/channels/:id/subscribe", requireAuth, asyncHandler(async (req, res) => {
    const channelId = req.params["id"] as string;
    const subscriberId = req.userId;

    if (channelId === subscriberId) {
        res.status(400).json({ message: "You cannot subscribe to yourself." });
        return;
    }

    const channel = await prisma.user.findUnique({ where: { id: channelId } });
    if (!channel) {
        res.status(404).json({ message: "Channel not found" });
        return;
    }

    const existing = await prisma.subscription.findUnique({
        where: { subscriberId_channelId: { subscriberId, channelId } },
    });

    if (existing) {
        // Already subscribed → unsubscribe
        await prisma.$transaction([
            prisma.subscription.delete({
                where: { subscriberId_channelId: { subscriberId, channelId } },
            }),
            prisma.user.update({
                where: { id: channelId },
                data: { subscriberCount: { decrement: 1 } },
            }),
        ]);
        res.json({ subscribed: false, subscriberCount: Math.max(0, channel.subscriberCount - 1) });
    } else {
        // Not subscribed → subscribe
        await prisma.$transaction([
            prisma.subscription.create({ data: { subscriberId, channelId } }),
            prisma.user.update({
                where: { id: channelId },
                data: { subscriberCount: { increment: 1 } },
            }),
        ]);
        res.json({ subscribed: true, subscriberCount: channel.subscriberCount + 1 });
    }
}));

// Get subscription feed — recent videos from subscribed channels
subscriptionRouter.get("/me/subscriptions", requireAuth, asyncHandler(async (req, res) => {
    const subs = await prisma.subscription.findMany({
        where: { subscriberId: req.userId },
        select: { channelId: true },
    });

    const channelIds = subs.map(s => s.channelId);

    const videos = await prisma.uploads.findMany({
        where: { userId: { in: channelIds } },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { user: { select: { id: true, channelName: true, profilePicture: true, subscriberCount: true } } },
    });

    res.json(videos);
}));
