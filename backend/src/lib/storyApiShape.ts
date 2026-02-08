import type { ArticleBase, ArticleDetail, FullContentBlock } from "../demo/demoData.js";
import type { StoredArticle } from "../storage/db.js";
import type { StoredStory } from "../storage/db.js";
import { computeStorySignals } from "../services/storySignals.js";

const WIRE_LIKE = new Set(["Reuters", "AP", "AFP", "Associated Press", "BBC"]);
const INSTITUTION_LIKE = new Set(["NASA", "European Commission", "WTO", "IEA", "CDC", "NASA Climate"]);

function inferSourceType(publisher: string): string {
  if (WIRE_LIKE.has(publisher)) return "Wire Service";
  if (INSTITUTION_LIKE.has(publisher)) return "Institution";
  return "Publication";
}

function formatTimeAgo(isoDate: string): string {
  const d = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

function pickStorySummary(articles: StoredArticle[]): string {
  const sorted = [...articles].sort(
    (a, b) => b.summary.length - a.summary.length
  );
  const best = sorted[0];
  if (!best) return "";
  if (articles.length === 1) return best.summary;
  const parts = [best.summary];
  for (const a of sorted.slice(1, 3)) {
    if (a.summary !== best.summary && a.summary.length > 50) {
      const excerpt = a.summary.slice(0, 150).trim();
      if (excerpt && !parts.some((p) => p.includes(excerpt.slice(0, 30)))) {
        parts.push(excerpt + (a.summary.length > 150 ? "…" : ""));
      }
    }
  }
  return parts.length > 1 ? parts.join(" ") : best.summary;
}

export function storyToApiShape(
  story: StoredStory,
  articles: StoredArticle[]
): ArticleBase {
  const signals = computeStorySignals(articles);
  const sources = articles.length; // Article count (distinct sources in cluster)
  const newest = articles.reduce((a, b) =>
    a.publishedAt > b.publishedAt ? a : b
  );
  const summary = pickStorySummary(articles);

  return {
    id: story.storyId,
    title: story.storyTitle,
    summary,
    topic: story.topic as "Politics" | "Climate" | "Business",
    sources,
    timeAgo: formatTimeAgo(newest.publishedAt),
    transparencySignals: signals.transparencySignals,
    contentBreakdown: signals.contentBreakdown,
  };
}

export function storyToDetailShape(
  story: StoredStory,
  articles: StoredArticle[],
  includeFullContent: boolean
): ArticleDetail {
  const base = storyToApiShape(story, articles);

  const sourcesDetail = [
    ...new Set(articles.map((a) => a.publisher)),
  ].map((name) => ({ name, type: inferSourceType(name) }));

  const quotedVoices: Array<{ name: string; role: string }> = [];
  const text = articles.map((a) => a.summary).join(" ");
  const attrMatch = text.match(/according to ([^,.]+)/gi);
  if (attrMatch) {
    for (const m of attrMatch.slice(0, 3)) {
      const name = m.replace(/according to\s+/i, "").trim();
      if (name.length > 3) quotedVoices.push({ name, role: "Source" });
    }
    const seen = new Set(quotedVoices.map((v) => v.name));
    quotedVoices.length = 0;
    for (const m of attrMatch.slice(0, 5)) {
      const name = m.replace(/according to\s+/i, "").trim();
      if (name.length > 3 && !seen.has(name)) {
        seen.add(name);
        quotedVoices.push({ name, role: "Source" });
      }
    }
  }

  let fullContent: FullContentBlock[] | undefined;
  if (includeFullContent && articles.length > 0) {
    const combined = articles.map((a) => a.summary).join(" ");
    const blocks: FullContentBlock[] = [];
    const factualSummary = pickStorySummary(articles);
    if (factualSummary) {
      blocks.push({ type: "factual", text: factualSummary });
    }
    const quoteMatch = combined.match(/"([^"]{20,})"(\s+(?:said|stated|argued|explained)\s+[^."]+)?/g);
    if (quoteMatch && quoteMatch.length > 0) {
      for (const q of quoteMatch.slice(0, 2)) {
        const inner = q.match(/"([^"]+)"/);
        if (inner) {
          blocks.push({ type: "opinion", attribution: "Source", text: inner[1] });
        }
      }
    }
    blocks.push({
      type: "interpretation",
      text: `Coverage from ${sourcesDetail.length} sources. Combined analysis of the reporting.`,
    });
    fullContent = blocks;
  }

  return {
    ...base,
    sourcesDetail,
    quotedVoices,
    ...(fullContent ? { fullContent } : {}),
  };
}
