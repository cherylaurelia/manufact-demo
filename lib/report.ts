import { z } from "zod";

// The leaderboard has no public JSON API, so these parsers read the data its
// pages embed. Each one validates what it finds and fails loudly if the shape
// changes, so a page redesign can't turn into a wrong number.

const unescapeFlight = (html: string): string =>
  html.replaceAll('\\"', '"').replaceAll("\\\\", "\\");

/** Returns the JSON object or array that starts at `start`, as raw text. */
const sliceJson = (text: string, start: number): string | null => {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
    } else if (char === '"') {
      inString = true;
    } else if (char === "{" || char === "[") {
      depth += 1;
    } else if (char === "}" || char === "]") {
      depth -= 1;

      if (depth === 0) return text.slice(start, index + 1);
    }
  }

  return null;
};

const readEmbedded = (text: string, key: string): string | null => {
  const marker = `"${key}":`;
  const at = text.indexOf(marker);

  if (at < 0) return null;

  return sliceJson(text, at + marker.length);
};

export const listingSchema = z.object({
  slug: z.string(),
  name: z.string(),
  url: z.string(),
  score: z.number().nullable(),
  categories: z.array(z.string()),
  curated: z.boolean(),
  lastReviewedAt: z.string().nullable(),
});

export type Listing = z.infer<typeof listingSchema>;

const listSchema = z.object({ items: z.array(listingSchema) });

export const parseLeaderboard = (html: string): Listing[] => {
  const raw = readEmbedded(unescapeFlight(html), "initialResult");

  if (raw === null) throw new Error("Leaderboard page has no initialResult");

  return listSchema.parse(JSON.parse(raw)).items;
};

const sectionSchema = z
  .object({
    score: z.number().nullable().optional(),
    applicable: z.boolean(),
  })
  .optional();

const applicableScore = (section: z.infer<typeof sectionSchema>): number | null =>
  section?.applicable === true ? (section.score ?? null) : null;

const sectionsSchema = z.object({
  protocol: sectionSchema,
  tools: sectionSchema,
  apps: sectionSchema,
  metadata: sectionSchema,
  documentation: sectionSchema,
  discoverability: sectionSchema,
});

const serverSchema = z.object({ description: z.string().optional() });

export const sectionNames = [
  "documentation",
  "tools",
  "protocol",
  "metadata",
  "discoverability",
  "apps",
] as const;

export type SectionName = (typeof sectionNames)[number];

export const reportSchema = z.object({
  description: z.string(),
  tools: z.array(z.string()),
  sections: z.record(z.enum(sectionNames), z.number().nullable()),
});

export type Report = z.infer<typeof reportSchema>;

/** Returns null for a page with no public report, which is true of many listings. */
export const parseReport = (html: string): Report | null => {
  const text = unescapeFlight(html);
  const rawSections = readEmbedded(text, "sections");

  if (rawSections === null) return null;

  const parsed = sectionsSchema.parse(JSON.parse(rawSections));
  const rawServer = readEmbedded(text, "server");
  const server = rawServer === null ? {} : serverSchema.parse(JSON.parse(rawServer));
  const tools = text.matchAll(/"tool":\{"name":"([^"]+)"/g);

  return {
    description: server.description ?? "",
    tools: [...new Set(Array.from(tools, (match) => match[1]))],
    sections: {
      documentation: applicableScore(parsed.documentation),
      tools: applicableScore(parsed.tools),
      protocol: applicableScore(parsed.protocol),
      metadata: applicableScore(parsed.metadata),
      discoverability: applicableScore(parsed.discoverability),
      apps: applicableScore(parsed.apps),
    },
  };
};
