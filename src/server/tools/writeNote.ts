import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import fs from "node:fs";
import path from "node:path";
import { findWorkspace } from "../../lexomni/workspace.js";
import { assertSafeRelativePath, ensureInside } from "../../lexomni/security.js";

export function writeNoteTool(server: McpServer) {
  server.registerTool(
    "lexomni.writeNote",
    {
      description: "Cria/atualiza um markdown em _lexomni/agent (memória do agente).",
      inputSchema: {
        filename: z.string().min(1),
        content: z.string().min(1),
        mode: z.enum(["overwrite", "append"]).default("overwrite")
      }
    },
    async ({ filename, content, mode }) => {
      const ws = findWorkspace();
      assertSafeRelativePath(filename);

      const abs = path.join(ws.agentDir, filename);
      ensureInside(ws.agentDir, abs);

      if (mode === "append") {
        fs.appendFileSync(abs, content.endsWith("\n") ? content : content + "\n", "utf-8");
      } else {
        fs.writeFileSync(abs, content, "utf-8");
      }

      const st = fs.statSync(abs);

      return {
        content: [
          { type: "text", text: JSON.stringify({ ok: true, path: abs, bytes: st.size, mtimeMs: st.mtimeMs }, null, 2) }
        ],
      };
    }
  );
}
