import server from "@/mcp-server";
import { createNextHandler } from "mcp-use/next";

export const { GET, POST, DELETE, OPTIONS } = createNextHandler(server);
