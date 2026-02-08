import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import NewsCard from "@/components/NewsCard";
import type { NewsArticle } from "@/components/NewsCard";
import { apiGet } from "@/lib/api";

const topics = ["All", "Politics", "Climate", "Business"] as const;

const DEMO_ID = "703bcc3b731cdddd";

const DEMO_FEED_ITEM: NewsArticle = {
  id: DEMO_ID,
  title: "Federal Courts Scrutinize ICE Detention Practices Amid Legal Challenges",
  summary: "Recent federal court rulings and investigative reporting have renewed scrutiny of U.S. Immigration and Customs Enforcement’s detention and enforcement practices. Judges have questioned aspects of detention conditions and due process, while ICE maintains its policies comply with federal law. Reporting highlights differing interpretations of the rulings and what they may mean for future enforcement.",
  topic: "Politics",
  sources: 13,
  timeAgo: "3h ago",
  transparencySignals: {
    hasAttributionClarity: true,
    sourceDiversity: "high",
    hasPrimaryData: true,
    sensationalLanguageDetected: false,
  },
  contentBreakdown: { factual: 65, opinion: 15, interpretation: 20 },
};



const Index = () => {
  const [activeTopic, setActiveTopic] = useState<string>("All");
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiGet<NewsArticle[]>("/api/articles")
      .then((data) => {
        if (!cancelled) {
          const withoutDemo = data.filter((a: any) => a.id !== DEMO_ID);
          setArticles([DEMO_FEED_ITEM, ...withoutDemo]);
        }

        
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filtered =
    activeTopic === "All"
      ? articles
      : articles.filter((a) => a.topic === activeTopic);

  return (
    <div>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2">
          Today's News
        </h1>
        <p className="text-muted-foreground text-sm max-w-lg">
          AI-summarized stories from multiple sources. Transparency signals help you understand how information is presented.
        </p>
      </motion.div>

      {/* Topic Filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {topics.map((topic) => (
          <button
            key={topic}
            onClick={() => setActiveTopic(topic)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTopic === topic
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {topic}
          </button>
        ))}
      </div>

      {/* Signal Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-3 rounded-lg bg-secondary/50 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Reading guide:</span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-signal-fact" />
          Factual reporting
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-signal-opinion" />
          Quoted opinion
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-signal-interpretation" />
          Analysis / interpretation
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-signal-sensational" />
          Framing detected
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-muted-foreground text-sm">Loading articles…</p>
      )}

      {/* Error */}
      {error && !loading && (
        <p className="text-destructive text-sm">Error: {error}</p>
      )}

      {/* News Grid */}
      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((article, i) => (
            <NewsCard key={article.id} article={article} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Index;
