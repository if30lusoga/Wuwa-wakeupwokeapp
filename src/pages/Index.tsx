import { useState } from "react";
import { motion } from "framer-motion";
import NewsCard from "@/components/NewsCard";
import { mockArticles } from "@/data/mockData";

const topics = ["All", "Politics", "Climate", "Business"] as const;

const Index = () => {
  const [activeTopic, setActiveTopic] = useState<string>("All");

  const filtered = activeTopic === "All"
    ? mockArticles
    : mockArticles.filter((a) => a.topic === activeTopic);

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

      {/* News Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((article, i) => (
          <NewsCard key={article.id} article={article} index={i} />
        ))}
      </div>
    </div>
  );
};

export default Index;
