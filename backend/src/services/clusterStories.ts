import { createHash } from "node:crypto";
import type { StoredArticle } from "../storage/db.js";
import {
  getArticlesWithin24h,
  clearStoryTables,
  insertStory,
  linkStoryArticle,
  persistDb,
} from "../storage/db.js";

const SIMILARITY_THRESHOLD = 0.3;
const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "as", "is", "was", "are", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "must", "shall", "can", "need",
  "that", "which", "who", "whom", "this", "these", "those", "it", "its",
]);

const FLUFF = new Set([
  "breaking","live","update","updates","latest","exclusive","analysis","opinion",
  "explainer","watch","video","podcast","photos","why","how","what","says","said",
  "report","reports","amid","after","before","new","today",
]);

function keyTokens(title: string): Set<string> {
  // Use normalized tokens but prefer longer, more “meaningful” ones
  const toks = normalizeTitle(title).split(/\s+/).filter(Boolean);
  return new Set(toks.filter(t => t.length >= 5 && !FLUFF.has(t)));
}

function sharedCount(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
}


function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    .join(" ");
}

function tokenize(text: string): Set<string> {
  return new Set(normalizeTitle(text).split(/\s+/).filter(Boolean));
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const x of a) {
    if (b.has(x)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function pickCanonicalTitle(articles: StoredArticle[]): string {
  const normalizedCounts = new Map<string, { count: number; original: string }>();
  for (const a of articles) {
    const norm = normalizeTitle(a.title);
    if (!norm) continue;
    const existing = normalizedCounts.get(norm);
    if (existing) {
      existing.count++;
    } else {
      normalizedCounts.set(norm, { count: 1, original: a.title });
    }
  }
  let best = articles[0].title;
  let bestScore = 0;
  for (const [, { count, original }] of normalizedCounts) {
    const cleanLen = normalizeTitle(original).split(/\s+/).filter(Boolean).length;
    const score = count * 10 + cleanLen;
    if (score > bestScore) {
      bestScore = score;
      best = original;
    }
  }
  return best;
}

function computeStoryId(articleIds: string[]): string {
  const sorted = [...articleIds].sort();
  const str = sorted.join("|");
  return createHash("sha256").update(str).digest("hex").slice(0, 16);
}

export async function runClustering(): Promise<{
  storiesCreated: number;
  articlesAssigned: number;
  clustersUpdated: number;
}> {
  const articles = await getArticlesWithin24h();
  if (articles.length === 0) {
    return { storiesCreated: 0, articlesAssigned: 0, clustersUpdated: 0 };
  }

  const byTopicRegion = new Map<string, StoredArticle[]>();
  for (const a of articles) {
    const key = `${a.topic}|${a.region}`;
    if (!byTopicRegion.has(key)) byTopicRegion.set(key, []);
    byTopicRegion.get(key)!.push(a);
  }

  const clusters: StoredArticle[][] = [];
  const assigned = new Set<string>();

  for (const [, group] of byTopicRegion) {
    const tokensCache = new Map<string, Set<string>>();
    const getTokens = (a: StoredArticle) => {
      if (!tokensCache.has(a.id)) tokensCache.set(a.id, tokenize(a.title));
      return tokensCache.get(a.id)!;
    };

    for (const article of group) {
      if (assigned.has(article.id)) continue;
      const cluster: StoredArticle[] = [article];
      assigned.add(article.id);
      const queue = [article];

      while (queue.length > 0) {
        const current = queue.shift()!;
        const tokensA = getTokens(current);
        for (const other of group) {
          if (assigned.has(other.id)) continue;
          const tokensB = getTokens(other);
          const sim = jaccardSimilarity(tokensA, tokensB);

          const keysA = keyTokens(current.title);
          const keysB = keyTokens(other.title);
          const sharedKeys = sharedCount(keysA, keysB);

          // Cluster if either is true:
          const isSimilar = sim >= SIMILARITY_THRESHOLD || sharedKeys >= 2;

          if (isSimilar) {

            cluster.push(other);
            assigned.add(other.id);
            queue.push(other);
          }
        }
      }
      clusters.push(cluster);
    }
  }

  await clearStoryTables();

  let storiesCreated = 0;
  let articlesAssigned = 0;

  for (const cluster of clusters) {
    const articleIds = cluster.map((a) => a.id);
    const storyId = computeStoryId(articleIds);
    const storyTitle = pickCanonicalTitle(cluster);
    const topic = cluster[0].topic;
    const region = cluster[0].region;
    const rep = cluster.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
    await insertStory(storyId, storyTitle, topic, region, rep.id);
    storiesCreated++;
    for (const a of cluster) {
      await linkStoryArticle(storyId, a.id);
      articlesAssigned++;
    }
  }

  persistDb();
  return {
    storiesCreated,
    articlesAssigned,
    clustersUpdated: storiesCreated,
  };
}
