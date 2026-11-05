import { z } from "zod";
import { hasWord, queryWords, searchableText } from "@/lib/match";
import reportsFile from "@/data/reports.json";
import {
  parseLeaderboard,
  parseReport,
  reportSchema,
  sectionNames,
  type Listing,
  type Report,
} from "@/lib/report";

const leaderboardUrl = "https://manufact.com/leaderboard";
const userAgent = "which-mcp-demo (unofficial, github.com/cherylaurelia)";
const hour = 3_600_000;
const day = 86_400_000;

const snapshot = z
  .object({ asOf: z.string(), reports: z.record(z.string(), reportSchema) })
  .parse(reportsFile);

const fetchPage = async (url: string): Promise<string> => {
  const response = await fetch(url, {
    headers: { "user-agent": userAgent },
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);

  return response.text();
};

let cached: { fetchedAt: number; listings: Listing[] } | null = null;

/** Scores always come from their live list. If it can't be read, the tool errors. */
const loadListings = async (): Promise<{ fetchedAt: number; listings: Listing[] }> => {
  if (cached !== null && Date.now() - cached.fetchedAt < hour) return cached;
  const listings = parseLeaderboard(await fetchPage(`${leaderboardUrl}/all`));
  cached = { fetchedAt: Date.now(), listings };

  return cached;
};

const reportUrl = (listing: Listing): string =>
  listing.score === null && !listing.curated ? `${leaderboardUrl}/all` : `${leaderboardUrl}/${listing.slug}`;

const daysSince = (date: string | null): number | null =>
  date === null ? null : Math.floor((Date.now() - new Date(date).getTime()) / day);

const matchFields = (listing: Listing, report: Report | undefined, words: string[]): string[] | null => {
  const entries = Object.entries({
    "name or URL": searchableText(`${listing.name} ${listing.slug} ${listing.url}`),
    description: searchableText(report?.description ?? ""),
    tools: searchableText((report?.tools ?? []).join(" ")),
  });

  const matchedAll = words.every((word) => entries.some(([, text]) => hasWord(text, word)));

  if (!matchedAll) return null;

  return entries.filter(([, text]) => words.some((word) => hasWord(text, word))).map(([key]) => key);
};

export const serverRow = z.object({
  slug: z.string(),
  name: z.string(),
  endpoint: z.string(),
  score: z.number().nullable(),
  category: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  reviewedDaysAgo: z.number().nullable(),
  mainlyAbout: z.boolean(),
  matchedIn: z.array(z.string()),
  matchedTools: z.array(z.string()),
  toolCount: z.number(),
  description: z.string(),
  reportUrl: z.string(),
});

export const searchResult = z.object({
  query: z.string(),
  words: z.array(z.string()),
  matches: z.number(),
  hiddenDuplicates: z.number(),
  mainMatches: z.number(),
  scoredMatches: z.number(),
  servers: z.array(serverRow),
  listFetchedAt: z.string(),
  descriptionsAsOf: z.string(),
  leaderboardUrl: z.string(),
});

export type SearchResult = z.infer<typeof searchResult>;

const byTheirScore = (left: Listing, right: Listing): number =>
  (right.score ?? -1) - (left.score ?? -1) || left.name.localeCompare(right.name);

const openingLength = 60;

/** True when the keyword is in the name or the first words of the description, not an incidental mention. */
const isMainlyAbout = (listing: Listing, report: Report | undefined, words: string[]): boolean => {
  const opening = searchableText(`${listing.name} ${listing.slug} ${(report?.description ?? "").slice(0, openingLength)}`);

  return words.every((word) => hasWord(opening, word));
};

const nonProductionHost = /(^|[.-])(staging|dev|test|preview|sandbox)[.-]/;

const isProductionHost = (url: string): boolean => !nonProductionHost.test(URL.canParse(url) ? new URL(url).hostname : url);

const hostOf = (url: string): string => (URL.canParse(url) ? new URL(url).hostname : url);

/** True when a same-name listing is clearly the same server: a non-production copy, or the same host with a lower score. */
const isShadowedBy = (listing: Listing, other: Listing): boolean => {
  if (other.slug === listing.slug || other.name.toLowerCase() !== listing.name.toLowerCase()) return false;

  if (!isProductionHost(listing.url) && isProductionHost(other.url)) return true;

  return hostOf(other.url) === hostOf(listing.url) && (byTheirScore(other, listing) < 0 || (byTheirScore(other, listing) === 0 && other.slug < listing.slug));
};

const collapseDuplicates = (listings: Listing[]): Listing[] =>
  listings.filter((listing) => !listings.some((other) => isShadowedBy(listing, other)));

export const searchServers = async (query: string, limit: number): Promise<SearchResult> => {
  const { fetchedAt, listings } = await loadListings();
  const words = queryWords(query);


  const matching = listings.filter((listing) => matchFields(listing, snapshot.reports[listing.slug], words) !== null);
  const unique = collapseDuplicates(matching);

  const rows = unique.flatMap((listing) => {
    const report = snapshot.reports[listing.slug];
    const matchedIn = matchFields(listing, report, words);

    if (matchedIn === null) return [];

    return [{ listing, report, matchedIn, mainlyAbout: isMainlyAbout(listing, report, words) }];
  });

  rows.sort((left, right) => Number(right.mainlyAbout) - Number(left.mainlyAbout) || byTheirScore(left.listing, right.listing));

  return {
    query,
    words,
    matches: rows.length,
    hiddenDuplicates: matching.length - unique.length,
    mainMatches: rows.filter((row) => row.mainlyAbout).length,
    scoredMatches: rows.filter((row) => row.listing.score !== null).length,
    servers: rows.slice(0, limit).map(({ listing, report, matchedIn, mainlyAbout }) => ({
      slug: listing.slug,
      name: listing.name,
      endpoint: listing.url,
      score: listing.score,
      category: listing.categories[0] ?? null,
      reviewedAt: listing.lastReviewedAt,
      reviewedDaysAgo: daysSince(listing.lastReviewedAt),
      mainlyAbout,
      matchedIn,
      matchedTools: (report?.tools ?? [])
        .filter((tool) => words.some((word) => hasWord(searchableText(tool), word)))
        .slice(0, 3),
      toolCount: report?.tools.length ?? 0,
      description: report?.description ?? "",
      reportUrl: reportUrl(listing),
    })),
    listFetchedAt: new Date(fetchedAt).toISOString(),
    descriptionsAsOf: snapshot.asOf,
    leaderboardUrl: `${leaderboardUrl}/all`,
  };
};

const sectionScores = z.object({
  documentation: z.number().nullable(),
  tools: z.number().nullable(),
  protocol: z.number().nullable(),
  metadata: z.number().nullable(),
  discoverability: z.number().nullable(),
  apps: z.number().nullable(),
});

export const compareRow = z.object({
  slug: z.string(),
  name: z.string(),
  score: z.number().nullable(),
  reviewedAt: z.string().nullable(),
  reviewedDaysAgo: z.number().nullable(),
  sections: sectionScores.nullable(),
  source: z.enum(["live", "snapshot", "none"]),
  toolCount: z.number(),
  reportUrl: z.string(),
});

export const compareResult = z.object({
  servers: z.array(compareRow),
  sectionNames: z.array(z.enum(sectionNames)),
  listFetchedAt: z.string(),
  descriptionsAsOf: z.string(),
});

export type CompareResult = z.infer<typeof compareResult>;

const readReport = async (slug: string): Promise<{ report: Report | null; source: "live" | "snapshot" | "none" }> => {
  try {
    const report = parseReport(await fetchPage(`${leaderboardUrl}/${encodeURIComponent(slug)}`));

    if (report !== null) return { report, source: "live" };
  } catch (error) {
    console.error(`live report failed for ${slug}`, error);
  }

  const saved = snapshot.reports[slug];

  return saved === undefined ? { report: null, source: "none" } : { report: saved, source: "snapshot" };
};

export const compareServers = async (slugs: string[]): Promise<CompareResult> => {
  const { fetchedAt, listings } = await loadListings();

  const servers = await Promise.all(
    slugs.map(async (slug) => {
      const listing = listings.find((item) => item.slug === slug);

      if (listing === undefined) throw new Error(`No server with slug "${slug}" on the leaderboard. Use find-servers to get slugs.`);
      const { report, source } = await readReport(slug);

      return {
        slug,
        name: listing.name,
        score: listing.score,
        reviewedAt: listing.lastReviewedAt,
        reviewedDaysAgo: daysSince(listing.lastReviewedAt),
        sections: report?.sections ?? null,
        source,
        toolCount: report?.tools.length ?? 0,
        reportUrl: reportUrl(listing),
      };
    }),
  );

  return {
    servers,
    sectionNames: [...sectionNames],
    listFetchedAt: new Date(fetchedAt).toISOString(),
    descriptionsAsOf: snapshot.asOf,
  };
};
