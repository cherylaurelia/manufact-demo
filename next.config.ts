import type { NextConfig } from "next";
import { withMcpUse } from "mcp-use/next";

const nextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
} satisfies NextConfig;

// The adapter builds the views and configures their assets, tracing and CORS.
export default withMcpUse(nextConfig, {
  entry: "./mcp-server.ts",
  basePath: "/api/mcp",
});
