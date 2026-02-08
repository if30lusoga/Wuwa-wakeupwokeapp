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

const DEMO_ID = "703bcc3b731cdddd";

const DEMO_ARTICLE: ArticleDetail = {
  id: DEMO_ID,
  title: "Federal Courts Scrutinize ICE Detention Practices Amid Legal Challenges",
  summary:
    "Recent federal court rulings and investigative reporting have renewed scrutiny of U.S. Immigration and Customs Enforcement’s detention and enforcement practices. Judges have questioned aspects of detention conditions and due process, while ICE maintains its policies comply with federal law. Reporting highlights differing interpretations of the rulings and what they may mean for future enforcement.",
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

  fullContent: [
    {
      type: "factual",
      text: "Federal courts have issued several rulings in recent months addressing the legality of certain ICE detention and enforcement practices. The cases focus on detention conditions, access to legal representation, and the length of time individuals may be held while immigration proceedings are ongoing."
    },
    {
      type: "factual",
      text: "In one ruling, a federal judge found that aspects of ICE’s detention procedures raised constitutional concerns, particularly related to due process protections. The court ordered changes to how detainees are notified of their rights and how custody determinations are reviewed."
    },
    {
      type: "factual",
      text: "ICE officials have stated that the agency’s enforcement actions follow existing federal statutes and court guidance. The agency has emphasized that detention decisions are made on a case-by-case basis and prioritize public safety and compliance with immigration law."
    },
    {
      type: "opinion",
      attribution: "James Boasberg, U.S. District Court Judge",
      text: "“The court concluded that prolonged detention without adequate procedural safeguards risks violating fundamental due process protections guaranteed under the Constitution,” said the judge in a written opinion accompanying the ruling."
    },
    {
      type: "opinion",
      attribution: "Todd Lyons, ICE Acting Director",
      text: "“ICE remains committed to carrying out its mission in a lawful and humane manner, and we are reviewing the court’s decision to determine next steps,” an agency spokesperson said in a statement."
    },
    {
      type: "factual",
      text: "Advocacy organizations and legal analysts note that similar challenges to ICE detention practices have appeared in multiple jurisdictions, suggesting broader legal uncertainty around enforcement standards."
    },
    {
      type: "interpretation",
      text: "The rulings do not immediately halt ICE detention operations, but they may influence how detention policies are implemented nationwide. Agencies often adjust internal guidance following judicial scrutiny, even when broader authority remains unchanged."
    },
    {
      type: "interpretation",
      text: "Analysts say future court decisions could further clarify the balance between immigration enforcement authority and individual due process rights, particularly as similar cases move through higher courts."
    }
  ],
  

  sourcesDetail: [
    {name: "Truthout", type: "Publication", url: "https://truthout.org/articles/federal-court-rules-ice-can-continue-to-imprison-immigrants-without-bond/"},
    { name: "Reuters", type: "Primary Source", url: "https://www.reuters.com" },
    { name: "Associated Press", type: "Wire Service", url: "https://apnews.com" },
    { name: "NPR", type: "Publication", url: "https://www.npr.org" },
    { name: "PBS NewsHour", type: "Publication", url: "https://www.pbs.org/newshour" },
    { name: "Reuters", type: "Wire Service", url: "https://www.reuters.com" },
    { name: "Associated Press", type: "Wire Service", url: "https://apnews.com" },
    { name: "New York Times", type: "Publication", url: "https://www.nytimes.com" },
    { name: "ACLU Court Filings", type: "Primary Source",url: "https://www.aclu.org/cases/ice-detention-constitutional-challenges"},
    { name: "Associated Press", type: "Wire Service", url: "https://apnews.com" },
    { name: "New York Times", type: "Publication", url: "https://www.nytimes.com" },
    { name: "ACLU Court Filings", type: "Primary Source", url: "https://www.aclu.org/cases/ice-detention-constitutional-challenges"}
  ],

  quotedVoices: [
    { name: "James Boasberg",
      role: "U.S. District Court Judge" },
    { name: "Todd Lyons",
      role: "ICE Acting Director" },
    {
      name: "Lee Gelernt",
    role: "ACLU Immigration Attorney",
    },
  ],
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

  const resolved = id === DEMO_ID ? DEMO_ARTICLE : article;
  const detail = resolved?.fullContent ? resolved : null;
  

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

  if (error || !resolved) {
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
            <span className={`signal-badge ${resolved.topic === "Climate" ? "signal-fact" : resolved.topic === "Business" ? "signal-opinion" : "signal-interpretation"}`}>
              {resolved.topic}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {resolved.timeAgo}
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight mb-3">
            {resolved.title}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {resolved.summary}
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
                <div className="text-xs text-muted-foreground capitalize">{resolved.transparencySignals.sourceDiversity}</div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50">
              <Quote className="h-4 w-4 mt-0.5 text-transparency" />
              <div>
                <div className="text-xs font-medium text-foreground">Attribution</div>
                <div className="text-xs text-muted-foreground">
                  {resolved.transparencySignals.hasAttributionClarity ? "Clearly attributed" : "Limited attribution"}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50">
              <FileText className="h-4 w-4 mt-0.5 text-transparency" />
              <div>
                <div className="text-xs font-medium text-foreground">Primary Data</div>
                <div className="text-xs text-muted-foreground">
                  {resolved.transparencySignals.hasPrimaryData ? "References primary data" : "No primary data cited"}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50">
              <AlertTriangle className={`h-4 w-4 mt-0.5 ${resolved.transparencySignals.sensationalLanguageDetected ? "text-signal-sensational" : "text-transparency"}`} />
              <div>
                <div className="text-xs font-medium text-foreground">Language Framing</div>
                <div className="text-xs text-muted-foreground">
                  {resolved.transparencySignals.sensationalLanguageDetected ? "Sensational language detected" : "Neutral framing"}
                </div>
              </div>
            </div>
          </div>

          {/* Content Breakdown */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs font-medium text-foreground mb-2">Content Breakdown</div>
            <div className="flex h-2 rounded-full overflow-hidden bg-muted mb-2">
              <div className="h-full bg-signal-fact" style={{ width: `${resolved.contentBreakdown.factual}%` }} />
              <div className="h-full bg-signal-opinion" style={{ width: `${resolved.contentBreakdown.opinion}%` }} />
              <div className="h-full bg-signal-interpretation" style={{ width: `${resolved.contentBreakdown.interpretation}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Factual {resolved.contentBreakdown.factual}%</span>
              <span>Opinion {resolved.contentBreakdown.opinion}%</span>
              <span>Analysis {resolved.contentBreakdown.interpretation}%</span>
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
                {resolved.sourcesDetail.map((source, i) => (
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
                {(resolved.quotedVoices ?? []).length > 0 ? (resolved.quotedVoices ?? []).map((voice, i) => (
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
