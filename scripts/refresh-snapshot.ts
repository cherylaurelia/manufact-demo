// Rebuilds data/reports.json from the public report pages. Run: npm run snapshot
// Two connections with a pause, because this reads a lot of pages from one site.
import { writeFileSync } from "node:fs";
import { parseLeaderboard, parseReport, type Report } from "../lib/report.ts";

const base = "https://manufact.com/leaderboard";
const userAgent = "which-mcp-demo (unofficial, github.com/cherylaurelia)";

const fetchPage = async (path: string): Promise<string> => {
  const response = await fetch(`${base}${path}`, {
    headers: { "user-agent": userAgent },
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);

  return response.text();
};

const listings = parseLeaderboard(await fetchPage("/all"));
const targets = listings.filter((item) => item.score !== null);
const reports = new Map<string, Report>();
const failed: string[] = [];
const queue = [...targets];

const worker = async (): Promise<void> => {
  for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
    try {
      const report = parseReport(await fetchPage(`/${next.slug}`));

      if (report === null) failed.push(`${next.slug}: no report`);
      else reports.set(next.slug, report);
    } catch (error) {
      failed.push(`${next.slug}: ${String(error)}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
};

await Promise.all([worker(), worker()]);

writeFileSync(
  new URL("../data/reports.json", import.meta.url),
  JSON.stringify({ asOf: new Date().toISOString(), reports: Object.fromEntries(reports) }),
);

console.log(`listings ${listings.length}, targets ${targets.length}, reports ${reports.size}, failed ${failed.length}`);

console.log(failed.slice(0, 20).join("\n"));
