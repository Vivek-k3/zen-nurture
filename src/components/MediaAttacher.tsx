"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface MediaAttacherProps {
  photoIds: string[];
  videoIds: string[];
  onChange: (photoIds: string[], videoIds: string[]) => void;
  maxTotal?: number;
}

export default function MediaAttacher({
  photoIds,
  videoIds,
  onChange,
  maxTotal = 6,
}: MediaAttacherProps) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<Map<string, string>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);

  const total = photoIds.length + videoIds.length;
  const remaining = maxTotal - total;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || remaining <= 0) return;

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);

    const newPhotoIds: string[] = [];
    const newVideoIds: string[] = [];

    for (const file of toUpload) {
      try {
        const url = await generateUploadUrl();
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await res.json();

        const isVideo = file.type.startsWith("video/");
        if (isVideo) {
          newVideoIds.push(storageId);
        } else {
          newPhotoIds.push(storageId);
        }

        const localUrl = URL.createObjectURL(file);
        setPreviews((prev) => new Map(prev).set(storageId, localUrl));
      } catch {
        // skip failed uploads
      }
    }

    onChange([...photoIds, ...newPhotoIds], [...videoIds, ...newVideoIds]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = (id: string, isVideo: boolean) => {
    if (isVideo) {
      onChange(photoIds, videoIds.filter((s) => s !== id));
    } else {
      onChange(photoIds.filter((s) => s !== id), videoIds);
    }
    setPreviews((prev) => {
      const next = new Map(prev);
      const url = next.get(id);
      if (url) URL.revokeObjectURL(url);
      next.delete(id);
      return next;
    });
  };

  const allIds = [...photoIds.map((id) => ({ id, isVideo: false })), ...videoIds.map((id) => ({ id, isVideo: true }))];

  return (
    <div>
      <div className="flex gap-2 flex-wrap">
        {allIds.map(({ id, isVideo }) => (
          <div
            key={id}
            className="relative h-16 w-16 rounded-xl overflow-hidden border border-muted/10 bg-oat group shrink-0"
          >
            {previews.has(id) ? (
              isVideo ? (
                <video src={previews.get(id)} className="h-full w-full object-cover" muted />
              ) : (
                <img src={previews.get(id)} alt="" className="h-full w-full object-cover" />
              )
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <span className="material-symbols-outlined text-muted/30 text-xl">
                  {isVideo ? "videocam" : "image"}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => handleRemove(id, isVideo)}
              className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-espresso/80 text-oat flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <span className="material-symbols-outlined text-[12px]">close</span>
            </button>
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={`h-16 w-16 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors shrink-0 ${
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
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {total > 0 && (
        <p className="text-[10px] text-muted mt-1.5">
          {total}/{maxTotal} photos & videos
        </p>
      )}
    </div>
  );
}
