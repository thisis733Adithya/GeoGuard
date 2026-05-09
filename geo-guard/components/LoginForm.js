"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    if (res?.error) {
      setError("Invalid username or password.");
      setLoading(false);
    } else {
      router.push("/admin");
    }
  }

  return (
    <div className="flex justify-center w-full">
      <div className="w-full max-w-md space-y-4">
        {/* Credentials Card */}
        <form
          onSubmit={submit}
          className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-8 shadow-[var(--shadow-soft)]"
        >
          <h2 className="mb-1 text-xl font-bold text-[var(--heading)]">Admin Sign In</h2>
          <p className="mb-6 text-sm text-[var(--text-muted)]">Use your admin credentials to access the control panel.</p>

          <div className="grid gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--heading)]">
              Username
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                className="min-h-[2.75rem] rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] outline-none transition-all duration-200 focus-visible:border-[var(--brand)] focus-visible:shadow-[0_0_0_1px_var(--brand)]"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--heading)]">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="min-h-[2.75rem] rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] outline-none transition-all duration-200 focus-visible:border-[var(--brand)] focus-visible:shadow-[0_0_0_1px_var(--brand)]"
              />
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-[var(--danger)] bg-[var(--danger)]/10 p-3 text-sm font-medium text-[var(--danger)]">
              {error}
            </p>
          ) : null}

          <button
            disabled={loading}
            className="mt-6 min-h-[3rem] w-full rounded-xl bg-[var(--brand)] px-4 text-base font-bold text-[var(--bg)] shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--brand-strong)] disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading ? "Signing in…" : "Sign In as Admin"}
          </button>
        </form>

        {/* OAuth Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-[var(--border)]" />
          <span className="text-xs uppercase tracking-widest text-[var(--text-muted)]">or continue as tourist</span>
          <div className="flex-1 border-t border-[var(--border)]" />
        </div>

        {/* OAuth Buttons */}
        <div className="grid gap-3">
          {/* Google */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/admin" })}
            className="flex items-center justify-center gap-3 min-h-12 w-full rounded-xl bg-white border border-gray-200 px-4 text-sm font-semibold text-gray-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="-0.5 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" fillRule="evenodd">
                <path d="M9.827 24c0-1.524.253-2.986.705-4.357L2.623 13.604A23.8 23.8 0 0 0 .214 24c0 3.736.868 7.26 2.407 10.388l7.904-6.051A14.17 14.17 0 0 1 9.827 24" fill="#FBBC05"/>
                <path d="M23.714 10.133c3.311 0 6.302 1.173 8.652 3.093L39.202 6.4C35.036 2.773 29.695.533 23.714.533 14.427.533 6.445 5.844 2.623 13.604l7.91 6.039c1.822-5.532 7.016-9.51 13.18-9.51" fill="#EB4335"/>
                <path d="M23.714 37.867c-6.165 0-11.359-3.978-13.181-9.51l-7.91 6.038C6.445 42.156 14.427 47.467 23.714 47.467c5.732 0 11.204-2.035 15.31-5.848l-7.507-5.804c-2.118 1.334-4.785 2.052-7.803 2.052" fill="#34A853"/>
                <path d="M46.145 24c0-1.387-.213-2.88-.533-4.267H23.714v9.067h12.604c-.63 3.091-2.346 5.468-4.8 7.014l7.506 5.805c4.315-4.004 7.12-9.969 7.12-17.62" fill="#4285F4"/>
              </g>
            </svg>
            Continue with Google
          </button>

          {/* Facebook */}
          <button
            type="button"
            onClick={() => signIn("facebook", { callbackUrl: "/admin" })}
            className="flex items-center justify-center gap-3 min-h-12 w-full rounded-xl bg-[#1877F2] px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-[#1667d9]"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="white">
              <path d="M24 12.073C24 5.406 18.627 0 12 0S0 5.406 0 12.073c0 6.027 4.388 11.024 10.125 11.927v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796v8.437C19.612 23.097 24 18.1 24 12.073z"/>
            </svg>
            Continue with Facebook
          </button>

          {/* Twitter / X */}
          <button
            type="button"
            onClick={() => signIn("twitter", { callbackUrl: "/admin" })}
            className="flex items-center justify-center gap-3 min-h-12 w-full rounded-xl bg-black px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-zinc-800"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="white">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.843L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Continue with X (Twitter)
          </button>
        </div>
      </div>
    </div>
  );
}
