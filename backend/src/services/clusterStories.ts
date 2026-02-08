import { createHash } from "node:crypto";
import type { StoredArticle } from "../storage/db.js";
import {
  getArticlesWithinHours,
  clearStoryTables,
  insertStory,
  linkStoryArticle,
  persistDb,
} from "../storage/db.js";

const CLUSTER_HOURS = 48; // Prefer 48h window for event clustering
const SIMILARITY_THRESHOLD = 0.27; // Lowered from 0.3 for entity-based grouping
const MAX_COMPARE_PER_GROUP = 200; // Limit comparisons to avoid O(n²) blowups

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "as", "is", "was", "are", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "must", "shall", "can", "need",
  "that", "which", "who", "whom", "this", "these", "those", "it", "its",
]);

const FLUFF = new Set([
  "breaking", "live", "update", "updates", "latest", "exclusive", "analysis", "opinion",
  "explainer", "watch", "video", "podcast", "photos", "why", "how", "what", "says", "said",
  "report", "reports", "amid", "after", "before", "new", "today",
]);

/** Known entity seeds: people, orgs, places, bill/case names */
const ENTITY_SEEDS = new Set([
  "pelosi", "nancy", "trump", "biden", "harris", "obama", "mcconnell", "schumer",
  "gaza", "israel", "hamas", "ukraine", "russia", "putin", "zelensky",
  "ice", "fbi", "cia", "epa", "fda", "sec", "nasa", "doj", "irs",
  "congress", "senate", "supreme", "court", "federal", "republican", "democrat",
  "california", "texas", "florida", "york", "washington", "china", "europe",
  "affordable", "care", "act", "infrastructure", "inflation", "reduction",
]);

/** Generic terms that do not count as entity tokens (over-grouping prevention) */
const GENERIC_ENTITY = new Set([
  "washington", "post", "state", "house", "senate", "court", "officials",
  "department", "agency", "congress", "federal", "supreme", "republican", "democrat",
  "white", "black", "new", "york", "times", "today", "news", "care", "act",
]);

const CLUSTER_CAP = 25;
const STRONG_MATCH_THRESHOLD = 12; // Above this, require strong match
const STRONG_JACCARD = 0.45;

/** Strip trailing publisher tags like "- BBC News", "| NPR", "— Reuters" */
function stripPublisherTags(title: string): string {
  // Pipe delimiter often indicates source: "Headline | NPR"
  let out = title.replace(/\s*\|\s*[A-Za-z0-9\s]{2,40}\s*$/, "");
  // Dash/em-dash with known publisher keywords
  out = out.replace(
    /\s*[-–—]\s*[A-Za-z0-9\s]*(?:News|NPR|Reuters|AP\b|CNN|BBC|Fox|NBC|CBS|Guardian|Times|Post|Journal|Tribune|AFP|UPI)\s*$/i,
    ""
  );
  return out.trim() || title.trim();
}

function normalizeTitle(title: string): string {
  const cleaned = stripPublisherTags(title);
  return cleaned
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

/** Key tokens: non-stopword, length>=5, not fluff */
function keyTokens(title: string): Set<string> {
  const toks = normalizeTitle(title).split(/\s+/).filter(Boolean);
  return new Set(toks.filter((t) => t.length >= 5 && !FLUFF.has(t)));
}

/** Entity-like tokens: capitalized words, acronyms, known seeds. Excludes GENERIC_ENTITY. */
function entityTokens(title: string): Set<string> {
  const cleaned = stripPublisherTags(title);
  const result = new Set<string>();

  const add = (t: string) => {
    const lower = t.toLowerCase();
    if (!GENERIC_ENTITY.has(lower)) result.add(lower);
  };

  // Capitalized words (potential names/orgs/places)
  const words = cleaned.split(/\s+/);
  for (const w of words) {
    const alpha = w.replace(/[^\w]/g, "");
    if (alpha.length >= 2 && alpha[0] === alpha[0].toUpperCase()) {
      add(alpha);
    }
  }

  // Acronyms: 2–5 uppercase letters
  const acronymMatch = cleaned.match(/\b[A-Z]{2,5}\b/g);
  if (acronymMatch) {
    for (const ac of acronymMatch) add(ac);
  }

  // Known entity seeds present as whole words in normalized title
  const normWords = new Set(normalizeTitle(cleaned).split(/\s+/).filter(Boolean));
  for (const seed of ENTITY_SEEDS) {
    if (normWords.has(seed) && !GENERIC_ENTITY.has(seed)) result.add(seed);
  }

  return result;
}

function sharedCount(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
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

function areSimilar(
  clusterSize: number,
  tokensA: Set<string>,
  tokensB: Set<string>,
  keysA: Set<string>,
  keysB: Set<string>,
  entitiesA: Set<string>,
  entitiesB: Set<string>
): boolean {
  const sharedKeys = sharedCount(keysA, keysB);
  const sharedEntities = sharedCount(entitiesA, entitiesB);
  const jaccard = jaccardSimilarity(tokensA, tokensB);

  // Hard cap: never grow beyond 25
  if (clusterSize >= CLUSTER_CAP) return false;

  // Above 12: require strong match only
  if (clusterSize >= STRONG_MATCH_THRESHOLD) {
    return (
      jaccard >= STRONG_JACCARD ||
      (sharedKeys >= 3 && sharedEntities >= 1)
    );
  }

  // Normal case: A) Jaccard, B) key tokens, or C) tightened entity rule
  if (jaccard >= SIMILARITY_THRESHOLD) return true;
  if (sharedKeys >= 2) return true;
  // Entity-only: require >= 2 shared entities, or 1 entity + 1 key
  if (sharedEntities >= 2) return true;
  if (sharedEntities >= 1 && sharedKeys >= 1) return true;
  return false;
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

export interface SizeBuckets {
  "1": number;
  "2-3": number;
  "4-6": number;
  "7-12": number;
  "13-25": number;
  ">25": number;
}

export interface ClusterDebugInfo {
  totalArticlesConsidered: number;
  clustersFormed: number;
  clustersMultiArticle: number;
  maxClusterSize: number;
  maxClusterTitle: string;
  sizeBuckets: SizeBuckets;
  topClusters: Array<{ storyTitle: string; size: number; publishers: string[] }>;
}

export async function runClustering(): Promise<{
  storiesCreated: number;
  articlesAssigned: number;
  clustersUpdated: number;
  totalArticlesConsidered: number;
  clustersFormed: number;
  clustersMultiArticle: number;
  maxClusterSize: number;
  maxClusterTitle: string;
  sizeBuckets: SizeBuckets;
  topClusters: Array<{ storyTitle: string; size: number; publishers: string[] }>;
}> {
  const articles = await getArticlesWithinHours(CLUSTER_HOURS);
  if (articles.length === 0) {
    return {
      storiesCreated: 0,
      articlesAssigned: 0,
      clustersUpdated: 0,
      totalArticlesConsidered: 0,
      clustersFormed: 0,
      clustersMultiArticle: 0,
      maxClusterSize: 0,
      maxClusterTitle: "",
      sizeBuckets: { "1": 0, "2-3": 0, "4-6": 0, "7-12": 0, "13-25": 0, ">25": 0 },
      topClusters: [],
    };
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
    // Limit to recent N for comparisons to avoid O(n²) blowups
    const limitedGroup = group.slice(0, MAX_COMPARE_PER_GROUP);

    const tokensCache = new Map<string, Set<string>>();
    const keysCache = new Map<string, Set<string>>();
    const entitiesCache = new Map<string, Set<string>>();

    const getTokens = (a: StoredArticle) => {
      if (!tokensCache.has(a.id)) tokensCache.set(a.id, tokenize(a.title));
      return tokensCache.get(a.id)!;
    };
    const getKeys = (a: StoredArticle) => {
      if (!keysCache.has(a.id)) keysCache.set(a.id, keyTokens(a.title));
      return keysCache.get(a.id)!;
    };
    const getEntities = (a: StoredArticle) => {
      if (!entitiesCache.has(a.id)) entitiesCache.set(a.id, entityTokens(a.title));
      return entitiesCache.get(a.id)!;
    };

    for (const article of limitedGroup) {
      if (assigned.has(article.id)) continue;
      const cluster: StoredArticle[] = [article];
      assigned.add(article.id);
      const queue = [article];

      while (queue.length > 0) {
        const current = queue.shift()!;
        const tokensA = getTokens(current);
        const keysA = getKeys(current);
        const entitiesA = getEntities(current);

        for (const other of limitedGroup) {
          if (assigned.has(other.id)) continue;
          const tokensB = getTokens(other);
          const keysB = getKeys(other);
          const entitiesB = getEntities(other);

          if (areSimilar(cluster.length, tokensA, tokensB, keysA, keysB, entitiesA, entitiesB)) {
            cluster.push(other);
            assigned.add(other.id);
            queue.push(other);
          }
        }
      }
      clusters.push(cluster);
    }

    // Articles beyond the comparison limit get single-article clusters (no orphans)
    for (const article of group.slice(MAX_COMPARE_PER_GROUP)) {
      if (!assigned.has(article.id)) {
        clusters.push([article]);
        assigned.add(article.id);
      }
    }
  }

  await clearStoryTables();

  let storiesCreated = 0;
  let articlesAssigned = 0;

  const multiArticle = clusters.filter((c) => c.length >= 2);
  const maxSize = clusters.length > 0 ? Math.max(...clusters.map((c) => c.length)) : 0;
  const maxCluster =
    clusters.length > 0
      ? clusters.reduce((a, b) => (b.length > a.length ? b : a))
      : null;
  const maxClusterTitle = maxCluster ? pickCanonicalTitle(maxCluster) : "";

  const sizeBuckets: SizeBuckets = {
    "1": 0,
    "2-3": 0,
    "4-6": 0,
    "7-12": 0,
    "13-25": 0,
    ">25": 0,
  };
  for (const c of clusters) {
    const s = c.length;
    if (s === 1) sizeBuckets["1"]++;
    else if (s <= 3) sizeBuckets["2-3"]++;
    else if (s <= 6) sizeBuckets["4-6"]++;
    else if (s <= 12) sizeBuckets["7-12"]++;
    else if (s <= 25) sizeBuckets["13-25"]++;
    else sizeBuckets[">25"]++;
  }

  // Build topClusters from multi-article clusters, sorted by size desc, take 5
  const topClusters = multiArticle
    .sort((a, b) => b.length - a.length)
    .slice(0, 5)
    .map((c) => ({
      storyTitle: pickCanonicalTitle(c),
      size: c.length,
      publishers: [...new Set(c.map((a) => a.publisher))],
    }));

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
    totalArticlesConsidered: articles.length,
    clustersFormed: clusters.length,
    clustersMultiArticle: multiArticle.length,
    maxClusterSize: maxSize,
    maxClusterTitle,
    sizeBuckets,
    topClusters,
  };
}
