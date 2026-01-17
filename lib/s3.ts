import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || "us-east-1";

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        "AWS credentials are not set. Please provide AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your environment variables.",
      );
    }

    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return s3Client;
}

function base64ToBuffer(base64: string): Buffer {
  const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
  return Buffer.from(base64Data, "base64");
}

function detectImageType(base64: string): { contentType: string; extension: string } {
  if (base64.startsWith("data:image/")) {
    const match = base64.match(/data:image\/([^;]+)/);
    if (match) {
      const type = match[1];
      if (type === "svg+xml") {
        return { contentType: "image/svg+xml", extension: "svg" };
      }
      return { contentType: `image/${type}`, extension: type };
    }
  }
  return { contentType: "image/jpeg", extension: "jpg" };
}

export async function uploadImageToS3(
  base64: string,
  hotelId: string,
): Promise<string | null> {
  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const bucketUrl = process.env.AWS_S3_BUCKET_URL;
    const region = process.env.AWS_REGION || "us-east-1";

    if (!bucketName) {
      throw new Error(
        "AWS_S3_BUCKET_NAME is not set. Please provide it in your environment variables.",
      );
    }

    const imageBuffer = base64ToBuffer(base64);
    const { contentType, extension } = detectImageType(base64);

    const timestamp = Date.now();
    const uuid = randomUUID();
    const fileName = `${hotelId}/${timestamp}-${uuid}.${extension}`;

    const client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: imageBuffer,
      ContentType: contentType,
    });

    await client.send(command);

    const publicUrl = bucketUrl
      ? `${bucketUrl}/${fileName}`
      : `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;

    return publicUrl;
  } catch (error) {
    console.error("Error uploading image to S3:", error);
    return null;
  }
}
