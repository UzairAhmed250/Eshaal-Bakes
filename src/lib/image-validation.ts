import crypto from "crypto";

export type AllowedImageMime = "image/jpeg" | "image/png" | "image/webp";

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_REFERENCE_IMAGES_PER_REQUEST = 4;

/**
 * Inspects file magic bytes to verify true image format regardless of file extension or client MIME header.
 */
export function detectImageMimeFromMagicBytes(
  bytes: Uint8Array
): AllowedImageMime | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP: "RIFF" .... "WEBP"
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

/**
 * Strips EXIF / APP1..APP15 metadata and comments from JPEG buffers,
 * and removes ancillary text/eXIf chunks from PNG buffers.
 */
export function stripImageMetadata(
  bytes: Uint8Array,
  mimeType: AllowedImageMime
): Uint8Array {
  if (mimeType === "image/jpeg") {
    return stripJpegExif(bytes);
  }
  if (mimeType === "image/png") {
    return stripPngMetadata(bytes);
  }
  return bytes;
}

function stripJpegExif(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return bytes;
  }

  const chunks: Uint8Array[] = [bytes.slice(0, 2)]; // SOI
  let offset = 2;

  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) {
      chunks.push(bytes.slice(offset));
      break;
    }

    const marker = bytes[offset + 1] ?? 0;

    // SOS (Start of Scan) or EOI: copy the remainder of the image stream intact
    if (marker === 0xda || marker === 0xd9) {
      chunks.push(bytes.slice(offset));
      break;
    }

    // Standalone markers without length
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      chunks.push(bytes.slice(offset, offset + 2));
      offset += 2;
      continue;
    }

    const segLength = ((bytes[offset + 2] ?? 0) << 8) | (bytes[offset + 3] ?? 0);
    if (segLength < 2 || offset + 2 + segLength > bytes.length) {
      chunks.push(bytes.slice(offset));
      break;
    }

    // Skip APP1..APP15 (0xE1..0xEF) and COM (0xFE) which contain EXIF/GPS/XMP/comments
    const isMetadataSegment =
      (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe;

    if (!isMetadataSegment) {
      chunks.push(bytes.slice(offset, offset + 2 + segLength));
    }

    offset += 2 + segLength;
  }

  const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
  const out = new Uint8Array(totalLen);
  let pos = 0;
  for (const c of chunks) {
    out.set(c, pos);
    pos += c.length;
  }
  return out;
}

function stripPngMetadata(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 8) return bytes;
  const outChunks: Uint8Array[] = [bytes.slice(0, 8)];
  let offset = 8;

  while (offset + 12 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
    const length = view.getUint32(0, false);
    const chunkEnd = offset + 12 + length;
    if (chunkEnd > bytes.length) {
      outChunks.push(bytes.slice(offset));
      break;
    }

    const type = String.fromCharCode(
      bytes[offset + 4] ?? 0,
      bytes[offset + 5] ?? 0,
      bytes[offset + 6] ?? 0,
      bytes[offset + 7] ?? 0
    );

    const isPrivateMetadata =
      type === "eXIf" || type === "tEXt" || type === "iTXt" || type === "zTXt";

    if (!isPrivateMetadata) {
      outChunks.push(bytes.slice(offset, chunkEnd));
    }

    offset = chunkEnd;
  }

  const totalLen = outChunks.reduce((acc, c) => acc + c.length, 0);
  const out = new Uint8Array(totalLen);
  let pos = 0;
  for (const c of outChunks) {
    out.set(c, pos);
    pos += c.length;
  }
  return out;
}

/**
 * Generates a cryptographically random filename for safe storage.
 */
export function generateRandomStorageFilename(mimeType: AllowedImageMime): string {
  const ext =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
        ? "webp"
        : "jpg";
  const randomId = crypto.randomBytes(16).toString("hex");
  return `ref-${Date.now()}-${randomId}.${ext}`;
}

/**
 * Generates a non-sequential random order code (`EB-XXXXXX`) and 128-bit hex token.
 */
export function generateSecureOrderCode(): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = crypto.randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[(bytes[i] ?? 0) % alphabet.length];
  }
  return `EB-${code}`;
}

export function generateSecure128BitToken(): string {
  return crypto.randomBytes(16).toString("hex");
}
