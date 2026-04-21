import express from "express";
import { prisma } from "./db";
import bcrypt from "bcrypt";
import { z } from "zod";
import jwt from "jsonwebtoken";
import cors from "cors";

const R2_url = "https://0d6cec569b2e5afe971c23fa09b7f74c.r2.cloudflarestorage.com"
const R2_ACCESS_KEY = process.env.R2_accessKey;
const R2_SECRET_KEY = process.env.R2_secretKey;

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

function getUserId(req: express.Request): string | null {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return null;
    try {
        const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: string };
        return payload.userId;
    }catch {
        return null;
    }
}

const signupSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(6),
    gender: z.enum(["Male", "Female", "Other"]),
    channelName: z.string().min(1),
});

const signinSchema = z.object({
    username: z.string(),
    password: z.string(),
});

const uploadSchema = z.object({
    title: z.string().min(1),
    videoUrl: z.url(),
    thumbnail: z.url(),
})


app.post("/api/signup", async (req,res)=>{
    const parsed = signupSchema.safeParse(req.body);
    if(!parsed.success){
        res.status(400).json({errors: parsed.error.message});
        return;
    }

    const { username, password, gender, channelName } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
        where: { username }
    });

    if (existingUser) {
        res.status(400).json({ message: "User already exists" });
        return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
        data: {
            username,
            password: hashedPassword,
            gender,
            channelName
        },
    });

    // Generate a JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);

    res.status(201).json({token, userId: user.id });
});


app.post("/api/signin", async (req,res)=>{
    const parsed = signinSchema.safeParse(req.body);
    if(!parsed.success){
        res.status(400).json({errors: parsed.error.message});
        return;
    }
    const { username, password } = parsed.data;

    const user = await prisma.user.findFirst({ where: {username} });
    if(!user){
        res.status(401).json({errors : "Invalid credentials" });
        return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if(!valid){
        res.status(401).json({errors : "Invalid credentials" });
        return;
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({token, userId: user.id });
});

app.get("/api/videos", async (_req,res)=>{
    const videos = await prisma.uploads.findMany({
        include: {user: {select: {id: true, channelName: true, profilePicture: true, subscriberCount: true }}},
        orderBy: {createdAt: "desc"},
    });
    res.json(videos);
});

app.get("/api/videos/:id", async (req,res)=>{
    const video = await prisma.uploads.findUnique({
        where:{id: req.params.id},
        include: {user: {select: {id: true, channelName: true, profilePicture: true, subscriberCount: true }}},
    });
    if(!video){
        res.status(404).json({message:"Video not found"});
        return;
    }
    res.json(video);
})

app.post("/api/videos", async (req,res)=>{
    const userId = getUserId(req);
    if(!userId){
        res.status(401).json({message:"Unauthorized"});
        return;
    }

    const parsed = uploadSchema.safeParse(req.body);
    if(!parsed.success){
        res.status(400).json({message:"Invalid request body", errors: parsed.error.message});
        return;
    }

    const video = await prisma.uploads.create({
        data:{...parsed.data, userId},
    });
    res.status(201).json(video);
});


app.post()

app.listen(3000,()=>{
    console.log("Server is running on port 3000");
});