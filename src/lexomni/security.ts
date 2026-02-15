import path from "node:path";

export function assertSafeRelativePath(p: string) {
  if (p.includes("\0")) throw new Error("Path inválido.");
  if (path.isAbsolute(p)) throw new Error("Path absoluto não permitido.");
  const normalized = path.normalize(p);
  if (normalized.startsWith("..") || normalized.includes("../") || normalized.includes("..\\")) {
    throw new Error("Path traversal detectado.");
  }
}

export function ensureInside(baseDir: string, targetPath: string) {
  const rel = path.relative(baseDir, targetPath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("Acesso fora do workspace bloqueado.");
  }
}
