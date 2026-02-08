import type { StoredArticle } from "../storage/db.js";
import type { FullContentBlock } from "../demo/demoData.js";

const WIRE_LIKE = new Set(["Reuters", "AP", "AFP", "Associated Press", "BBC"]);
const INSTITUTION_LIKE = new Set(["NASA", "European Commission", "WTO", "IEA", "CDC", "NASA Climate"]);

function inferSourceType(publisher: string): string {
  if (WIRE_LIKE.has(publisher)) return "Wire Service";
  if (INSTITUTION_LIKE.has(publisher)) return "Institution";
  return "Publication";
}

export interface ArticleInput {
  title: string;
  publisher: string;
  url?: string;
  publishedAt: string;
  summary: string;
}

export interface SynthesisResult {
  fullContent: FullContentBlock[];
  quotedVoices: Array<{ name: string; role: string }>;
}

/** Extract quoted substrings with attribution. Only returns quotes that have attribution. */
function extractQuotesWithAttribution(text: string): Array<{ quote: string; attribution: string }> {
  const results: Array<{ quote: string; attribution: string }> = [];
  const seen = new Set<string>();

  // "quote" said Attribution
  let m: RegExpExecArray | null;
  const p1 = /"([^"]{20,}?)"(?:,\s*)?\s+(?:said|stated|argued|explained|told|added|noted)\s+([^."]+)/gi;
  while ((m = p1.exec(text)) !== null) {
    const quote = m[1]!.trim();
    const attribution = m[2]!.trim();
    if (attribution.length < 3) continue;
    const key = `${quote.slice(0, 50)}|${attribution}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push({ quote, attribution });
    }
  }

  // Attribution said "quote"
  const p2 = /([^."]{3,60}?)\s+(?:said|stated|argued|explained|told|added|noted)\s+"([^"]{20,})"/gi;
  while ((m = p2.exec(text)) !== null) {
    const attribution = m[1]!.trim();
    const quote = m[2]!.trim();
    const key = `${quote.slice(0, 50)}|${attribution}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push({ quote, attribution });
    }
  }

  // according to Attribution, ... "quote"
  const p3 = /according to\s+([^,."]+).*?"([^"]{20,})"/gi;
  while ((m = p3.exec(text)) !== null) {
    const attribution = m[1]!.trim();
    const quote = m[2]!.trim();
    const key = `${quote.slice(0, 50)}|${attribution}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push({ quote, attribution });
    }
  }

  return results.slice(0, 5);
}

/** Infer role from attribution text */
function inferRole(attribution: string): string {
  const lower = attribution.toLowerCase();
  if (/\bpresident\b/i.test(lower)) return "Policy Maker";
  if (/\b(senator|rep\.|representative|governor|congressman|congresswoman)\b/i.test(lower))
    return "Elected Official";
  if (/\b(analyst|researcher|economist|expert)\b/i.test(lower)) return "Independent Analyst";
  if (/\b(official|spokesperson|spokesman|spokeswoman)\b/i.test(lower)) return "Government Official";
  // Outlet-like: Reuters, BBC, etc.
  if (/^(reuters|ap|bbc|cnn|npr|the guardian|politico|bloomberg)/i.test(attribution))
    return "News Outlet";
  return "Source";
}

/** Extract factual sentences (with numbers, dates, proper nouns). Dedupe near-identical. */
function extractFactualBlocks(articles: ArticleInput[]): string[] {
  const combined = articles.map((a) => `${a.title}. ${a.summary}`).join(" ");
  const sentences = combined
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 30 && s.length <= 400);

  const scored = sentences
    .filter((s) => {
      const hasNumber = /\d/.test(s);
      const hasDate = /\b(19|20)\d{2}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2}|\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(s);
      const hasProperNoun = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/.test(s);
      return (hasNumber || hasDate || hasProperNoun) && s.length >= 20;
    })
    .map((s) => ({ text: s }));

  const deduped: string[] = [];
  for (const { text } of scored) {
    const norm = text.toLowerCase().replace(/\s+/g, " ").slice(0, 80);
    if (deduped.some((d) => d.toLowerCase().replace(/\s+/g, " ").slice(0, 80) === norm)) continue;
    if (deduped.some((d) => {
      const a = d.toLowerCase().split(/\s+/);
      const b = text.toLowerCase().split(/\s+/);
      const overlap = a.filter((w) => b.includes(w)).length / Math.max(a.length, b.length);
      return overlap > 0.8;
    })) continue;
    deduped.push(text);
    if (deduped.length >= 6) break;
  }
  return deduped;
}

/** Generate heuristic analysis blocks (no LLM) */
function generateHeuristicAnalysis(articles: ArticleInput[]): string[] {
  const blocks: string[] = [];
  const topicHint = articles[0]?.title?.split(/\s+/).slice(0, 5).join(" ") ?? "this story";
  blocks.push(
    `Coverage from ${articles.length} sources. Multiple outlets are reporting on ${topicHint}.`
  );
  blocks.push(
    "What to watch: Developments may continue as more information becomes available. Check back for updates from primary sources."
  );
  return blocks;
}

/** Try to generate 1-2 interpretation blocks via OpenAI. Returns [] on failure. */
async function tryOpenAIAnalysis(articles: ArticleInput[]): Promise<string[]> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return [];

  const combined = articles
    .map((a) => `[${a.publisher}] ${a.summary}`)
    .join("\n\n")
    .slice(0, 4000);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You write brief, neutral synthesis and analysis. No bias, no persuasion, no 'you should'. Output 1-2 short paragraphs (2-4 sentences total). Label as analysis/synthesis. Be factual and balanced.",
          },
          {
            role: "user",
            content: `Based on these article snippets, provide 1-2 brief neutral analysis paragraphs (why it matters / what's unclear / what to watch next). Keep tone neutral.\n\n${combined}`,
          },
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!res.ok) return [];
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) return [];

    const paras = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    return paras.slice(0, 2);
  } catch {
    return [];
  }
}

/** Build fullContent from member articles (sync, heuristic only) */
export function synthesizeStoryDetail(articles: ArticleInput[]): SynthesisResult {
  const fullContent: FullContentBlock[] = [];
  const quotedVoices: Array<{ name: string; role: string }> = [];

  const combined = articles.map((a) => a.summary).join(" ");

  // 1) Factual blocks (4–6)
  let factualSentences = extractFactualBlocks(articles);
  if (factualSentences.length === 0) {
    factualSentences = combined
      .replace(/\s+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 30 && s.length <= 300)
      .slice(0, 6);
  }
  for (const text of factualSentences.slice(0, 6)) {
    fullContent.push({ type: "factual", text });
  }

  // 2) Quoted opinion blocks (1–3) ONLY if real quotes exist
  const quotes = extractQuotesWithAttribution(combined);
  for (const { quote, attribution } of quotes.slice(0, 3)) {
    fullContent.push({ type: "opinion", attribution, text: quote });
    quotedVoices.push({ name: attribution, role: inferRole(attribution) });
  }
  quotedVoices.splice(5); // Cap at 5 voices

  // 3) Interpretation blocks (1–2) - heuristic
  const analysisBlocks = generateHeuristicAnalysis(articles);
  for (const text of analysisBlocks) {
    fullContent.push({ type: "interpretation", text });
  }

  // Ensure 8–10 blocks total
  if (fullContent.length < 8 && factualSentences.length > factualSentences.slice(0, 6).length) {
    for (const text of factualSentences.slice(6, 8 - fullContent.length + 6)) {
      fullContent.splice(fullContent.length - analysisBlocks.length, 0, { type: "factual", text });
    }
  }

  return { fullContent, quotedVoices };
}

/** Build fullContent with optional OpenAI analysis. Prefer when OPENAI_API_KEY is set. */
export async function synthesizeStoryDetailAsync(articles: ArticleInput[]): Promise<SynthesisResult> {
  const { fullContent, quotedVoices } = synthesizeStoryDetail(articles);

  const analysisBlocks = await tryOpenAIAnalysis(articles);
  if (analysisBlocks.length > 0) {
    const interpretationBlocks = fullContent.filter((b) => b.type === "interpretation");
    for (const ib of interpretationBlocks) {
      const idx = fullContent.indexOf(ib);
      if (idx >= 0) fullContent.splice(idx, 1);
    }
    for (const text of analysisBlocks) {
      fullContent.push({ type: "interpretation", text });
    }
  }

  return { fullContent, quotedVoices };
}

/** Convert StoredArticle to ArticleInput */
export function toArticleInput(a: StoredArticle): ArticleInput {
  return {
    title: a.title,
    publisher: a.publisher,
    url: a.url,
    publishedAt: a.publishedAt,
    summary: a.summary,
  };
}
