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
const FULL_CONTENT_STORY_LIMIT = 3;

await fastify.register(cors, {
  origin: "http://localhost:8080",
});

// Health check
fastify.get("/health", async () => ({ ok: true }));

// GET /api/articles
fastify.get("/api/articles", async () => {
  try {
    const articleCount = await getArticleCount();
    if (articleCount === 0) return articles;

    const storyCount = await getStoryCount();
    if (storyCount > 0) {
      const storiesWithArticles = await getStoriesWithArticles();
      const result = [];
      for (const { story, articleIds } of storiesWithArticles) {
        const storyArticles = await getArticlesByIds(articleIds);
        if (storyArticles.length > 0) {
          result.push(storyToApiShape(story, storyArticles));
        }
      }
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
        const storiesWithArticles = await getStoriesWithArticles();
        const sortedByNewest = storiesWithArticles.sort(
          (a, b) => new Date(b.story.updatedAt).getTime() - new Date(a.story.updatedAt).getTime()
        );
        const newestIds = sortedByNewest.slice(0, FULL_CONTENT_STORY_LIMIT).map((s) => s.story.storyId);
        const includeFullContent = newestIds.includes(id);
        return storyToDetailShape(story, storyArticles, includeFullContent);
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
