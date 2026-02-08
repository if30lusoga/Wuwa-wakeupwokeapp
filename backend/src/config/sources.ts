export type ArticleTopic = "Politics" | "Climate" | "Business";
export type Region = "US" | "PA";

export interface RSSSourceConfig {
  url: string;
  topic: ArticleTopic;
  region: Region;
  publisher: string;
}

export const rssSources: RSSSourceConfig[] = [
  // Politics (US) - 5 feeds
  { url: "https://feeds.bbci.co.uk/news/politics/rss.xml", topic: "Politics", region: "US", publisher: "BBC" },
  { url: "https://feeds.npr.org/1001/rss.xml", topic: "Politics", region: "US", publisher: "NPR" },
  { url: "https://www.theguardian.com/us/rss", topic: "Politics", region: "US", publisher: "The Guardian" },
  { url: "https://rss.politico.com/politics-news.xml", topic: "Politics", region: "US", publisher: "Politico" },
  { url: "https://www.pbs.org/newshour/feeds/rss/headlines", topic: "Politics", region: "US", publisher: "PBS NewsHour" },

  // Climate (US) - 4 feeds
  { url: "https://grist.org/feed/", topic: "Climate", region: "US", publisher: "Grist" },
  { url: "https://insideclimatenews.org/feed/", topic: "Climate", region: "US", publisher: "Inside Climate News" },
  { url: "https://www.carbonbrief.org/feed/", topic: "Climate", region: "US", publisher: "Carbon Brief" },
  { url: "https://www.yaleclimateconnections.org/feed/", topic: "Climate", region: "US", publisher: "Yale Climate Connections" },
  //{ url: "https://climate.nasa.gov/ask-nasa-climate/rss/", topic: "Climate", region: "US", publisher: "NASA Climate" },

  // Business (US) - 4 feeds
  { url: "https://feeds.bbci.co.uk/news/business/rss.xml", topic: "Business", region: "US", publisher: "BBC" },
  //{ url: "https://www.reuters.com/rssfeed/businessNews", topic: "Business", region: "US", publisher: "Reuters" },
  { url: "https://feeds.npr.org/1006/rss.xml", topic: "Business", region: "US", publisher: "NPR" },
  { url: "https://www.theguardian.com/us/business/rss", topic: "Business", region: "US", publisher: "The Guardian" },

  // PA statewide - 3 feeds
  { url: "https://www.penncapital-star.com/feed/", topic: "Politics", region: "PA", publisher: "Pennsylvania Capital-Star" },
  //{ url: "https://www.spotlightpa.org/feed/", topic: "Politics", region: "PA", publisher: "Spotlight PA" },
  { url: "https://www.witf.org/feeds/news/", topic: "Politics", region: "PA", publisher: "WITF" },
];
