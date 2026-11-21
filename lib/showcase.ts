import { promises as fs } from "fs";
import path from "path";
import type { DraftInput } from "./agents";
import type { AgentId, DB, Project } from "./types";

// Showcase mode (PULSORA_SHOWCASE=1): the app serves a pre-generated analysis of
// one real company from seed/showcase.json instead of calling the AI live.
// The seed ships with the code, so the demo survives restarts on free hosting.

export type ShowcaseSeed = {
  project: Project;
  /** Drafts already waiting in the approval queue. */
  drafts: (DraftInput & { agent: AgentId })[];
  /** Extra batches handed out, one per "Run agent" click. */
  reserve: Partial<Record<AgentId, DraftInput[][]>>;
};

const SEED_PATH = path.join(process.cwd(), "seed", "showcase.json");
let seedCache: ShowcaseSeed | null | undefined;

export const isShowcase = () => process.env.PULSORA_SHOWCASE === "1";

export async function loadSeed(): Promise<ShowcaseSeed | null> {
  if (seedCache !== undefined) return seedCache;
  try {
    seedCache = JSON.parse(await fs.readFile(SEED_PATH, "utf8")) as ShowcaseSeed;
  } catch {
    seedCache = null;
  }
  return seedCache;
}

/** The starting database in showcase mode: the seed project and its queue. */
export async function initialDb(): Promise<DB> {
  const empty: DB = { projects: [], drafts: [], runs: [] };
  const seed = isShowcase() ? await loadSeed() : null;
  if (!seed) return empty;
  const p = { ...seed.project, showcase: true };
  const at = p.createdAt;
  return {
    projects: [p],
    drafts: seed.drafts.map((d, i) => ({
      ...d,
      id: `seed${i}`,
      projectId: p.id,
      status: "pending",
      createdAt: at,
      updatedAt: at,
    })),
    runs: [
      { id: "seedrun1", projectId: p.id, agent: "strategy", status: "success", message: `Analysed ${p.site.pages.length} pages and built the strategy.`, draftCount: 0, demo: false, createdAt: at },
      { id: "seedrun2", projectId: p.id, agent: "documents", status: "success", message: "Wrote 5 strategy documents for the agents.", draftCount: 0, demo: false, createdAt: at },
      { id: "seedrun3", projectId: p.id, agent: "seo", status: "success", message: `Website audit score ${p.audit?.score ?? "—"}/100.`, draftCount: 0, demo: false, createdAt: at },
    ],
  };
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
