"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function RecordsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const babyProfile = useQuery(api.events.getBabyProfile, {});

  if (!mounted) {
    return null;
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-espresso">Records</h1>
          <p className="text-muted text-sm mt-1">Files, reports and exports</p>
        </div>

        <button
          type="button"
          className="flex items-center gap-2 bg-sage text-white px-4 py-2 rounded-full font-bold hover:bg-sage/90 transition-colors"
        >
          <span className="material-symbols-outlined">upload</span>
          Upload
        </button>
      </div>

      {!babyProfile ? (
        <div className="bg-white rounded-[20px] p-8 text-center shadow-sm border border-muted/10">
          <span className="material-symbols-outlined text-5xl text-sage mb-4">folder_open</span>
          <h3 className="text-xl font-bold text-espresso mb-2">No baby profile yet</h3>
          <p className="text-muted">Add your baby's profile in Settings to manage records</p>
        </div>
      ) : (
        <div className="bg-white rounded-[20px] p-8 text-center shadow-sm border border-muted/10">
          <span className="material-symbols-outlined text-5xl text-muted mb-4">folder_open</span>
          <h3 className="text-xl font-bold text-espresso mb-2">No records yet</h3>
          <p className="text-muted mb-4">
            Upload medical reports, vaccination cards, and other important documents
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-3 py-1 bg-oat rounded-full text-xs font-medium text-muted">Vaccines</span>
            <span className="px-3 py-1 bg-oat rounded-full text-xs font-medium text-muted">Prescriptions</span>
            <span className="px-3 py-1 bg-oat rounded-full text-xs font-medium text-muted">Lab Reports</span>
            <span className="px-3 py-1 bg-oat rounded-full text-xs font-medium text-muted">Growth Charts</span>
          </div>
        </div>
      )}

      <div className="mt-8 bg-sage/5 rounded-[20px] p-6 border border-sage/10">
        <h3 className="font-bold text-espresso mb-2">Doctor Pack Export</h3>
        <p className="text-sm text-muted mb-4">
          Generate a summary of the last 7 days including feeds, diapers, sleep, medicines, and growth data.
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-2 bg-espresso text-white px-6 py-3 rounded-full font-bold hover:bg-espresso/90"
        >
          <span className="material-symbols-outlined">description</span>
          Generate Doctor Summary
        </button>
      </div>
    </div>
  );
}
