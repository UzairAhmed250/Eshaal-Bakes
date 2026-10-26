import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import {
  detectImageMimeFromMagicBytes,
  generateRandomStorageFilename,
  MAX_IMAGE_SIZE_BYTES,
  stripImageMetadata,
} from "@/lib/image-validation";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";
import {
  savePrivateReferenceImageBlob,
  verifySignedReferenceUrl,
} from "@/lib/store-db";

export async function POST(request: Request) {
  const ip = getClientIpFromHeaders(request.headers);
  const rate = checkRateLimit({
    key: `upload-ref:${ip}`,
    limit: 16,
    windowMs: 10 * 60 * 1000,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Upload rate limit exceeded. Please wait ${rate.retryAfterSeconds}s.`,
      },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file provided." },
        { status: 400 }
      );
    }

    if (file.size <= 0 || file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Image must be 5 MB or smaller." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const rawBytes = new Uint8Array(arrayBuffer);

    // Verify true file content via magic bytes (ignores spoofed file extensions)
    const detectedMime = detectImageMimeFromMagicBytes(rawBytes);
    if (!detectedMime) {
      return NextResponse.json(
        {
          error:
            "Unsupported file format. Only valid JPEG, PNG, and WebP images are permitted.",
        },
        { status: 400 }
      );
    }

    // Strip EXIF / APP1 metadata segments
    const cleanBytes = stripImageMetadata(rawBytes, detectedMime);
    const randomFilename = generateRandomStorageFilename(detectedMime);
    const storagePath = `reference-images/${randomFilename}`;

    savePrivateReferenceImageBlob({
      storagePath,
      bytes: cleanBytes,
      mimeType: detectedMime,
    });

    const previewDataUrl = `data:${detectedMime};base64,${Buffer.from(
      cleanBytes
    ).toString("base64")}`;

    return NextResponse.json({
      storagePath,
      mimeType: detectedMime,
      sizeBytes: cleanBytes.length,
      previewDataUrl,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to process image upload." },
      { status: 500 }
    );
  }
}

/**
 * Private reference image retrieval — strictly requires BOTH an authenticated admin session
 * AND a valid short-lived signed URL token. Anonymous users receive 403 Forbidden.
 */
export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Forbidden: Reference images are private and accessible to admins only.",
      },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const pathParam = searchParams.get("path") ?? "";
  const expParam = Number.parseInt(searchParams.get("exp") ?? "0", 10);
  const sigParam = searchParams.get("sig") ?? "";

  if (!verifySignedReferenceUrl(pathParam, expParam, sigParam)) {
    return NextResponse.json(
      { error: "Forbidden: Signed URL is invalid or expired." },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true, storagePath: pathParam });
}
