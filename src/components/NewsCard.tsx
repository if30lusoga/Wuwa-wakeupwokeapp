import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, ExternalLink, Eye, Quote, FileText, AlertTriangle } from "lucide-react";

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  topic: "Politics" | "Climate" | "Business";
  sources: number;
  timeAgo: string;
  transparencySignals: {
    hasAttributionClarity: boolean;
    sourceDiversity: "low" | "moderate" | "high";
    hasPrimaryData: boolean;
    sensationalLanguageDetected: boolean;
  };
  contentBreakdown: {
    factual: number;
    opinion: number;
    interpretation: number;
  };
  imageUrl?: string;
}

const topicColors: Record<string, string> = {
  Politics: "signal-interpretation",
  Climate: "signal-fact",
  Business: "signal-opinion",
};

const NewsCard = ({ article, index }: { article: NewsArticle; index: number }) => {
  const topicClass = topicColors[article.topic] || "signal-fact";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link to={`/article/${article.id}`} className="block group">
        <article className="rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-border/80">
          {/* Topic + Time */}
          <div className="flex items-center justify-between mb-3">
            <span className={`signal-badge ${topicClass}`}>
              {article.topic}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {article.timeAgo}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-display text-lg font-semibold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>

          {/* Summary */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
            {article.summary}
          </p>

          {/* Transparency Signals Row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="transparency-badge">
              <Eye className="h-3 w-3" />
              {article.sources} sources
            </span>
            {article.transparencySignals.hasAttributionClarity && (
              <span className="transparency-badge">
                <Quote className="h-3 w-3" />
                Clear attribution
              </span>
            )}
            {article.transparencySignals.hasPrimaryData && (
              <span className="transparency-badge">
                <FileText className="h-3 w-3" />
                Primary data
              </span>
            )}
            {article.transparencySignals.sensationalLanguageDetected && (
              <span className="signal-badge signal-sensational">
                <AlertTriangle className="h-3 w-3" />
                Framing detected
              </span>
            )}
          </div>

          {/* Content breakdown bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex h-1.5 rounded-full overflow-hidden bg-muted">
              <div
                className="h-full bg-signal-fact rounded-l-full"
                style={{ width: `${article.contentBreakdown.factual}%` }}
              />
              <div
                className="h-full bg-signal-opinion"
                style={{ width: `${article.contentBreakdown.opinion}%` }}
              />
              <div
                className="h-full bg-signal-interpretation rounded-r-full"
                style={{ width: `${article.contentBreakdown.interpretation}%` }}
              />
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-signal-fact" />
                Fact
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-signal-opinion" />
                Opinion
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-signal-interpretation" />
                Analysis
              </span>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
};

export default NewsCard;
