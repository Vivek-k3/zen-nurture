"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface PhotoAttacherProps {
  storageIds: string[];
  onChange: (ids: string[]) => void;
  maxPhotos?: number;
}

export default function PhotoAttacher({ storageIds, onChange, maxPhotos = 4 }: PhotoAttacherProps) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<Map<string, string>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remaining = maxPhotos - storageIds.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) return;

    setUploading(true);
    const newIds: string[] = [];

    for (const file of toUpload) {
      try {
        const url = await generateUploadUrl();
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await res.json();
        newIds.push(storageId);

        const localUrl = URL.createObjectURL(file);
        setPreviews((prev) => new Map(prev).set(storageId, localUrl));
      } catch {
        // skip failed uploads silently
      }
    }

    onChange([...storageIds, ...newIds]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = (id: string) => {
    onChange(storageIds.filter((s) => s !== id));
    setPreviews((prev) => {
      const next = new Map(prev);
      const url = next.get(id);
      if (url) URL.revokeObjectURL(url);
      next.delete(id);
      return next;
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        {storageIds.map((id) => (
          <div key={id} className="relative h-16 w-16 rounded-xl overflow-hidden border border-muted/10 bg-oat group">
            {previews.has(id) ? (
              <img src={previews.get(id)} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <span className="material-symbols-outlined text-muted/30 text-xl">image</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => handleRemove(id)}
              className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-espresso/80 text-oat flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <span className="material-symbols-outlined text-[12px]">close</span>
            </button>
          </div>
        ))}

        {storageIds.length < maxPhotos && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={`h-16 w-16 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors ${
              uploading
                ? "border-sage/30 text-sage animate-pulse"
                : "border-muted/20 text-muted/40 hover:border-sage/40 hover:text-sage"
            }`}
          >
            <span className="material-symbols-outlined text-2xl">
              {uploading ? "hourglass_top" : "add_a_photo"}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {storageIds.length > 0 && (
        <p className="text-[10px] text-muted mt-1.5">
          {storageIds.length}/{maxPhotos} photos
        </p>
      )}
    </div>
  );
}
