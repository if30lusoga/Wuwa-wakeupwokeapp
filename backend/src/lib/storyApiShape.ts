import type { ArticleBase, ArticleDetail, FullContentBlock } from "../demo/demoData.js";
import type { StoredArticle } from "../storage/db.js";
import type { StoredStory } from "../storage/db.js";
import { computeStorySignals } from "../services/storySignals.js";
import {
  synthesizeStoryDetail,
  synthesizeStoryDetailAsync,
  toArticleInput,
} from "../services/storyDetailSynthesis.js";

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

const SUMMARY_MAX_LENGTH = 240;

function truncateSummary(text: string): string {
  const flattened = text.replace(/\s+/g, " ").trim();
  if (flattened.length <= SUMMARY_MAX_LENGTH) return flattened;
  const cut = flattened.slice(0, SUMMARY_MAX_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  const end = lastSpace > SUMMARY_MAX_LENGTH * 0.6 ? lastSpace : SUMMARY_MAX_LENGTH;
  return flattened.slice(0, end).trim() + "…";
}

function pickStorySummary(articles: StoredArticle[]): string {
  const sorted = [...articles].sort(
    (a, b) => b.summary.length - a.summary.length
  );
  const best = sorted[0];
  if (!best) return "";
  if (articles.length === 1) return truncateSummary(best.summary);
  const parts = [best.summary];
  for (const a of sorted.slice(1, 3)) {
    if (a.summary !== best.summary && a.summary.length > 50) {
      const excerpt = a.summary.slice(0, 150).trim();
      if (excerpt && !parts.some((p) => p.includes(excerpt.slice(0, 30)))) {
        parts.push(excerpt + (a.summary.length > 150 ? "…" : ""));
      }
    }
  }
  const combined = parts.length > 1 ? parts.join(" ") : best.summary;
  return truncateSummary(combined);
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

export async function storyToDetailShape(
  story: StoredStory,
  articles: StoredArticle[],
  includeFullContent: boolean
): Promise<ArticleDetail> {
  const base = storyToApiShape(story, articles);

  // sourcesDetail: ALL underlying articles with { name, type, url, publishedAt }
  const sourcesDetail = articles.map((a) => ({
    name: a.publisher,
    type: inferSourceType(a.publisher),
    url: a.url,
    publishedAt: a.publishedAt,
  }));

  let quotedVoices: Array<{ name: string; role: string }> = [];
  let fullContent: FullContentBlock[] | undefined;

  if (includeFullContent && articles.length > 0) {
    const { fullContent: blocks, quotedVoices: voices } = await synthesizeStoryDetailAsync(
      articles.map(toArticleInput)
    );
    fullContent = blocks;
    quotedVoices = voices;
  } else {
    // quotedVoices from real quotes only (sync, no fullContent)
    const { quotedVoices: voices } = synthesizeStoryDetail(articles.map(toArticleInput));
    quotedVoices = voices;
  }

  return {
    ...base,
    sourcesDetail,
    quotedVoices,
    ...(fullContent ? { fullContent } : {}),
  };
}
