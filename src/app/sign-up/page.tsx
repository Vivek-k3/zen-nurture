"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
      });
      if (result.error) {
        setError(result.error.message ?? "Sign up failed");
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError(err.message ?? "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-oat px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-espresso">Zen Nurture</h1>
          <p className="text-muted mt-2">Create your account</p>
        </div>

        <div className="bg-white rounded-[20px] p-8 shadow-sm border border-muted/10">
          <h2 className="text-xl font-bold text-espresso mb-6">Sign Up</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-xs font-bold text-muted uppercase tracking-wider">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-3 rounded-xl bg-oat/50 border border-muted/10 text-espresso font-medium focus:outline-none focus:border-sage/50"
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold text-muted uppercase tracking-wider">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 rounded-xl bg-oat/50 border border-muted/10 text-espresso font-medium focus:outline-none focus:border-sage/50"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-bold text-muted uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full p-3 rounded-xl bg-oat/50 border border-muted/10 text-espresso font-medium focus:outline-none focus:border-sage/50"
                placeholder="Min 8 characters"
              />
            </div>

            {error && (
              <div className="text-alert-red text-sm bg-alert-red/5 rounded-xl p-3 border border-alert-red/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-espresso text-oat font-bold hover:bg-espresso/90 transition-colors disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-muted text-sm mt-6">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-sage font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
