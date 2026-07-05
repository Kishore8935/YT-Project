// Demo seed data so a fresh (or deployed) database isn't an empty page.
// Run with: bun run seed
//
// Idempotent: it wipes any previous demo data (users whose username starts
// with "demo_") and recreates a small, realistic dataset.
//
// Demo login  ->  username: demo_alice   password: demo1234

import bcrypt from "bcrypt";
import { prisma } from "../src/lib/db";

const DEMO_PREFIX = "demo_";
const PASSWORD = "demo1234";

// Public sample videos (Google's open test bucket) + generated thumbnails.
const sampleVideos = [
    { title: "Big Buck Bunny — Blender Open Movie", file: "BigBuckBunny.mp4" },
    { title: "Elephants Dream (Full Short Film)", file: "ElephantsDream.mp4" },
    { title: "For Bigger Blazes — Chromecast Ad", file: "ForBiggerBlazes.mp4" },
    { title: "Sintel — Durian Open Movie Project", file: "Sintel.mp4" },
    { title: "Tears of Steel — Sci-Fi Short", file: "TearsOfSteel.mp4" },
    { title: "Subaru Outback On Street And Dirt", file: "SubaruOutbackOnStreetAndDirt.mp4" },
];

function videoUrl(file: string) {
    return `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/${file}`;
}
function thumb(seed: string) {
    return `https://picsum.photos/seed/${seed}/640/360`;
}

async function clearDemoData() {
    const demoUsers = await prisma.user.findMany({
        where: { username: { startsWith: DEMO_PREFIX } },
        select: { id: true },
    });
    const userIds = demoUsers.map(u => u.id);
    if (userIds.length === 0) return;

    const demoVideos = await prisma.uploads.findMany({
        where: { userId: { in: userIds } },
        select: { id: true },
    });
    const videoIds = demoVideos.map(v => v.id);

    // Delete in FK-dependency order.
    await prisma.comment.deleteMany({ where: { OR: [{ userId: { in: userIds } }, { videoId: { in: videoIds } }] } });
    await prisma.like.deleteMany({ where: { OR: [{ userId: { in: userIds } }, { videoId: { in: videoIds } }] } });
    await prisma.watchHistory.deleteMany({ where: { OR: [{ userId: { in: userIds } }, { videoId: { in: videoIds } }] } });
    await prisma.subscription.deleteMany({ where: { OR: [{ subscriberId: { in: userIds } }, { channelId: { in: userIds } }] } });
    await prisma.uploads.deleteMany({ where: { id: { in: videoIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

async function main() {
    console.log("Clearing previous demo data…");
    await clearDemoData();

    const hashed = await bcrypt.hash(PASSWORD, 10);

    console.log("Creating demo channels…");
    const [alice, bob, carol] = await Promise.all([
        prisma.user.create({ data: { username: `${DEMO_PREFIX}alice`, password: hashed, gender: "Female", channelName: "Alice Codes", description: "Web dev tutorials & build-alongs." } }),
        prisma.user.create({ data: { username: `${DEMO_PREFIX}bob`, password: hashed, gender: "Male", channelName: "Bob's Cinema", description: "Short films and open movies." } }),
        prisma.user.create({ data: { username: `${DEMO_PREFIX}carol`, password: hashed, gender: "Other", channelName: "Carol Drives", description: "Cars, roads, and road trips." } }),
    ]);
    const channels = [alice, bob, carol];

    console.log("Creating demo videos…");
    const videos = [];
    for (let i = 0; i < sampleVideos.length; i++) {
        const s = sampleVideos[i]!;
        const owner = channels[i % channels.length]!;
        const video = await prisma.uploads.create({
            data: {
                title: s.title,
                description: "A demo video seeded for the portfolio project.",
                videoUrl: videoUrl(s.file),
                thumbnail: thumb(s.file),
                views: Math.floor(Math.random() * 50_000),
                userId: owner.id,
            },
        });
        videos.push(video);
    }

    console.log("Adding comments, likes, and subscriptions…");
    // A few comments spread across videos
    const commenters = [alice, bob, carol];
    const commentTexts = ["Great video!", "This helped a lot, thanks.", "Underrated channel 🔥", "First!", "Please make more of these."];
    for (const video of videos) {
        const n = 1 + Math.floor(Math.random() * 3);
        for (let j = 0; j < n; j++) {
            await prisma.comment.create({
                data: {
                    text: commentTexts[Math.floor(Math.random() * commentTexts.length)]!,
                    userId: commenters[Math.floor(Math.random() * commenters.length)]!.id,
                    videoId: video.id,
                },
            });
        }
    }

    // Likes: each channel likes a couple of videos (skip their own).
    for (const user of channels) {
        for (const video of videos) {
            if (video.userId === user.id) continue;
            if (Math.random() < 0.5) {
                await prisma.like.create({
                    data: { userId: user.id, videoId: video.id, type: Math.random() < 0.85 ? "LIKE" : "DISLIKE" },
                });
            }
        }
    }

    // Subscriptions: everyone subscribes to Alice; Alice subscribes to Bob.
    await prisma.$transaction([
        prisma.subscription.create({ data: { subscriberId: bob.id, channelId: alice.id } }),
        prisma.subscription.create({ data: { subscriberId: carol.id, channelId: alice.id } }),
        prisma.subscription.create({ data: { subscriberId: alice.id, channelId: bob.id } }),
        prisma.user.update({ where: { id: alice.id }, data: { subscriberCount: 2 } }),
        prisma.user.update({ where: { id: bob.id }, data: { subscriberCount: 1 } }),
    ]);

    console.log(`\n✅ Seed complete: ${channels.length} channels, ${videos.length} videos.`);
    console.log(`   Demo login  ->  username: ${DEMO_PREFIX}alice   password: ${PASSWORD}\n`);
}

main()
    .catch((e) => {
        console.error("Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
