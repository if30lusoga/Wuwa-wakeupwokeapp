import initSqlJs, { type Database } from "sql.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export interface StoredArticle {
  id: string;
  title: string;
  summary: string;
  topic: string;
  region: string;
  publisher: string;
  publishedAt: string;
  createdAt: string;
  url?: string;
}

export interface StoredStory {
  storyId: string;
  storyTitle: string;
  topic: string;
  region: string;
  representativeArticleId: string | null;
  createdAt: string;
  updatedAt: string;
}

const DB_PATH = join(process.cwd(), "data", "articles.sqlite");

let db: Database | null = null;

function ensureStoryTables(database: Database): void {
  database.run(`
    CREATE TABLE IF NOT EXISTS stories (
      storyId TEXT PRIMARY KEY,
      storyTitle TEXT NOT NULL,
      topic TEXT NOT NULL,
      region TEXT NOT NULL,
      representativeArticleId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
  database.run(`
    CREATE TABLE IF NOT EXISTS story_articles (
      storyId TEXT NOT NULL,
      articleId TEXT NOT NULL,
      PRIMARY KEY (storyId, articleId),
      FOREIGN KEY (storyId) REFERENCES stories(storyId),
      FOREIGN KEY (articleId) REFERENCES articles(id)
    )
  `);
  database.run(`CREATE INDEX IF NOT EXISTS idx_story_articles_story ON story_articles(storyId)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_story_articles_article ON story_articles(articleId)`);
}

async function getDb(): Promise<Database> {
  if (db) return db;
  const SQL = await initSqlJs();
  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    db.run(`
      CREATE TABLE articles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        topic TEXT NOT NULL,
        region TEXT NOT NULL,
        publisher TEXT NOT NULL,
        publishedAt TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        url TEXT
      )
    `);
    db.run(`CREATE INDEX idx_articles_published ON articles(publishedAt DESC)`);
  }
  ensureStoryTables(db);
  // Migration: add url column if missing (existing DBs)
  try {
    const info = db.exec(`PRAGMA table_info(articles)`);
    const rows = info[0]?.values ?? [];
    const colNames = rows.map((r: unknown[]) => (r as unknown[])[1]);
    if (!colNames.includes("url")) {
      db.run(`ALTER TABLE articles ADD COLUMN url TEXT`);
      persistDb();
    }
  } catch {
    /* ignore */
  }
  return db;
}

export function persistDb(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  const dir = join(process.cwd(), "data");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(DB_PATH, buffer);
}

export async function insertArticles(articles: StoredArticle[]): Promise<number> {
  const database = await getDb();
  let inserted = 0;
  const stmt = database.prepare(`
    INSERT OR IGNORE INTO articles (id, title, summary, topic, region, publisher, publishedAt, createdAt, url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const a of articles) {
    const before = database.getRowsModified();
    stmt.run([a.id, a.title, a.summary, a.topic, a.region, a.publisher, a.publishedAt, a.createdAt, a.url ?? null]);
    if (database.getRowsModified() > before) inserted++;
  }
  stmt.free();
  persistDb();
  return inserted;
}

export async function getAllArticles(): Promise<StoredArticle[]> {
  const database = await getDb();
  const rows = database.exec(`SELECT id, title, summary, topic, region, publisher, publishedAt, createdAt, url
    FROM articles ORDER BY publishedAt DESC`);
  if (!rows.length || !rows[0].values.length) return [];
  const cols = rows[0].columns as string[];
  return rows[0].values.map((row: unknown[]) => {
    const r = row as unknown[];
    const obj: StoredArticle = {
      id: r[cols.indexOf("id")],
      title: r[cols.indexOf("title")],
      summary: r[cols.indexOf("summary")],
      topic: r[cols.indexOf("topic")],
      region: r[cols.indexOf("region")],
      publisher: r[cols.indexOf("publisher")],
      publishedAt: r[cols.indexOf("publishedAt")],
      createdAt: r[cols.indexOf("createdAt")],
    };
    const urlIdx = cols.indexOf("url");
    if (urlIdx >= 0 && r[urlIdx]) obj.url = r[urlIdx] as string;
    return obj;
  }) as StoredArticle[];
}

export async function getArticlesWithin24h(): Promise<StoredArticle[]> {
  return getArticlesWithinHours(24);
}

/** Fetch articles published within the last N hours. Used for clustering. */
export async function getArticlesWithinHours(hours: number): Promise<StoredArticle[]> {
  const database = await getDb();
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const stmt = database.prepare(`SELECT id, title, summary, topic, region, publisher, publishedAt, createdAt, url
    FROM articles WHERE publishedAt >= ? ORDER BY publishedAt DESC`);
  stmt.bind([since]);
  const result: StoredArticle[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as Record<string, string>;
    const a: StoredArticle = row as unknown as StoredArticle;
    if (row.url) a.url = row.url;
    result.push(a);
  }
  stmt.free();
  return result;
}

export async function getArticlesByIds(ids: string[]): Promise<StoredArticle[]> {
  if (ids.length === 0) return [];
  const database = await getDb();
  const result: StoredArticle[] = [];
  const stmt = database.prepare(`SELECT id, title, summary, topic, region, publisher, publishedAt, createdAt, url
    FROM articles WHERE id = ?`);
  for (const id of ids) {
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject() as Record<string, string>;
      const a: StoredArticle = row as unknown as StoredArticle;
      if (row.url) a.url = row.url;
      result.push(a);
    }
    stmt.reset();
  }
  stmt.free();
  return result;
}

export async function getArticleById(id: string): Promise<StoredArticle | null> {
  const database = await getDb();
  const stmt = database.prepare(`SELECT id, title, summary, topic, region, publisher, publishedAt, createdAt, url
    FROM articles WHERE id = ?`);
  stmt.bind([id]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject() as Record<string, string>;
  stmt.free();
  const a: StoredArticle = row as unknown as StoredArticle;
  if (row.url) a.url = row.url;
  return a;
}

export async function getArticleCount(): Promise<number> {
  const database = await getDb();
  const result = database.exec(`SELECT COUNT(*) as c FROM articles`);
  return (result[0]?.values[0]?.[0] as number) ?? 0;
}

export async function clearStoryTables(): Promise<void> {
  const database = await getDb();
  database.run(`DELETE FROM story_articles`);
  database.run(`DELETE FROM stories`);
  persistDb();
}

export async function insertStory(storyId: string, storyTitle: string, topic: string, region: string, representativeArticleId: string | null): Promise<void> {
  const database = await getDb();
  const now = new Date().toISOString();
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO stories (storyId, storyTitle, topic, region, representativeArticleId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run([storyId, storyTitle, topic, region, representativeArticleId, now, now]);
  stmt.free();
  persistDb();
}

export async function linkStoryArticle(storyId: string, articleId: string): Promise<void> {
  const database = await getDb();
  const stmt = database.prepare(`INSERT OR IGNORE INTO story_articles (storyId, articleId) VALUES (?, ?)`);
  stmt.run([storyId, articleId]);
  stmt.free();
  persistDb();
}

export async function getStoriesWithArticles(): Promise<Array<{ story: StoredStory; articleIds: string[] }>> {
  const database = await getDb();
  const storyRows = database.exec(`SELECT storyId, storyTitle, topic, region, representativeArticleId, createdAt, updatedAt
    FROM stories ORDER BY updatedAt DESC`);
  if (!storyRows.length || !storyRows[0].values.length) return [];
  const cols = storyRows[0].columns as string[];
  const stories: Array<{ story: StoredStory; articleIds: string[] }> = [];
  for (const row of storyRows[0].values) {
    const storyId = row[cols.indexOf("storyId")] as string;
    const linkStmt = database.prepare(`SELECT articleId FROM story_articles WHERE storyId = ?`);
    linkStmt.bind([storyId]);
    const articleIds: string[] = [];
    while (linkStmt.step()) {
      articleIds.push((linkStmt.getAsObject() as { articleId: string }).articleId);
    }
    linkStmt.free();
    stories.push({
      story: {
        storyId,
        storyTitle: row[cols.indexOf("storyTitle")] as string,
        topic: row[cols.indexOf("topic")] as string,
        region: row[cols.indexOf("region")] as string,
        representativeArticleId: (row[cols.indexOf("representativeArticleId")] as string) || null,
        createdAt: row[cols.indexOf("createdAt")] as string,
        updatedAt: row[cols.indexOf("updatedAt")] as string,
      },
      articleIds,
    });
  }
  return stories;
}

export async function getStoryById(storyId: string): Promise<{ story: StoredStory; articleIds: string[] } | null> {
  const database = await getDb();
  const stmt = database.prepare(`SELECT storyId, storyTitle, topic, region, representativeArticleId, createdAt, updatedAt
    FROM stories WHERE storyId = ?`);
  stmt.bind([storyId]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject() as Record<string, string>;
  stmt.free();
  const linkStmt = database.prepare(`SELECT articleId FROM story_articles WHERE storyId = ?`);
  linkStmt.bind([storyId]);
  const articleIds: string[] = [];
  while (linkStmt.step()) {
    articleIds.push((linkStmt.getAsObject() as { articleId: string }).articleId);
  }
  linkStmt.free();
  return {
    story: {
      storyId: row.storyId,
      storyTitle: row.storyTitle,
      topic: row.topic,
      region: row.region,
      representativeArticleId: row.representativeArticleId || null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
    articleIds,
  };
}

export async function getStoryCount(): Promise<number> {
  const database = await getDb();
  const result = database.exec(`SELECT COUNT(*) as c FROM stories`);
  return (result[0]?.values[0]?.[0] as number) ?? 0;
}
