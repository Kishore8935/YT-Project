import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/db";
import { env } from "../config/env";
import { asyncHandler } from "../middleware/error";

export const authRouter = Router();

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

authRouter.post("/signup", asyncHandler(async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.message });
        return;
    }

    const { username, password, gender, channelName } = parsed.data;

    const existingUser = await prisma.user.findFirst({ where: { username } });
    if (existingUser) {
        res.status(400).json({ message: "User already exists" });
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: { username, password: hashedPassword, gender, channelName },
    });

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET);
    res.status(201).json({ token, userId: user.id });
}));

authRouter.post("/signin", asyncHandler(async (req, res) => {
    const parsed = signinSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.message });
        return;
    }
    const { username, password } = parsed.data;

    const user = await prisma.user.findFirst({ where: { username } });
    if (!user) {
        res.status(401).json({ errors: "Invalid credentials" });
        return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
        res.status(401).json({ errors: "Invalid credentials" });
        return;
    }

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET);
    res.json({ token, userId: user.id });
}));
