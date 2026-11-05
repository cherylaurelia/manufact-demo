import { useState } from "react";
import { ThemeProvider, useCallTool, useOpenExternal, useToolContext } from "mcp-use/react";
import { CompareTable } from "../../components/compare-table";
import type { SearchResult } from "../../lib/catalog";
import "../../components/view.css";

const staleAfterDays = 30;

const Results = ({ result }: { readonly result: SearchResult }) => {
  const [picked, setPicked] = useState<string[]>([]);
  const compare = useCallTool("compare-servers");
  const openExternal = useOpenExternal();

  const toggle = (slug: string): void => {
    setPicked((current) => (current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug].slice(-4)));
  };

  if (result.matches === 0) {
    return (
      <p className="wm-note">
        Nothing on the leaderboard matches &ldquo;{result.words.join(" ")}&rdquo; in its name, description or tool names.{" "}
        <button className="wm-link" type="button" onClick={() => void openExternal({ url: result.leaderboardUrl })}>
          Browse the leaderboard
        </button>
      </p>
    );
  }

  const firstMention = result.servers.find((server) => !server.mainlyAbout)?.slug;

  return (
    <div>
      {result.mainMatches === 0 && (
        <p className="wm-note wm-old">This keyword search found nothing mainly about this, which doesn&apos;t mean the leaderboard has nothing. These only mention it.</p>
      )}
      {result.servers.map((server) => (
        <div key={server.slug}>
          {server.slug === firstMention && <div className="wm-group">Only mention it</div>}
        <div className="wm-row">
          <input
            aria-label={`Pick ${server.name} to compare`}
            checked={picked.includes(server.slug)}
            disabled={server.score === null}
            onChange={() => toggle(server.slug)}
            type="checkbox"
          />
          <div className="wm-score">
            {server.score ?? "–"}
            <small>{server.score === null ? "not scored" : "/100"}</small>
          </div>
          <div>
            <div className="wm-name">{server.name}</div>
            {server.description !== "" && <div className="wm-desc">{server.description}</div>}
            <div className="wm-meta">
              matched in {server.matchedIn.join(", ")}
              {server.matchedTools.length > 0 && ` (${server.matchedTools.join(", ")})`}
              {" · "}
              {server.reviewedAt === null ? (
                "no review date"
              ) : (
                <span className={(server.reviewedDaysAgo ?? 0) > staleAfterDays ? "wm-old" : undefined}>
                  reviewed {server.reviewedAt.slice(0, 10)}
                </span>
              )}
            </div>
          </div>
          <button className="wm-link" type="button" onClick={() => void openExternal({ url: server.reportUrl })}>
            Report
          </button>
        </div>
        </div>
      ))}
      <div className="wm-foot">
        <span className="wm-meta">
          Showing {result.servers.length} of {result.matches}, {result.scoredMatches} scored{result.hiddenDuplicates > 0 && `, ${result.hiddenDuplicates} same-name listings hidden`}. Keyword match, name and opening words first, then Manufact&apos;s score. Descriptions saved {result.descriptionsAsOf.slice(0, 10)}.
        </span>
        <button
          className="wm-btn"
          disabled={picked.length < 2 || compare.isPending}
          onClick={() => void compare.callTool({ slugs: picked }).catch(() => undefined)}
          type="button"
        >
          {compare.isPending ? "Reading reports…" : `Compare ${picked.length > 1 ? picked.length : ""}`.trim()}
        </button>
      </div>
      {compare.error !== undefined && <p className="wm-error">{compare.error.message}</p>}
      {compare.data !== undefined && (
        <div style={{ marginTop: 12 }}>
          <CompareTable result={compare.data.structuredContent} />
        </div>
      )}
    </div>
  );
};

export default function ServerResultsView() {
  const tool = useToolContext<"find-servers">();

  return (
    <ThemeProvider>
      <div className="wm">
        <div className="wm-head">
          <span className="wm-title">
            {tool.status === "ready" ? `MCP servers for “${tool.toolOutput.words.join(" ")}”` : "Which MCP?"}
          </span>
          <span className="wm-tag">unofficial, not from Manufact</span>
        </div>
        {tool.status === "ready" && <Results result={tool.toolOutput} />}
        {tool.status === "pending" && <p className="wm-note">Reading the leaderboard…</p>}
        {tool.status === "error" && <p className="wm-error">{tool.error.message}</p>}
      </div>
    </ThemeProvider>
  );
}
