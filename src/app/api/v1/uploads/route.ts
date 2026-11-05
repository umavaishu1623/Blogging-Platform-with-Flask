import { NextResponse, type NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireRole } from "@/lib/auth/authorization";
import { checkRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function validImage(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") return bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10";
  if (mimeType === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}

export async function POST(request: NextRequest) {
  const user = await requireRole("AUTHOR", "ADMIN");
  if (Number(request.headers.get("content-length")) > MAX_FILE_SIZE + 8192) {
    return NextResponse.json({ error: "Image must be 5 MB or smaller." }, { status: 413 });
  }
  const origin = request.headers.get("origin");
  if (!origin || !process.env.APP_URL || origin !== new URL(process.env.APP_URL).origin) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  if (!(await checkRateLimit("image-upload", user.id, 12, 3600))) {
    return NextResponse.json({ error: "Upload limit reached. Try again later." }, { status: 429 });
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return NextResponse.json({ error: "Image storage is not configured." }, { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size < 1 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Choose an image no larger than 5 MB." }, { status: 400 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!validImage(bytes, file.type)) {
    return NextResponse.json({ error: "Only valid JPEG, PNG, or WebP images are accepted." }, { status: 415 });
  }

  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET });
  try {
    const result = await cloudinary.uploader.upload(
      `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`,
      {
        folder: "ink-and-signal/articles",
        resource_type: "image",
        allowed_formats: ["jpg", "png", "webp"],
        transformation: [{ width: 1800, height: 1200, crop: "limit", quality: "auto:good", fetch_format: "auto" }],
      },
    );
    return NextResponse.json({ url: result.secure_url }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Image upload failed. Try again later." }, { status: 502 });
  }
}