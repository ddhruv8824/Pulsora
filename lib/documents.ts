import { siteToPrompt } from "./crawl";
import { generateObject, isDemoMode } from "./llm";
import { DocumentsSchema, type SiteSnapshot, type Strategy, type StrategyDocs } from "./types";

/**
 * Step 1 of the CMO workflow: write the five strategy documents every agent
 * reads before it drafts anything, so all channels stay on-message.
 */
export async function buildDocuments(site: SiteSnapshot, strategy: Strategy): Promise<StrategyDocs> {
  if (isDemoMode()) return demoDocuments(strategy);

  return generateObject({
    schema: DocumentsSchema,
    effort: "high",
    system: `Task: write the company's five core marketing documents, as a senior CMO would on their first week.
Each document is Markdown with "#" title, "##" sections and "-" bullets. Be specific to THIS company; no filler.
- product: Overview, What it does, Category, Target customers, Business model, Key features, Primary CTA.
- marketing: Positioning statement, Personas, Goals (90 days), Channel plan with rationale, Key messages.
- competitors: for each likely competitor: what they do, strengths, weaknesses, how we win; then a summary of our differentiation.
- brandVoice: Personality, Tone, Vocabulary to use / avoid, Do's and Don'ts, 3 example sentences.
- content: Content pillars, 10 topic ideas mapped to keywords and personas, Formats per channel, Weekly cadence.
Use only facts present in the website material or the strategy; where you infer, say so ("likely", "to validate").`,
    prompt: `<strategy>\n${JSON.stringify(strategy, null, 2)}\n</strategy>\n\n<website>\n${siteToPrompt(site)}\n</website>`,
  });
}

const bullets = (xs: string[]) => xs.map((x) => `- ${x}`).join("\n");
const DEMO = "\n\n> Demo document. Add an ANTHROPIC_API_KEY for a full, AI-written version.";

export function demoDocuments(s: Strategy): StrategyDocs {
  return {
    product: `# Product Information — ${s.companyName}

## Overview
${s.oneLiner}

## Category
${s.category}

## Target customers
${s.targetAudience}

## Value propositions
${bullets(s.valueProps)}${DEMO}`,
    marketing: `# Marketing Strategy — ${s.companyName}

## Personas
${s.personas.map((p) => `- **${p.name}** (${p.role}): ${p.painPoints.join("; ")}`).join("\n")}

## Channel plan
${s.channelPlan.map((c) => `- **${c.channel}** — ${c.priority}: ${c.why}`).join("\n")}

## First week
${s.firstWeekPlan.map((d) => `- **${d.day}:** ${d.task}`).join("\n")}${DEMO}`,
    competitors: `# Competitor Analysis — ${s.companyName}

## Competitors to watch
${bullets(s.competitors)}

## How we win
${bullets(s.valueProps)}${DEMO}`,
    brandVoice: `# Brand Voice — ${s.companyName}

## Personality
${s.brandVoice}

## Do
- Be specific and practical
- Lead with the customer's problem

## Don't
- Use hype or jargon
- Over-promise${DEMO}`,
    content: `# Content Strategy — ${s.companyName}

## Content pillars
${bullets(s.contentPillars)}

## Target keywords
${bullets(s.keywords)}

## Communities
${bullets(s.subreddits.map((r) => `r/${r}`))}${DEMO}`,
  };
}
