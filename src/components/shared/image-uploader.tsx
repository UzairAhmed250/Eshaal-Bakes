"use client";

import * as React from "react";
import { Upload, Trash2, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/shared/form-fields";

export interface UploadedImageItem {
  id: string;
  previewUrl: string;
  storagePath: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
  uploading?: boolean;
  progress?: number;
}

export interface ImageUploaderProps {
  label: string;
  helperText?: string;
  error?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  value: UploadedImageItem[];
  onChange: (items: UploadedImageItem[]) => void;
  uploadEndpoint?: string;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/**
 * Client-side canvas resize + compression before uploading to server,
 * which additionally performs magic-byte validation and EXIF stripping.
 */
async function compressImageClientSide(file: File): Promise<File> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDim = 1600;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const targetMime =
        file.type === "image/png" ? "image/png" : "image/jpeg";

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name, { type: targetMime }));
        },
        targetMime,
        0.86
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

export function ImageUploader({
  label,
  helperText = "JPEG, PNG or WebP up to 5 MB each.",
  error,
  maxFiles = 4,
  maxSizeMB = 5,
  value,
  onChange,
  uploadEndpoint = "/api/uploads/reference",
}: ImageUploaderProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleFilesSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    setLocalError(null);
    const remainingSlots = maxFiles - value.length;
    if (remainingSlots <= 0) {
      setLocalError(`Maximum ${maxFiles} images allowed.`);
      return;
    }

    const selectedFiles = Array.from(fileList).slice(0, remainingSlots);
    const maxBytes = maxSizeMB * 1024 * 1024;

    for (const f of selectedFiles) {
      if (!ALLOWED_TYPES.includes(f.type as (typeof ALLOWED_TYPES)[number])) {
        setLocalError("Only JPEG, PNG, and WebP images are allowed.");
        return;
      }
      if (f.size > maxBytes) {
        setLocalError(`Each image must be smaller than ${maxSizeMB} MB.`);
        return;
      }
    }

    setIsUploading(true);
    const uploadedNew: UploadedImageItem[] = [];

    try {
      for (const rawFile of selectedFiles) {
        const compressed = await compressImageClientSide(rawFile);
        const formData = new FormData();
        formData.append("file", compressed);

        const response = await fetch(uploadEndpoint, {
          method: "POST",
          body: formData,
        });

        const payload = (await response.json()) as {
          error?: string;
          storagePath?: string;
          mimeType?: "image/jpeg" | "image/png" | "image/webp";
          sizeBytes?: number;
          previewDataUrl?: string;
        };

        if (!response.ok || !payload.storagePath || !payload.mimeType) {
          throw new Error(payload.error || "Image upload failed.");
        }

        uploadedNew.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          previewUrl:
            payload.previewDataUrl || URL.createObjectURL(compressed),
          storagePath: payload.storagePath,
          mimeType: payload.mimeType,
          sizeBytes: payload.sizeBytes ?? compressed.size,
        });
      }

      onChange([...value, ...uploadedNew]);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Could not upload image."
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, idx) => idx !== index));
  };

  const handleMove = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= value.length) return;
    const copy = [...value];
    const [moved] = copy.splice(fromIdx, 1);
    if (!moved) return;
    copy.splice(toIdx, 0, moved);
    onChange(copy);
  };

  return (
    <FormField
      label={label}
      helperText={helperText}
      error={error || localError || undefined}
    >
      <div className="space-y-3">
        {value.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {value.map((item, idx) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-lg border bg-muted/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt={`Uploaded preview ${idx + 1}`}
                  className="h-28 w-full object-cover"
                />
                <div className="flex items-center justify-between border-t bg-card/95 px-2 py-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Move image left"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, idx - 1)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move image right"
                      disabled={idx === value.length - 1}
                      onClick={() => handleMove(idx, idx + 1)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => handleRemove(idx)}
                    className="rounded p-1 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {value.length < maxFiles && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFilesSelected}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-dashed py-6"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Compressing & verifying photo...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>
                    Upload Photos ({value.length}/{maxFiles})
                  </span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </FormField>
  );
}
