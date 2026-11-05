import { useOpenExternal } from "mcp-use/react";
import type { CompareResult } from "@/lib/catalog";

const sectionLabels = {
  documentation: "Tool documentation",
  tools: "Tool definitions",
  protocol: "Protocol",
  metadata: "Server metadata",
  discoverability: "Discoverability",
  apps: "MCP Apps",
} as const;

const lowestInRow = (scores: (number | null)[]): number | null => {
  const known = scores.filter((score) => score !== null);

  if (known.length < 2 || Math.min(...known) === Math.max(...known)) return null;

  return Math.min(...known);
};

export const CompareTable = ({ result }: { readonly result: CompareResult }) => {
  const openExternal = useOpenExternal();

  return (
    <div>
      <div className="wm-table-wrap">
        <table className="wm-table">
          <thead>
            <tr>
              <th scope="col">Manufact score</th>
              {result.servers.map((server) => (
                <th key={server.slug} scope="col">{server.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Overall</td>
              {result.servers.map((server) => (
                <td key={server.slug}>{server.score ?? "not scored"}</td>
              ))}
            </tr>
            {result.sectionNames.map((name) => {
              const scores = result.servers.map((server) => server.sections?.[name] ?? null);
              const lowest = lowestInRow(scores);

              return (
                <tr key={name}>
                  <td>{sectionLabels[name]}</td>
                  {result.servers.map((server, index) => (
                    <td key={server.slug} className={lowest !== null && scores[index] === lowest ? "wm-low" : undefined}>
                      {scores[index] ?? "n/a"}
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr>
              <td>Last reviewed</td>
              {result.servers.map((server) => (
                <td key={server.slug}>{server.reviewedAt?.slice(0, 10) ?? "unknown"}</td>
              ))}
            </tr>
            <tr>
              <td>Report</td>
              {result.servers.map((server) => (
                <td key={server.slug}>
                  <button className="wm-link" type="button" onClick={() => void openExternal({ url: server.reportUrl })}>
                    Open
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="wm-note">
        Scores are Manufact&apos;s, from their public reports. Orange marks the lowest score in a row. n/a means the section doesn&apos;t apply or there is no public report. {result.servers.some((server) => server.source === "snapshot") && `Some section scores are from a saved copy dated ${result.descriptionsAsOf.slice(0, 10)}.`}
      </p>
    </div>
  );
};
