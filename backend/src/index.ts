import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { articles, articleDetails } from "./demo/demoData.js";
import {
  getAllArticles,
  getArticleById,
  getArticleCount,
  getStoriesWithArticles,
  getStoryById,
  getStoryCount,
  getArticlesByIds,
} from "./storage/db.js";
import { storedToApiShape } from "./lib/apiShape.js";
import { storyToApiShape, storyToDetailShape } from "./lib/storyApiShape.js";
import { runIngestion } from "./services/ingestRSS.js";
import { runClustering } from "./services/clusterStories.js";

const fastify = Fastify({ logger: true });

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const INGEST_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

await fastify.register(cors, {
  origin: "http://localhost:8080",
});

// Health check
fastify.get("/health", async () => ({ ok: true }));

// GET /api/articles - demo-friendly feed: 2–4 sources (fallback 2–5 if <8), limit 15
fastify.get<{
  Querystring: { limit?: string };
}>("/api/articles", async (request, reply) => {
  try {
    const articleCount = await getArticleCount();
    if (articleCount === 0) return articles;

    const storyCount = await getStoryCount();
    if (storyCount > 0) {
      const limit = Math.min(30, Math.max(1, parseInt(request.query.limit ?? "15", 10) || 15));

      const storiesWithArticles = await getStoriesWithArticles();

      // Fetch articles for each story
      const allCandidates: Array<{
        story: (typeof storiesWithArticles)[0]["story"];
        articleIds: string[];
        storyArticles: Awaited<ReturnType<typeof getArticlesByIds>>;
      }> = [];
      for (const { story, articleIds } of storiesWithArticles) {
        const storyArticles = await getArticlesByIds(articleIds);
        if (storyArticles.length > 0) {
          allCandidates.push({ story, articleIds, storyArticles });
        }
      }

      // Filter by sources (articleCount): 2–4 inclusive; if <8, fallback to 2–5
      const filterByRange = (min: number, max: number) =>
        allCandidates.filter((c) => {
          const s = c.storyArticles.length;
          return s >= min && s <= max;
        });

      let candidates = filterByRange(2, 4);
      if (candidates.length < 8) candidates = filterByRange(2, 5);

      // Sort: sources desc, then newest publishedAt desc
      candidates.sort((a, b) => {
        const sourcesA = a.storyArticles.length;
        const sourcesB = b.storyArticles.length;
        if (sourcesB !== sourcesA) return sourcesB - sourcesA;
        const newestA = Math.max(...a.storyArticles.map((x) => new Date(x.publishedAt).getTime()));
        const newestB = Math.max(...b.storyArticles.map((x) => new Date(x.publishedAt).getTime()));
        return newestB - newestA;
      });

      const limited = candidates.slice(0, limit);
      const result = limited.map(({ story, storyArticles }) =>
        storyToApiShape(story, storyArticles)
      );
      if (result.length > 0) return result;
    }

    const stored = await getAllArticles();
    return stored.map(storedToApiShape);
  } catch (err) {
    fastify.log.warn(err, "Storage fallback to demo data");
  }
  return articles;
});

// GET /api/articles/:id
fastify.get<{ Params: { id: string } }>("/api/articles/:id", async (request, reply) => {
  const { id } = request.params;
  try {
    const storyData = await getStoryById(id);
    if (storyData) {
      const { story, articleIds } = storyData;
      const storyArticles = await getArticlesByIds(articleIds);
      if (storyArticles.length > 0) {
        // fullContent only when articleCount is 3 or 4
        const articleCount = storyArticles.length;
        const includeFullContent = articleCount === 3 || articleCount === 4;
        return await storyToDetailShape(story, storyArticles, includeFullContent);
      }
    }

    const stored = await getArticleById(id);
    if (stored) {
      return storedToApiShape(stored);
    }
  } catch (err) {
    fastify.log.warn(err, "Storage lookup failed, trying demo");
  }
  const detail = articleDetails[id];
  if (detail) return detail;
  const article = articles.find((a) => a.id === id);
  if (article) return article;
  reply.status(404);
  return { error: "Article not found" };
});

// POST /api/admin/ingest
fastify.post("/api/admin/ingest", async () => {
  try {
    const { ingested, errors } = await runIngestion();
    try {
      await runClustering();
    } catch (clusterErr) {
      fastify.log.warn(clusterErr, "Clustering after ingest failed");
    }
    return { ingested, errors };
  } catch (err) {
    fastify.log.error(err, "Ingestion failed");
    throw err;
  }
});

// POST /api/admin/cluster
fastify.post("/api/admin/cluster", async () => {
  try {
    const result = await runClustering();
    return result;
  } catch (err) {
    fastify.log.error(err, "Clustering failed");
    throw err;
  }
});

function startScheduler(): void {
  const run = () => {
    runIngestion()
      .then(async ({ ingested, errors }) => {
        fastify.log.info({ ingested, errors }, "Scheduled ingestion complete");
        try {
          await runClustering();
        } catch (clusterErr) {
          fastify.log.warn(clusterErr, "Scheduled clustering failed");
        }
      })
      .catch((err) => {
        fastify.log.warn(err, "Scheduled ingestion failed");
      });
  };
  setTimeout(run, 60_000);
  setInterval(run, INGEST_INTERVAL_MS);
}

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`Server running at http://localhost:${PORT}`);
    startScheduler();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
