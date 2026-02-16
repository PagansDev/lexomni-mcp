import fs from 'node:fs';
import path from 'node:path';

export type LexomniWorkspace = {
  root: string;
  userDir: string;
  agentDir: string;
  booksDir: string;
  indexDir: string;
};

function existsDir(p: string) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

export function findWorkspace(startDir = process.cwd()): LexomniWorkspace {
  let cur = path.resolve(startDir);

  for (;;) {
    const candidate = path.join(cur, '_lexomni');
    if (existsDir(candidate)) {
      const userDir = path.join(candidate, 'user');
      const agentDir = path.join(candidate, 'agent');
      const booksDir = path.join(candidate, 'books');
      const indexDir = path.join(candidate, 'index');

      fs.mkdirSync(userDir, { recursive: true });
      fs.mkdirSync(agentDir, { recursive: true });
      fs.mkdirSync(booksDir, { recursive: true });
      fs.mkdirSync(indexDir, { recursive: true });

      return { root: candidate, userDir, agentDir, booksDir, indexDir };
    }

    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }

  const root = path.join(path.resolve(startDir), '_lexomni');
  const userDir = path.join(root, 'user');
  const agentDir = path.join(root, 'agent');
  const booksDir = path.join(root, 'books');
  const indexDir = path.join(root, 'index');

  fs.mkdirSync(userDir, { recursive: true });
  fs.mkdirSync(agentDir, { recursive: true });
  fs.mkdirSync(booksDir, { recursive: true });
  fs.mkdirSync(indexDir, { recursive: true });

  return { root, userDir, agentDir, booksDir, indexDir };
}
