import type { StoredArticle } from "../storage/db.js";
import type { SourceDiversity } from "../demo/demoData.js";

const ATTRIBUTION_CUES = [
  /\bsaid\b/i, /\bAccording to\b/i, /\baccording to\b/i, /\bquoted\b/i,
  /\bstated\b/i, /\breported\b/i, /\bexplained\b/i, /\b"[^"]+"\s+said\b/,
  /\b—\s*[A-Z][a-z]+/,
];

const PRIMARY_SOURCE_HINTS = [
  /\.gov\b/i, /\breport\b/i, /\bdata\b/i, /\bcourt\b/i, /\bWTO\b/i,
  /\bEU\b/i, /\bIEA\b/i, /\bNASA\b/i, /\bCDC\b/i, /\bFBI\b/i,
  /\bstudy\b/i, /\bsurvey\b/i, /\bofficial\b/i, /\bannounced\b/i,
];

const SENSATIONAL_WORDS = [
  "shocking", "devastating", "explosive", "bombshell", "crisis",
  "chaos", "fury", "outrage", "scandal", "nightmare", "horror",
  "disaster", "panic", "terrifying", "alarming", "stunning",
];

const INTERPRETATION_CUES = [
  /\blikely\b/i, /\bsuggests\b/i, /\banalysts\b/i, /\bwidely seen\b/i,
  /\bcould\b/i, /\bmay\b/i, /\bmight\b/i, /\bpotential\b/i,
  /\bexperts say\b/i, /\bseems\b/i, /\bappears\b/i, /\binterpreted\b/i,
];

const OPINION_CUES = [
  /\b"[^"]+"\s+(?:said|stated|explained)\b/gi,
  /\b(?:said|stated|argued)\s+"/gi,
  /\baccording to\b/gi,
  /\b"\s+said\b/gi,
];

function countMatches(text: string, patterns: RegExp[]): number {
  let count = 0;
  for (const p of patterns) {
    const re = new RegExp(p.source, (p.flags.includes("g") ? p.flags : p.flags + "g"));
    const matches = text.matchAll(re);
    for (const _ of matches) count++;
  }
  return count;
}

function getCombinedText(articles: StoredArticle[]): string {
  return articles.map((a) => `${a.title} ${a.summary}`).join(" ");
}

export function computeStorySignals(articles: StoredArticle[]): {
  transparencySignals: {
    hasAttributionClarity: boolean;
    sourceDiversity: SourceDiversity;
    hasPrimaryData: boolean;
    sensationalLanguageDetected: boolean;
  };
  contentBreakdown: {
    factual: number;
    opinion: number;
    interpretation: number;
  };
} {
  const text = getCombinedText(articles);
  const wordCount = text.split(/\s+/).filter(Boolean).length || 1;
  const distinctPublishers = new Set(articles.map((a) => a.publisher)).size;

  const attributionMatches = countMatches(text, ATTRIBUTION_CUES);
  const hasAttributionClarity = attributionMatches >= Math.min(2, articles.length);

  let sourceDiversity: SourceDiversity = "low";
  if (distinctPublishers >= 4) sourceDiversity = "high";
  else if (distinctPublishers >= 2) sourceDiversity = "moderate";

  let hasPrimaryData = false;
  for (const p of PRIMARY_SOURCE_HINTS) {
    if (p.test(text)) {
      hasPrimaryData = true;
      break;
    }
  }

  const sensationalCount = SENSATIONAL_WORDS.filter((w) =>
    new RegExp(`\\b${w}\\b`, "i").test(text)
  ).length;
  const sensationalLanguageDetected = sensationalCount >= 2;

  const opinionMatches = countMatches(text, OPINION_CUES);
  const interpretationMatches = countMatches(text, INTERPRETATION_CUES);
  let opinionPct = Math.min(35, Math.round((opinionMatches / wordCount) * 400));
  let interpretationPct = Math.min(35, Math.round((interpretationMatches / wordCount) * 350));
  let factualPct = 100 - opinionPct - interpretationPct;
  factualPct = Math.max(20, factualPct);
  const total = factualPct + opinionPct + interpretationPct;
  factualPct = Math.round((factualPct / total) * 100);
  opinionPct = Math.round((opinionPct / total) * 100);
  interpretationPct = 100 - factualPct - opinionPct;

  return {
    transparencySignals: {
      hasAttributionClarity,
      sourceDiversity,
      hasPrimaryData,
      sensationalLanguageDetected,
    },
    contentBreakdown: {
      factual: factualPct,
      opinion: opinionPct,
      interpretation: interpretationPct,
    },
  };
}
