import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const allowedObjectTypes = new Set(["SEA", "POOL", "HOTEL", "SAND"]);
const allowedContentTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/svg+xml",
]);

function getFileExtension(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/svg+xml") return "svg";
  return "bin";
}

export async function POST(request: Request) {
  const session = await auth();
  if (
    !session ||
    (session.user?.role !== "MANAGER" && session.user?.role !== "ADMIN")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const contentType = body?.contentType;
  const objectType = body?.objectType;
  const zoneId = body?.zoneId;

  if (!contentType || !objectType || !zoneId) {
    return NextResponse.json({ error: "Missing parameters." }, { status: 400 });
  }

  if (!allowedObjectTypes.has(objectType)) {
    return NextResponse.json({ error: "Invalid object type." }, { status: 400 });
  }

  if (!allowedContentTypes.has(contentType)) {
    return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
  }

  const region = process.env.AWS_REGION;
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  if (!region || !bucket) {
    return NextResponse.json({ error: "S3 is not configured." }, { status: 500 });
  }

  const extension = getFileExtension(contentType);
  const key = `map-objects/${zoneId}/${objectType}/${crypto.randomUUID()}.${extension}`;

  const client = new S3Client({ region });
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ACL: "public-read",
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 });

  const baseUrl =
    process.env.AWS_S3_BUCKET_URL?.replace(/\/$/, "") ??
    `https://${bucket}.s3.${region}.amazonaws.com`;
  const publicUrl = `${baseUrl}/${key}`;

  return NextResponse.json({ uploadUrl, publicUrl });
}
