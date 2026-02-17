import path from "node:path";

export function assertSafeRelativePath(p: string) {
  if (p.includes("\0")) throw new Error("Invalid path.");
  if (path.isAbsolute(p)) throw new Error("Absolute path not allowed.");
  const normalized = path.normalize(p);
  if (normalized.startsWith("..") || normalized.includes("../") || normalized.includes("..\\")) {
    throw new Error("Path traversal detected.");
  }
}

export function ensureInside(baseDir: string, targetPath: string) {
  const rel = path.relative(baseDir, targetPath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("Access outside workspace is blocked.");
  }
}
