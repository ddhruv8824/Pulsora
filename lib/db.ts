import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { BlobError, BlobPreconditionFailedError, get, put } from "@vercel/blob";
import type { AgentRun, DB, Draft, Project } from "./types";

// Storage: one JSON document holding every project, draft and run.
// - Locally it lives in data/pulsora.json.
// - Online (Vercel) it lives in a private Vercel Blob, because serverless
//   instances have no shared disk. Reads bypass the CDN cache and writes are
//   conditional on the ETag, so concurrent updates retry instead of clobbering.
// Swap this module for Postgres when moving beyond the MVP.

const DB_PATH = path.join(process.cwd(), "data", "pulsora.json");
const BLOB_PATH = "pulsora/db.json";
const EMPTY: DB = { projects: [], drafts: [], runs: [] };

type Snapshot = { db: DB; etag?: string };

const useBlob = () => !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

async function readSnapshot(): Promise<Snapshot> {
  if (useBlob()) {
    const res = await get(BLOB_PATH, { access: "private", useCache: false });
    if (!res || res.statusCode !== 200) return { db: structuredClone(EMPTY) };
    return { db: JSON.parse(await new Response(res.stream).text()) as DB, etag: res.blob.etag };
  }
  try {
    return { db: JSON.parse(await fs.readFile(DB_PATH, "utf8")) as DB };
  } catch {
    return { db: structuredClone(EMPTY) };
  }
}

/** Returns false when someone else wrote first (caller re-reads and retries). */
async function writeSnapshot(db: DB, etag?: string): Promise<boolean> {
  const body = JSON.stringify(db, null, 2);
  if (useBlob()) {
    try {
      await put(BLOB_PATH, body, {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: !!etag,
        ...(etag && { ifMatch: etag }),
        cacheControlMaxAge: 60,
      });
      return true;
    } catch (err) {
      if (err instanceof BlobPreconditionFailedError) return false;
      // First write races another first write: the blob now exists, so retry as an update.
      if (!etag && err instanceof BlobError) return false;
      throw err;
    }
  }
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  const tmp = `${DB_PATH}.${process.pid}.tmp`;
  await fs.writeFile(tmp, body);
  await fs.rename(tmp, DB_PATH);
  return true;
}

async function load(): Promise<DB> {
  return (await readSnapshot()).db;
}

// Serializes writes inside one process; ETags handle writes across instances.
let lock: Promise<unknown> = Promise.resolve();

/** Run `fn` against a fresh copy of the DB and persist the result. */
function mutate<T>(fn: (db: DB) => T): Promise<T> {
  const next = lock.then(async () => {
    for (let attempt = 0; attempt < 6; attempt++) {
      const { db, etag } = await readSnapshot();
      const result = fn(db);
      if (await writeSnapshot(db, etag)) return result;
      await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
    }
    throw new Error("Could not save changes because of concurrent updates. Please retry.");
  });
  lock = next.catch(() => undefined);
  return next;
}

export const newId = () => randomUUID().slice(0, 8);
const now = () => new Date().toISOString();

// ---------- Projects ----------

export async function listProjects(): Promise<Project[]> {
  const db = await load();
  return [...db.projects].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getProject(id: string): Promise<Project | undefined> {
  return (await load()).projects.find((p) => p.id === id);
}

export async function createProject(p: Omit<Project, "id" | "createdAt">): Promise<Project> {
  const project: Project = { ...p, id: newId(), createdAt: now() };
  await mutate((db) => db.projects.push(project));
  return project;
}

export async function updateProject(id: string, patch: Partial<Project>): Promise<Project | undefined> {
  return mutate((db) => {
    const p = db.projects.find((x) => x.id === id);
    if (p) Object.assign(p, patch);
    return p;
  });
}

export async function deleteProject(id: string): Promise<void> {
  await mutate((db) => {
    db.projects = db.projects.filter((p) => p.id !== id);
    db.drafts = db.drafts.filter((d) => d.projectId !== id);
    db.runs = db.runs.filter((r) => r.projectId !== id);
  });
}

// ---------- Drafts ----------

export async function listDrafts(projectId: string): Promise<Draft[]> {
  const db = await load();
  return db.drafts
    .filter((d) => d.projectId === projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addDrafts(
  drafts: Omit<Draft, "id" | "createdAt" | "updatedAt" | "status">[],
): Promise<Draft[]> {
  const created: Draft[] = drafts.map((d) => ({
    ...d,
    id: newId(),
    status: "pending",
    createdAt: now(),
    updatedAt: now(),
  }));
  await mutate((db) => db.drafts.push(...created));
  return created;
}

export async function updateDraft(
  id: string,
  patch: Partial<Pick<Draft, "status" | "title" | "body">>,
): Promise<Draft | undefined> {
  return mutate((db) => {
    const d = db.drafts.find((x) => x.id === id);
    if (d) Object.assign(d, patch, { updatedAt: now() });
    return d;
  });
}

// ---------- Runs (activity log) ----------

export async function addRun(r: Omit<AgentRun, "id" | "createdAt">): Promise<AgentRun> {
  const run: AgentRun = { ...r, id: newId(), createdAt: now() };
  await mutate((db) => db.runs.push(run));
  return run;
}

export async function listRuns(projectId: string): Promise<AgentRun[]> {
  const db = await load();
  return db.runs
    .filter((r) => r.projectId === projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
