import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";

const R2_ENDPOINT = "https://0d6cec569b2e5afe971c23fa09b7f74c.r2.cloudflarestorage.com";

export const s3 = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
        accessKeyId: env.R2_accessKey,
        secretAccessKey: env.R2_secretKey,
    },
});

export async function createPresignedUploadUrl(key: string, contentType: string) {
    const uploadUrl = await getSignedUrl(
        s3,
        new PutObjectCommand({ Bucket: env.R2_bucket, Key: key, ContentType: contentType }),
        { expiresIn: 600 }
    );

    return { uploadUrl, publicUrl: `${env.R2_publicUrl}/${key}` };
}
