import { describe, it, expect, afterAll } from "bun:test";
import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/lib/db";

// Integration tests: real routes + middleware + database.
// The app is imported directly (no listening port) — supertest drives it in-memory.
// Every run uses unique usernames and cleans up after itself in afterAll.

const stamp = Date.now();
const userA = { username: `test_a_${stamp}`, password: "password123", gender: "Male", channelName: "A Channel" };
const userB = { username: `test_b_${stamp}`, password: "password123", gender: "Female", channelName: "B Channel" };

let tokenA = "";
let tokenB = "";
let videoId = "";
let commentId = "";

const createdUserIds: string[] = [];
const createdVideoIds: string[] = [];

describe("Auth", () => {
    it("signs up a new user and returns a token", async () => {
        const res = await request(app).post("/api/signup").send(userA);
        expect(res.status).toBe(201);
        expect(typeof res.body.token).toBe("string");
        tokenA = res.body.token;
        createdUserIds.push(res.body.userId);
    });

    it("rejects a duplicate signup", async () => {
        const res = await request(app).post("/api/signup").send(userA);
        expect(res.status).toBe(400);
    });

    it("signs in with correct credentials", async () => {
        const res = await request(app)
            .post("/api/signin")
            .send({ username: userA.username, password: userA.password });
        expect(res.status).toBe(200);
        expect(typeof res.body.token).toBe("string");
    });

    it("rejects sign in with a wrong password", async () => {
        const res = await request(app)
            .post("/api/signin")
            .send({ username: userA.username, password: "wrongpassword" });
        expect(res.status).toBe(401);
    });
});

describe("Video CRUD", () => {
    const payload = { title: "Test Video", videoUrl: "https://example.com/v.mp4", thumbnail: "https://example.com/t.jpg" };

    it("requires auth to create a video", async () => {
        const res = await request(app).post("/api/videos").send(payload);
        expect(res.status).toBe(401);
    });

    it("creates a video when authenticated", async () => {
        const res = await request(app)
            .post("/api/videos")
            .set("Authorization", `Bearer ${tokenA}`)
            .send(payload);
        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
        videoId = res.body.id;
        createdVideoIds.push(videoId);
    });

    it("fetches the created video with like counts", async () => {
        const res = await request(app).get(`/api/videos/${videoId}`);
        expect(res.status).toBe(200);
        expect(res.body.title).toBe("Test Video");
        expect(res.body.likes).toBe(0);
        expect(res.body.dislikes).toBe(0);
    });

    it("returns 404 for a non-existent video", async () => {
        const res = await request(app).get("/api/videos/does-not-exist");
        expect(res.status).toBe(404);
    });
});

describe("Comment authorization", () => {
    it("lets user A post a comment", async () => {
        const res = await request(app)
            .post(`/api/videos/${videoId}/comments`)
            .set("Authorization", `Bearer ${tokenA}`)
            .send({ text: "First!" });
        expect(res.status).toBe(201);
        commentId = res.body.id;
    });

    it("forbids user B from deleting user A's comment (403)", async () => {
        // Register user B
        const signup = await request(app).post("/api/signup").send(userB);
        tokenB = signup.body.token;
        createdUserIds.push(signup.body.userId);

        const res = await request(app)
            .delete(`/api/comments/${commentId}`)
            .set("Authorization", `Bearer ${tokenB}`);
        expect(res.status).toBe(403);
    });

    it("lets the owner delete their own comment (204)", async () => {
        const res = await request(app)
            .delete(`/api/comments/${commentId}`)
            .set("Authorization", `Bearer ${tokenA}`);
        expect(res.status).toBe(204);
    });
});

afterAll(async () => {
    // Tear down in FK-dependency order so deletes don't violate constraints.
    const videoFilter = { videoId: { in: createdVideoIds } };
    const userFilter = { userId: { in: createdUserIds } };

    await prisma.comment.deleteMany({ where: { OR: [videoFilter, userFilter] } });
    await prisma.like.deleteMany({ where: { OR: [videoFilter, userFilter] } });
    await prisma.watchHistory.deleteMany({ where: { OR: [videoFilter, userFilter] } });
    await prisma.subscription.deleteMany({
        where: { OR: [{ subscriberId: { in: createdUserIds } }, { channelId: { in: createdUserIds } }] },
    });
    await prisma.uploads.deleteMany({ where: { id: { in: createdVideoIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.$disconnect();
});
