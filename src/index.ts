#!/usr/bin/env node
import { startMcp } from "./server/mcp.js";

startMcp().catch((err) => {
  console.error(err);
  process.exit(1);
});
