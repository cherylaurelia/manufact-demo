# Which MCP?

Unofficial demo by Cheryl Aurelia: not affiliated with Manufact.

An MCP App built with [mcp-use](https://github.com/mcp-use/mcp-use) that finds and compares MCP servers using the public scores on [Manufact's leaderboard](https://manufact.com/leaderboard).

**Why:** Manufact's [scoring post](https://manufact.com/blog/how-to-measure-mcp-server-quality) says a public score lets developers inspect a server before connecting it. Their own MCP's public [tool list](https://manufact.com/leaderboard/mcp-manufact-com) has no tool that reads the leaderboard (checked 2026-11-05). No user has asked for this.

## What it does
- `find-servers`: keyword search over name, description and tool names, with name and opening-word matches first, then Manufact's score order, with a React view. Each row says what matched and when it was reviewed.
- `compare-servers`: 2 to 4 servers, section by section. Also called from inside the results view with `useCallTool`.

## Run it
```bash
npm install
npm run snapshot                 # builds data/reports.json
npm run build && npm run start   # MCP endpoint at http://localhost:3000/api/mcp
npx @mcp-use/inspector --url http://localhost:3000/api/mcp --port 8090
npm test                         # parser tests
```
Use it from Claude Code: `claude mcp add --transport http which-mcp https://manufact-which-mcp.vercel.app/api/mcp`

## Limits
The leaderboard pages are parsed because no public JSON API was found. If the list can't be read, the tool errors and returns no scores. Search needs an index of descriptions and tool names, built from the public report pages by `npm run snapshot`. It isn't in this repo, so run that once (about 613 pages, slowly) before building, or the build fails. Tested in Claude Code and the mcp-use Inspector and its chat, not in ChatGPT or Claude.ai.

## Copy this
`mcp-server.ts` (view-bound tools), `views/server-results/view.tsx` (a second tool called from a view), `app/api/mcp/[[...path]]/route.ts` (MCP inside Next.js).
