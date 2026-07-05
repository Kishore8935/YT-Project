import { z } from "zod";

const envSchema = z.object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    R2_accessKey: z.string().min(1, "R2_accessKey is required"),
    R2_secretKey: z.string().min(1, "R2_secretKey is required"),
    R2_bucket: z.string().min(1, "R2_bucket is required"),
    R2_publicUrl: z.string().min(1, "R2_publicUrl is required"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Invalid environment variables:");
    console.error(parsed.error.format());
    process.exit(1);
}

export const env = parsed.data;

