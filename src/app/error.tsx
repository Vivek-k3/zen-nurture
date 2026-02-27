"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[20px] p-8 shadow-sm border border-muted/10 text-center">
        <span className="material-symbols-outlined text-5xl text-alert-red/60 mb-4">error</span>
        <h2 className="text-xl font-bold text-espresso mb-2">Something went wrong</h2>
        <p className="text-sm text-muted mb-6">
          {error.message || "An error occurred. Please try again."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="px-6 py-3 rounded-xl bg-espresso text-oat font-bold hover:bg-espresso/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
