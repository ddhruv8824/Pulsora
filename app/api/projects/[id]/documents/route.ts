import { NextResponse } from "next/server";
import { addRun, getProject, updateProject } from "@/lib/db";
import { buildDocuments } from "@/lib/documents";
import { describeError, isDemoMode } from "@/lib/llm";

export const maxDuration = 300;

/** Regenerate the five strategy documents. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  try {
    const documents = await buildDocuments(project.site, project.strategy);
    await updateProject(id, { documents });
    await addRun({ projectId: id, agent: "documents", status: "success", message: "Rewrote the 5 strategy documents.", draftCount: 0, demo: isDemoMode() });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: describeError(err) }, { status: 500 });
  }
}
