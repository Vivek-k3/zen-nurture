"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface EventPhotosProps {
  storageIds: string[];
}

export default function EventPhotos({ storageIds }: EventPhotosProps) {
  const urls = useQuery(api.photos.getUrls, { storageIds });
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!urls) return null;

  const validUrls = storageIds
    .map((id) => ({ id, url: urls[id] }))
    .filter((u) => u.url);

  if (validUrls.length === 0) return null;

  return (
    <>
      <div className="flex gap-1.5">
        {validUrls.map(({ id, url }) => (
          <button
            key={id}
            type="button"
            onClick={() => setExpanded(id)}
            className="h-12 w-12 rounded-lg overflow-hidden border border-muted/10 hover:border-sage/30 transition-all hover:scale-105"
          >
            <img src={url!} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {expanded && urls[expanded] && (
        <div
          className="fixed inset-0 z-[60] bg-espresso/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setExpanded(null)}
        >
          <div className="relative max-w-2xl max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={urls[expanded]!}
              alt=""
              className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain"
            />
            <button
              type="button"
              onClick={() => setExpanded(null)}
              className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-white shadow-lg flex items-center justify-center text-espresso hover:bg-oat"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            {validUrls.length > 1 && (
              <div className="flex gap-2 justify-center mt-3">
                {validUrls.map(({ id, url }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setExpanded(id)}
                    className={`h-10 w-10 rounded-lg overflow-hidden border-2 transition-all ${
                      expanded === id ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={url!} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
