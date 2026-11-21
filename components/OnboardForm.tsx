"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STEPS = [
  "Crawling your website",
  "Reading product, pricing and about pages",
  "Researching competitors",
  "Building buyer personas and positioning",
  "Writing 5 strategy documents",
  "Auditing SEO & AI-search readiness",
  "Briefing your agents",
];
// Showcase mode: how long each step is shown before ticking off.
const STEP_MS = 2200;

export function OnboardForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [showcase, setShowcase] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setShowcase(null);
    setLoading(true);
    setStep(0);
    const started = Date.now();
    // Live mode is ~1–2 min, so pace the steps slower until the response arrives.
    let pace = 9000;
    const timer = setInterval(() => {
      setStep(Math.min(Math.floor((Date.now() - started) / pace), STEPS.length - 1));
    }, 300);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      if (data.showcase) {
        // Play every step at demo speed, then reveal the prepared analysis.
        pace = STEP_MS;
        const remaining = STEPS.length * STEP_MS - (Date.now() - started);
        if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
        clearInterval(timer);
        setStep(STEPS.length);
        setShowcase(data.company);
        await new Promise((r) => setTimeout(r, 2600));
      }
      router.push(`/p/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    } finally {
      clearInterval(timer);
    }
  }

  return (
    <form onSubmit={submit} className="panel p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input className="input" placeholder="yourcompany.com" value={url} onChange={(e) => setUrl(e.target.value)} disabled={loading} required />
        <button className="btn btn-primary justify-center whitespace-nowrap px-6" disabled={loading}>
          {loading ? "Working…" : "Hire my AI CMO →"}
        </button>
      </div>
      {!showNotes && !loading && (
        <button type="button" className="mt-3 text-sm muted underline" onClick={() => setShowNotes(true)}>
          + Add notes about your goals (optional)
        </button>
      )}
      {showNotes && (
        <textarea
          className="input mt-3 min-h-24"
          placeholder="e.g. We want B2B customers in India, focus on agencies, launch in 2 months…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={loading}
        />
      )}
      {loading && (
        <ol className="mt-5 space-y-2 text-sm">
          {STEPS.map((s, i) => (
            <li key={s} className={`flex items-center gap-3 ${i > step ? "opacity-35" : ""}`}>
              {i < step ? (
                <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-600 text-[11px] text-white">✓</span>
              ) : i === step ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <span className="h-5 w-5 rounded-full border border-app" />
              )}
              {s}
            </li>
          ))}
        </ol>
      )}
      {showcase && (
        <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <b>Demo data:</b> you’re about to see a pre-generated analysis of <b>{showcase}</b>, produced by the same Pulsora pipeline.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </form>
  );
}
