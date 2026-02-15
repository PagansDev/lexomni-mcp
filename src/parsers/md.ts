import fs from "node:fs";

export function readMarkdownText(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}
