"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      // Only allow same-site relative paths.
      router.replace(next.startsWith("/") && !next.startsWith("//") ? next : "/");
      router.refresh();
    } else {
      setError((await res.json().catch(() => ({}))).error || "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required />
      <button className="btn btn-primary w-full justify-center" disabled={busy}>{busy ? "Checking…" : "Enter demo →"}</button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
