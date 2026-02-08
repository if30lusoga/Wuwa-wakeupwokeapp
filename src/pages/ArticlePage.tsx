import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Clock, Eye, Quote, FileText, AlertTriangle,
  ExternalLink, User,
} from "lucide-react";
import type { NewsArticle } from "@/components/NewsCard";
import { apiGet } from "@/lib/api";

type FullContentBlock =
  | { type: "factual"; text: string }
  | { type: "interpretation"; text: string }
  | { type: "opinion"; attribution: string; text: string };

type SourceDetail = { name: string; type: string; url?: string; publishedAt?: string };

type ArticleDetail = NewsArticle & {
  fullContent?: FullContentBlock[];
  sourcesDetail?: SourceDetail[];
  quotedVoices?: Array<{ name: string; role: string }>;
};

const typeConfig = {
  factual: {
    label: "Factual Reporting",
    className: "signal-fact",
    borderClass: "border-l-4 border-signal-fact",
    icon: FileText,
  },
  opinion: {
    label: "Quoted Opinion",
    className: "signal-opinion",
    borderClass: "border-l-4 border-signal-opinion",
    icon: Quote,
  },
  interpretation: {
    label: "Analysis",
    className: "signal-interpretation",
    borderClass: "border-l-4 border-signal-interpretation",
    icon: Eye,
  },
};

const ArticlePage = () => {
  const { id } = useParams();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setArticle(null);
    apiGet<ArticleDetail>(`/api/articles/${id}`)
      .then((data) => {
        if (!cancelled) setArticle(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const detail = article?.fullContent ? article : null;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to feed
        </Link>
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">{error ?? "Article not found."}</p>
        <Link to="/" className="text-primary underline mt-2 inline-block">Back to feed</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to feed
      </Link>

      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className={`signal-badge ${article.topic === "Climate" ? "signal-fact" : article.topic === "Business" ? "signal-opinion" : "signal-interpretation"}`}>
              {article.topic}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {article.timeAgo}
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight mb-3">
            {article.title}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {article.summary}
          </p>
        </div>

        {/* Transparency Signals Card */}
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <h2 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4 text-transparency" />
            Transparency Signals
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            These signals describe how information is presented in this story. They are not judgments of accuracy.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50">
              <Eye className="h-4 w-4 mt-0.5 text-transparency" />
              <div>
                <div className="text-xs font-medium text-foreground">Source Diversity</div>
                <div className="text-xs text-muted-foreground capitalize">{article.transparencySignals.sourceDiversity}</div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50">
              <Quote className="h-4 w-4 mt-0.5 text-transparency" />
              <div>
                <div className="text-xs font-medium text-foreground">Attribution</div>
                <div className="text-xs text-muted-foreground">
                  {article.transparencySignals.hasAttributionClarity ? "Clearly attributed" : "Limited attribution"}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50">
              <FileText className="h-4 w-4 mt-0.5 text-transparency" />
              <div>
                <div className="text-xs font-medium text-foreground">Primary Data</div>
                <div className="text-xs text-muted-foreground">
                  {article.transparencySignals.hasPrimaryData ? "References primary data" : "No primary data cited"}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50">
              <AlertTriangle className={`h-4 w-4 mt-0.5 ${article.transparencySignals.sensationalLanguageDetected ? "text-signal-sensational" : "text-transparency"}`} />
              <div>
                <div className="text-xs font-medium text-foreground">Language Framing</div>
                <div className="text-xs text-muted-foreground">
                  {article.transparencySignals.sensationalLanguageDetected ? "Sensational language detected" : "Neutral framing"}
                </div>
              </div>
            </div>
          </div>

          {/* Content Breakdown */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs font-medium text-foreground mb-2">Content Breakdown</div>
            <div className="flex h-2 rounded-full overflow-hidden bg-muted mb-2">
              <div className="h-full bg-signal-fact" style={{ width: `${article.contentBreakdown.factual}%` }} />
              <div className="h-full bg-signal-opinion" style={{ width: `${article.contentBreakdown.opinion}%` }} />
              <div className="h-full bg-signal-interpretation" style={{ width: `${article.contentBreakdown.interpretation}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Factual {article.contentBreakdown.factual}%</span>
              <span>Opinion {article.contentBreakdown.opinion}%</span>
              <span>Analysis {article.contentBreakdown.interpretation}%</span>
            </div>
          </div>
        </div>

        {/* Article Content with Labels */}
        {detail && detail.fullContent && (
          <div className="mb-6">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">
              Full Analysis
            </h2>
            <div className="space-y-4">
              {detail.fullContent.map((block, i) => {
                const config = typeConfig[block.type];
                const Icon = config.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className={`${config.borderClass} pl-4 py-2`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`signal-badge ${config.className}`}>
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </span>
                      {block.type === "opinion" && "attribution" in block && (
                        <span className="text-[10px] text-muted-foreground">
                          — {block.attribution}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {block.text}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Source & Context Panel - show when we have sources (story detail) */}
        {article?.sourcesDetail && (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                Sources
              </h3>
              <div className="space-y-2">
                {article.sourcesDetail.map((source, i) => (
                  <div key={i} className="flex items-center justify-between text-sm gap-2">
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline truncate min-w-0">
                        {source.name}
                      </a>
                    ) : (
                      <span className="text-foreground">{source.name}</span>
                    )}
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded shrink-0">
                      {source.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Quoted Voices
              </h3>
              <div className="space-y-2">
                {(article.quotedVoices ?? []).length > 0 ? (article.quotedVoices ?? []).map((voice, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{voice.name}</span>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                      {voice.role}
                    </span>
                  </div>
                )) : (
                  <p className="text-xs text-muted-foreground">No quoted voices identified in source material.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Non-detail fallback */}
        {!detail && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground text-sm">
              Detailed analysis view is available for selected articles. This is a summarized preview.
            </p>
          </div>
        )}
      </motion.article>
    </div>
  );
};

export default ArticlePage;
