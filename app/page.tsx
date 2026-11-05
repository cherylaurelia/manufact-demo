import Image from "next/image";

const endpoint = "https://manufact-which-mcp.vercel.app/api/mcp";
const repo = "https://github.com/cherylaurelia/manufact-demo";

const viewCode = `// views/server-results/view.tsx
const compare = useCallTool("compare-servers");

<button onClick={() => compare.callTool({ slugs: picked })}>
  Compare {picked.length}
</button>
{compare.data && <CompareTable result={compare.data.structuredContent} />}`;

const easy = [
  ["Typed tool calls from the view.", "useCallTool knows the arguments and output of compare-servers from the server file, so the Compare button took a few lines."],
  ["mcp-use screenshot.", "One command calls a tool and saves its rendered view. I used it to check every view on the deployed server."],
  ["One deploy.", "This page and the MCP endpoint are the same Next.js app, through withMcpUse and createNextHandler."],
] as const;

const hard = [
  "The embedded Next.js build failed until I installed @mcp-use/client, which is an optional peer of mcp-use.",
  "withMcpUse rejects a config typed as NextConfig once it has a turbopack block; `satisfies NextConfig` works, as your example does.",
] as const;

const limits = [
  "The views have run in your Inspector and its chat, not inside ChatGPT or Claude, because I didn't add a connector to a personal account for this. Claude Code shows the text result.",
  "The leaderboard has no public JSON API I could find, so this reads your public pages. If the list can't be read, the tool returns an error and no scores.",
  "Search is keyword matching. Unscored servers match on name and URL only, and Postgres hosts whose text never says Postgres, like Supabase, won't appear for that word.",
  "Not on your scorer, because submitting publishes to your catalog. On Vercel, not Manufact Cloud, because I didn't connect a GitHub account for this demo.",
] as const;

const buttonBase = "rounded-full px-4 py-2 text-sm font-medium";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-sm text-[var(--muted)]">Built with mcp-use · unofficial</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Your MCP leaderboard, as an MCP App.</h1>
      <p className="mt-4 text-lg text-[var(--muted)]">
        Your scores are for inspecting a server before connecting it, but your own MCP has no tool that reads them. Which MCP? lets an agent search and compare them, and links back to your reports.
      </p>
      <p className="mt-3 text-sm text-[var(--muted)]">Nobody asked for this: it&apos;s my guess that the scores are useful at the moment someone picks a server. I built it to learn mcp-use on something you&apos;d recognise. It runs in your Inspector&apos;s chat; I haven&apos;t tried it in ChatGPT or Claude.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a className={`${buttonBase} bg-[var(--ink)] text-white`} href={repo}>View the repo</a>
        <a className={`${buttonBase} border border-[var(--line)]`} href="https://manufact.com/leaderboard">Manufact&apos;s leaderboard</a>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Try it</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-[var(--alt)] p-4 text-sm"><code>{`claude mcp add --transport http which-mcp ${endpoint}`}</code></pre>
        <p className="mt-2 text-sm text-[var(--muted)]">Or open the endpoint in the mcp-use Inspector to see the views. No key needed; both tools are read-only.</p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">In a real chat</h2>
        <Image className="mt-3 h-auto w-full rounded-lg border border-[var(--line)]" src="/chat-view.jpg" width={740} height={325} priority alt="mcp-use Inspector chat: a find-servers call followed by the results view in the conversation, showing AgentMail 92 and Cooper Email 90." />
        <p className="mt-2 text-sm text-[var(--muted)]">Your Inspector&apos;s chat with GPT-5.6 Luna against the deployed server, asked which server to connect for an agent&apos;s own email inbox. It called find-servers, showed this view and named AgentMail first. Servers with the keyword in their name or opening words come first, then your score order.</p>
        <p className="mt-2 text-sm text-[var(--muted)]">The first run found a bug: the model passed a category filter I had added, which dropped AgentMail because it&apos;s filed under developer-tools. I removed the filter.</p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Compare, called from inside the view</h2>
        <Image className="mt-3 h-auto w-full rounded-lg border border-[var(--line)]" src="/inspector-compare-crop.jpg" width={738} height={405} loading="eager" alt="Comparison table inside the view: AgentMail, Cooper Email and Primitive Email, section by section, with Discoverability 67, 58 and 17." />
        <p className="mt-2 text-sm text-[var(--muted)]">Tick servers, press Compare, and the view calls a second tool. Clicked in the hosted Inspector against the deployed server. This is the part worth copying.</p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-[var(--alt)] p-4 text-sm"><code>{viewCode}</code></pre>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Two answers from Claude Code</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Connected to the deployed server and no other, one run each. The first prompt doesn&apos;t name the tools; it found them because they were the only ones connected.</p>
        <blockquote className="mt-3 rounded-lg border border-[var(--line)] p-4 text-sm">
          <p className="font-medium">&ldquo;I want my agent to have its own email inbox. Which MCP server should I connect?&rdquo;</p>
          <p className="mt-3">&ldquo;I&apos;d connect AgentMail &hellip; It also has the highest score of the four main options, though the lead over Cooper Email is too small to decide on alone.&rdquo;</p>
        </blockquote>
        <blockquote className="mt-3 rounded-lg border border-[var(--line)] p-4 text-sm">
          <p className="font-medium">&ldquo;Which MCP server should I connect for Postgres? Use the which-mcp tools.&rdquo;</p>
          <p className="mt-3">&ldquo;The leaderboard has no server mainly about Postgres, and no general one for connecting to any Postgres database, including self-hosted.&rdquo;</p>
        </blockquote>
        <p className="mt-2 text-sm text-[var(--muted)]">Excerpts. Postgres is the weak case: the word only appears in tool names on Neon, PlanetScale and ClickHouse. The agent tried &ldquo;sql&rdquo; on its own and found Supabase too, and made a suggestion from there.</p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Limits</h2>
        <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-[var(--muted)]">
          {limits.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="mt-10 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">What made it easy</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {easy.map(([title, body]) => (
              <li key={title}><span className="font-medium">{title}</span> <span className="text-[var(--muted)]">{body}</span></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Where I got stuck</h2>
          <ul className="mt-3 list-disc space-y-3 pl-4 text-sm text-[var(--muted)]">
            {hard.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </section>

      <footer className="mt-12 border-t border-[var(--line)] pt-5 text-sm text-[var(--muted)]">
        Unofficial demo by Cheryl Aurelia: not affiliated with Manufact. All scores belong to Manufact.
      </footer>
    </main>
  );
}
