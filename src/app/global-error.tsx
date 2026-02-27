"use client";

/**
 * Renders a full-page error UI displayed when an unrecoverable client error occurs.
 *
 * @param error - The error to display; its message is shown if available and the object may include an optional `digest`.
 * @param reset - Callback invoked when the user clicks the "Try again" button to attempt recovery.
 * @returns The JSX element rendering a full HTML error page with icon, message, description, and a retry action.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-oat p-4">
        <div className="max-w-md w-full bg-white rounded-[20px] p-8 shadow-sm border border-muted/10 text-center">
          <span className="material-symbols-outlined text-5xl text-alert-red/60 mb-4">error</span>
          <h1 className="text-xl font-bold text-espresso mb-2">Something went wrong</h1>
          <p className="text-sm text-muted mb-6">
            {error.message || "A client-side error occurred. Check your connection and try again."}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="px-6 py-3 rounded-xl bg-espresso text-oat font-bold hover:bg-espresso/90 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
