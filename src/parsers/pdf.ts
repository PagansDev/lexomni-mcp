import fs from "node:fs";
import pdfParse from "pdf-parse";

export async function readPdfText(filePath: string): Promise<string> {
  const buf = fs.readFileSync(filePath);
  const data = await pdfParse(buf);
  return data.text ?? "";
}
