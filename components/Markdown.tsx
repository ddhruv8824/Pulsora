import { Fragment } from "react";

// Minimal Markdown renderer for agent-written documents: headings, bullets,
// numbered lists, blockquotes, **bold** and paragraphs. No HTML is ever injected.
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}

export function Markdown({ source }: { source: string }) {
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag key={blocks.length} className={`my-2 space-y-1 pl-5 text-sm ${list.ordered ? "list-decimal" : "list-disc"}`}>
        {list.items.map((it, i) => <li key={i}>{inline(it)}</li>)}
      </Tag>,
    );
    list = null;
  };

  for (const raw of source.split("\n")) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*]\s+(.*)/);
    const num = line.match(/^\s*\d+[.)]\s+(.*)/);
    if (bullet || num) {
      const ordered = !!num;
      if (!list || list.ordered !== ordered) { flush(); list = { ordered, items: [] }; }
      list.items.push((bullet ?? num)![1]);
      continue;
    }
    flush();
    if (!line.trim()) continue;
    const k = blocks.length;
    if (line.startsWith("### ")) blocks.push(<h4 key={k} className="mt-4 mb-1 text-sm font-semibold">{inline(line.slice(4))}</h4>);
    else if (line.startsWith("## ")) blocks.push(<h3 key={k} className="mt-6 mb-2 text-xs font-medium uppercase tracking-widest muted font-mono">{inline(line.slice(3))}</h3>);
    else if (line.startsWith("# ")) blocks.push(<h2 key={k} className="mb-3 text-xl font-semibold tracking-tight">{inline(line.slice(2))}</h2>);
    else if (line.startsWith("> ")) blocks.push(<blockquote key={k} className="my-3 border-l-2 border-app pl-3 text-sm muted">{inline(line.slice(2))}</blockquote>);
    else blocks.push(<p key={k} className="my-2 text-sm leading-relaxed">{inline(line)}</p>);
  }
  flush();
  return <div>{blocks}</div>;
}
