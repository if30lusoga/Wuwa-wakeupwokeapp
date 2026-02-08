export type ArticleTopic = "Politics" | "Climate" | "Business";
export type SourceDiversity = "low" | "moderate" | "high";

export interface ArticleBase {
  id: string;
  title: string;
  summary: string;
  topic: ArticleTopic;
  sources: number;
  timeAgo: string;
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
}

export type FullContentBlock =
  | { type: "factual"; text: string }
  | { type: "interpretation"; text: string }
  | { type: "opinion"; attribution: string; text: string };

export interface ArticleDetail extends ArticleBase {
  fullContent?: FullContentBlock[];
  sourcesDetail?: Array<{ name: string; type: string }>;
  quotedVoices?: Array<{ name: string; role: string }>;
}

export const articles: ArticleBase[] = [
  {
    id: "1",
    title: "EU Agrees on Landmark Carbon Border Tax Implementation Timeline",
    summary:
      "The European Union has finalized the implementation schedule for its Carbon Border Adjustment Mechanism (CBAM), which will impose tariffs on carbon-intensive imports. The measure aims to prevent carbon leakage while maintaining industrial competitiveness. Multiple trade partners have expressed concerns about compatibility with WTO rules.",
    topic: "Climate",
    sources: 7,
    timeAgo: "2h ago",
    transparencySignals: {
      hasAttributionClarity: true,
      sourceDiversity: "high",
      hasPrimaryData: true,
      sensationalLanguageDetected: false,
    },
    contentBreakdown: { factual: 72, opinion: 10, interpretation: 18 },
  },
  {
    id: "2",
    title: "Federal Reserve Signals Cautious Approach to Rate Adjustments in 2026",
    summary:
      "Federal Reserve Chair indicated that interest rate decisions will remain data-dependent through the first half of 2026. The statement follows mixed economic signals including moderating inflation alongside persistent labor market tightness. Economists remain divided on the timing of potential cuts.",
    topic: "Business",
    sources: 5,
    timeAgo: "4h ago",
    transparencySignals: {
      hasAttributionClarity: true,
      sourceDiversity: "moderate",
      hasPrimaryData: true,
      sensationalLanguageDetected: false,
    },
    contentBreakdown: { factual: 60, opinion: 20, interpretation: 20 },
  },
  {
    id: "3",
    title: "Senate Committee Advances Bipartisan Infrastructure Oversight Bill",
    summary:
      "A Senate committee has voted to advance legislation that would create an independent oversight body for federal infrastructure spending. Supporters argue it increases accountability, while critics question the scope of the proposed agency's authority. The bill now moves to a full Senate vote.",
    topic: "Politics",
    sources: 4,
    timeAgo: "5h ago",
    transparencySignals: {
      hasAttributionClarity: true,
      sourceDiversity: "moderate",
      hasPrimaryData: false,
      sensationalLanguageDetected: false,
    },
    contentBreakdown: { factual: 65, opinion: 15, interpretation: 20 },
  },
  {
    id: "4",
    title:
      "Global Renewable Energy Investment Surpasses Fossil Fuels for Third Consecutive Quarter",
    summary:
      "New data from the International Energy Agency shows renewable energy investments have exceeded fossil fuel investments for the third quarter in a row. Solar and wind projects lead the trend, driven by declining manufacturing costs and government incentives across multiple regions.",
    topic: "Climate",
    sources: 6,
    timeAgo: "6h ago",
    transparencySignals: {
      hasAttributionClarity: true,
      sourceDiversity: "high",
      hasPrimaryData: true,
      sensationalLanguageDetected: false,
    },
    contentBreakdown: { factual: 80, opinion: 5, interpretation: 15 },
  },
  {
    id: "5",
    title: "Tech Giants Face New Antitrust Scrutiny Over AI Market Dominance",
    summary:
      "Regulators in multiple jurisdictions are examining whether major technology companies are leveraging existing market positions to dominate emerging artificial intelligence markets. The investigations focus on data access, computing infrastructure, and exclusive partnership agreements.",
    topic: "Business",
    sources: 5,
    timeAgo: "8h ago",
    transparencySignals: {
      hasAttributionClarity: false,
      sourceDiversity: "moderate",
      hasPrimaryData: false,
      sensationalLanguageDetected: true,
    },
    contentBreakdown: { factual: 50, opinion: 25, interpretation: 25 },
  },
  {
    id: "6",
    title: "State Legislatures Diverge on Approach to Housing Affordability Crisis",
    summary:
      "As housing costs continue to rise nationally, state legislatures are pursuing divergent strategies. Some states are expanding zoning reform and density allowances, while others are increasing direct subsidies and rent stabilization measures. Policy researchers note limited consensus on which approaches yield the best outcomes.",
    topic: "Politics",
    sources: 8,
    timeAgo: "10h ago",
    transparencySignals: {
      hasAttributionClarity: true,
      sourceDiversity: "high",
      hasPrimaryData: true,
      sensationalLanguageDetected: false,
    },
    contentBreakdown: { factual: 55, opinion: 20, interpretation: 25 },
  },
];

export const articleDetails: Record<string, ArticleDetail> = {
  "1": {
    ...articles[0],
    fullContent: [
      {
        type: "factual",
        text: "The European Union announced on Thursday that it has finalized the implementation timeline for its Carbon Border Adjustment Mechanism (CBAM). The mechanism will begin full enforcement in January 2027, following a transitional reporting period that began in October 2023.",
      },
      {
        type: "factual",
        text: "Under the CBAM, importers of carbon-intensive goods—including steel, aluminum, cement, fertilizers, electricity, and hydrogen—will be required to purchase certificates corresponding to the carbon price that would have been paid had the goods been produced under EU carbon pricing rules.",
      },
      {
        type: "opinion",
        attribution: "European Commission President",
        text: '"This mechanism is essential to ensuring that our climate ambitions do not simply result in carbon leakage to regions with less stringent environmental standards," said the European Commission President in a press conference.',
      },
      {
        type: "interpretation",
        text: "The move is widely seen as a significant escalation in the EU's climate policy toolkit, potentially reshaping global trade patterns for energy-intensive industries. Analysts suggest it could pressure other major economies to adopt comparable carbon pricing mechanisms.",
      },
      {
        type: "factual",
        text: "Several trade partners, including representatives from developing nations, have raised concerns about the measure's compatibility with World Trade Organization rules. India and Brazil have formally requested consultations at the WTO.",
      },
      {
        type: "opinion",
        attribution: "Trade Policy Analyst at Brookings Institution",
        text: '"While the environmental rationale is sound, the implementation challenges are enormous. The measurement and verification of embedded carbon in complex supply chains remains a significant technical hurdle," noted a trade policy analyst at the Brookings Institution.',
      },
      {
        type: "interpretation",
        text: "The EU's approach may set a precedent for how trade and environmental policy intersect in the coming decade. Whether other major economies follow suit or push back through trade disputes could fundamentally alter the landscape of international climate cooperation.",
      },
    ],
    sourcesDetail: [
      { name: "Reuters", type: "Wire Service" },
      { name: "Financial Times", type: "Publication" },
      { name: "European Commission", type: "Primary Source" },
      { name: "Brookings Institution", type: "Think Tank" },
      { name: "World Trade Organization", type: "Institution" },
      { name: "Bloomberg", type: "Publication" },
      { name: "Politico EU", type: "Publication" },
    ],
    quotedVoices: [
      { name: "European Commission President", role: "Policy Maker" },
      { name: "Brookings Institution Analyst", role: "Independent Analyst" },
      { name: "Indian Trade Representative", role: "Government Official" },
    ],
  },
};
