import { ThemeProvider, useToolContext } from "mcp-use/react";
import { CompareTable } from "../../components/compare-table";
import "../../components/view.css";

export default function ServerCompareView() {
  const tool = useToolContext<"compare-servers">();

  return (
    <ThemeProvider>
      <div className="wm">
        <div className="wm-head">
          <span className="wm-title">Compare servers</span>
          <span className="wm-tag">unofficial, not from Manufact</span>
        </div>
        {tool.status === "ready" && <CompareTable result={tool.toolOutput} />}
        {tool.status === "pending" && <p className="wm-note">Reading the public reports…</p>}
        {tool.status === "error" && <p className="wm-error">{tool.error.message}</p>}
      </div>
    </ThemeProvider>
  );
}
