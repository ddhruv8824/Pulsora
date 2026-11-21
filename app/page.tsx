import Link from "next/link";
import { Logo } from "@/components/Logo";
import { OnboardForm } from "@/components/OnboardForm";
import { AGENT_META } from "@/lib/agents";
import { listProjects } from "@/lib/db";
import { isDemoMode } from "@/lib/llm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const projects = await listProjects();
  const demo = isDemoMode();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <nav className="flex items-center justify-between">
        <Logo />
        {demo && <span className="chip">Demo mode — no API key set</span>}
      </nav>

      <section className="mx-auto mt-16 max-w-2xl text-center">
        <span className="chip"><span className="rounded bg-black px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white">MVP</span> Your AI Chief Marketing Officer</span>
        <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
          Meet Pulsora,<br />your AI CMO.
        </h1>
        <p className="mt-5 text-lg muted">
          Enter your website. Pulsora researches your business, writes your strategy documents, and runs a team of AI agents.
          You just approve.
        </p>
        <div className="mt-8 text-left">
          <OnboardForm />
        </div>
      </section>

      <p className="label mt-14 text-center">6 marketing agents on duty</p>
      <section className="mt-4 grid gap-3 sm:grid-cols-3">
        {Object.values(AGENT_META).map((a) => (
          <div key={a.id} className="panel flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--bg)] border border-app font-bold">{a.icon}</span>
            <div>
              <div className="font-semibold">{a.name}</div>
              <div className="text-sm muted">{a.tagline}</div>
            </div>
          </div>
        ))}
      </section>

      {projects.length > 0 && (
        <section className="mt-14">
          <h2 className="label mb-3">Your companies</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.map((p) => (
              <Link key={p.id} href={`/p/${p.id}`} className="panel block p-4 hover:border-black">
                <div className="font-semibold">{p.strategy.companyName}</div>
                <div className="truncate text-sm muted">{p.url}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
