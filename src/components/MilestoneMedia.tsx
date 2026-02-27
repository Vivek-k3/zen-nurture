"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface MilestoneMediaProps {
  photoIds: string[];
  videoIds: string[];
}

export default function MilestoneMedia({ photoIds, videoIds }: MilestoneMediaProps) {
  const allIds = [...photoIds, ...videoIds];
  const urls = useQuery(api.photos.getUrls, allIds.length > 0 ? { storageIds: allIds } : "skip");
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!urls || allIds.length === 0) return null;

  const photoUrls = photoIds
    .map((id) => ({ id, url: urls[id] }))
    .filter((u) => u.url) as { id: string; url: string }[];
  const videoUrls = videoIds
    .map((id) => ({ id, url: urls[id] }))
    .filter((u) => u.url) as { id: string; url: string }[];

  if (photoUrls.length === 0 && videoUrls.length === 0) return null;

  return (
    <>
      <div className="flex gap-1.5 flex-wrap mt-2">
        {photoUrls.map(({ id, url }) => (
          <button
            key={id}
            type="button"
            onClick={() => setExpanded(id)}
            className="h-12 w-12 rounded-lg overflow-hidden border border-muted/10 hover:border-sage/30 transition-all hover:scale-105 shrink-0"
          >
            <img src={url} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
        {videoUrls.map(({ id, url }) => (
          <div
            key={id}
            className="h-12 w-24 rounded-lg overflow-hidden border border-muted/10 shrink-0"
          >
            <video src={url} className="h-full w-full object-cover" muted playsInline />
          </div>
        ))}
      </div>

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
          </div>
        </div>
      )}
    </>
  );
}
