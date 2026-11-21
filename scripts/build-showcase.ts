/**
 * Build the investor-demo data by running the real Pulsora pipeline once.
 *
 *   ANTHROPIC_API_KEY=... npm run showcase -- https://company.com
 *
 * Writes seed/showcase.json: the project (site crawl, strategy, 5 documents,
 * audit), the drafts already in the approval queue, and extra draft batches
 * that "Run agent" hands out in showcase mode.
 */
import { promises as fs } from "fs";
import path from "path";
import { runAgent, type DraftInput } from "../lib/agents";
import { crawlSite } from "../lib/crawl";
import { buildDocuments } from "../lib/documents";
import { isDemoMode } from "../lib/llm";
import { buildAudit } from "../lib/seo";
import type { ShowcaseSeed } from "../lib/showcase";
import { buildStrategy } from "../lib/strategy";
import { AGENTS, type AgentId, type Project } from "../lib/types";

const RESERVE_BATCHES = 2;

async function main() {
  const url = process.argv[2];
  if (!url) throw new Error("Usage: npm run showcase -- https://company.com");
  if (isDemoMode()) console.warn("⚠ No ANTHROPIC_API_KEY: building with SAMPLE output, not real AI analysis.");

  console.log(`Crawling ${url}…`);
  const { site, homepageHtml } = await crawlSite(url);
  console.log(`  ${site.pages.length} pages`);

  console.log("Building strategy…");
  const strategy = await buildStrategy(site);
  console.log(`  ${strategy.companyName}: ${strategy.oneLiner}`);

  console.log("Writing documents + auditing…");
  const [documents, audit] = await Promise.all([buildDocuments(site, strategy), buildAudit(site.url, homepageHtml, strategy)]);
  console.log(`  audit score ${audit.score}`);

  const project: Project = {
    id: "demo",
    url: site.url,
    createdAt: new Date().toISOString(),
    site,
    strategy,
    documents,
    audit,
    demo: isDemoMode(),
    showcase: true,
  };

  const drafts: ShowcaseSeed["drafts"] = [];
  const reserve: ShowcaseSeed["reserve"] = {};
  for (const agent of AGENTS as readonly AgentId[]) {
    const batches: DraftInput[][] = [];
    for (let i = 0; i <= RESERVE_BATCHES; i++) {
      console.log(`Agent ${agent} (${i + 1}/${RESERVE_BATCHES + 1})…`);
      try {
        batches.push((await runAgent(agent, project)).drafts);
      } catch (err) {
        console.warn(`  failed: ${err instanceof Error ? err.message : err}`);
      }
    }
    const [first, ...rest] = batches;
    drafts.push(...(first ?? []).map((d) => ({ ...d, agent })));
    reserve[agent] = rest;
  }

  const seed: ShowcaseSeed = { project, drafts, reserve };
  const out = path.join(process.cwd(), "seed", "showcase.json");
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, JSON.stringify(seed, null, 2));
  console.log(`\n✓ Wrote ${out}: ${drafts.length} queued drafts, ${Object.values(reserve).flat(2).length} reserve drafts.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
