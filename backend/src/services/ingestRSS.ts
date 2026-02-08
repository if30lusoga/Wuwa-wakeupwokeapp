import Parser from "rss-parser";
import { createHash } from "node:crypto";
import { rssSources } from "../config/sources.js";
import type { StoredArticle } from "../storage/db.js";
import { insertArticles } from "../storage/db.js";

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "WakeUpNews/1.0 RSS Ingestion" },
});

function computeId(title: string, publisher: string, date: string): string {
  const str = `${title}|${publisher}|${date}`;
  return createHash("sha256").update(str).digest("hex").slice(0, 16);
}

function truncateSummary(text: string, maxLen: number = 500): string {
  const stripped = text.replace(/<[^>]+>/g, "").trim();
  if (stripped.length <= maxLen) return stripped;
  return stripped.slice(0, maxLen).trim() + "...";
}

function parseDate(item: { pubDate?: string; isoDate?: string }): string {
  const raw = item.isoDate ?? item.pubDate ?? new Date().toISOString();
  try {
    return new Date(raw).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export async function runIngestion(): Promise<{ ingested: number; errors: number }> {
  const allArticles: StoredArticle[] = [];
  const seenIds = new Set<string>();
  let errors = 0;

  for (const source of rssSources) {
    try {
      const feed = await parser.parseURL(source.url);
      const now = new Date().toISOString();

      for (const item of feed.items ?? []) {
        const title = item.title?.trim();
        if (!title) continue;

        const publishedAt = parseDate(item);
        const summary = item.contentSnippet
          ? truncateSummary(item.contentSnippet)
          : item.content
            ? truncateSummary(item.content)
            : truncateSummary(title);

        const id = computeId(title, source.publisher, publishedAt);
        if (seenIds.has(id)) continue;
        seenIds.add(id);

        allArticles.push({
          id,
          title,
          summary,
          topic: source.topic,
          region: source.region,
          publisher: source.publisher,
          publishedAt,
          createdAt: now,
          url: item.link?.trim() || undefined,
        });
      }
    } catch (err) {
      errors++;
      console.error(`[ingest] Feed failed: ${source.url} - ${String(err)}`);
    }
  }

  const ingested = await insertArticles(allArticles);
  return { ingested, errors };
}
