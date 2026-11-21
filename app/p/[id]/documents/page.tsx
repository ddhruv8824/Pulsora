import Link from "next/link";
import { Markdown } from "@/components/Markdown";
import { RunAgentButton } from "@/components/RunAgentButton";
import { getProject } from "@/lib/db";
import { DOC_KEYS, DOC_META, type DocKey } from "@/lib/types";

export default async function DocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ doc?: string }>;
}) {
  const { id } = await params;
  const { doc } = await searchParams;
  const project = (await getProject(id))!;
  const active: DocKey = DOC_KEYS.includes(doc as DocKey) ? (doc as DocKey) : "product";
  const docs = project.documents;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label">Step 1 — Research</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Strategy documents</h1>
          <p className="muted">Every agent reads these five documents before it writes a word, so all channels stay on-message.</p>
        </div>
        <RunAgentButton projectId={id} endpoint={`/api/projects/${id}/documents`} label={docs ? "Regenerate documents" : "Write documents"} className="btn btn-ghost" />
      </header>

      {!docs ? (
        <div className="panel p-10 text-center muted">No documents yet. Click “Write documents” to have your AI CMO write them.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <nav className="panel h-fit p-2">
            {DOC_KEYS.map((k) => (
              <Link
                key={k}
                href={`/p/${id}/documents?doc=${k}`}
                className={`block rounded-lg px-3 py-2.5 ${k === active ? "bg-[var(--bg)] font-medium" : "hover:bg-[var(--bg)]"}`}
              >
                <div className="text-sm">{DOC_META[k].title}</div>
                <div className="font-mono text-[11px] muted">{DOC_META[k].file}</div>
              </Link>
            ))}
            <p className="px-3 pt-3 pb-2 text-xs muted">Read by every agent</p>
          </nav>
          <article className="panel min-w-0 p-6 sm:p-8">
            <div className="mb-4 flex items-center justify-between border-b border-app pb-3 font-mono text-xs muted">
              <span>{DOC_META[active].file}</span>
              <span>{project.demo ? "demo" : `generated ${new Date(project.createdAt).toLocaleDateString()}`}</span>
            </div>
            <Markdown source={docs[active]} />
          </article>
        </div>
      )}
    </div>
  );
}
