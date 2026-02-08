import type { ArticleBase } from "../demo/demoData.js";
import type { StoredArticle } from "../storage/db.js";

const PLACEHOLDER_SIGNALS = {
  hasAttributionClarity: true,
  sourceDiversity: "moderate" as const,
  hasPrimaryData: false,
  sensationalLanguageDetected: false,
};

const PLACEHOLDER_BREAKDOWN = {
  factual: 70,
  opinion: 15,
  interpretation: 15,
};

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

export function storedToApiShape(stored: StoredArticle): ArticleBase {
  return {
    id: stored.id,
    title: stored.title,
    summary: stored.summary,
    topic: stored.topic as "Politics" | "Climate" | "Business",
    sources: 1,
    timeAgo: formatTimeAgo(stored.publishedAt),
    transparencySignals: PLACEHOLDER_SIGNALS,
    contentBreakdown: PLACEHOLDER_BREAKDOWN,
  };
}
