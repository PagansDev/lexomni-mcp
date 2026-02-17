import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { buildManifest } from './manifest.js';
import type { LexomniWorkspace } from './workspace.js';

function createTempWorkspace(): { ws: LexomniWorkspace; tmpRoot: string } {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lexomni-test-'));
  const root = path.join(tmpRoot, '_lexomni');
  const userDir = path.join(root, 'user');
  const agentDir = path.join(root, 'agent');
  const booksDir = path.join(root, 'books');
  const indexDir = path.join(root, 'index');

  fs.mkdirSync(userDir, { recursive: true });
  fs.mkdirSync(agentDir, { recursive: true });
  fs.mkdirSync(booksDir, { recursive: true });
  fs.mkdirSync(indexDir, { recursive: true });

  return { ws: { root, userDir, agentDir, booksDir, indexDir }, tmpRoot };
}

describe('buildManifest', () => {
  let ws: LexomniWorkspace;
  let tmpRoot: string;

  before(() => {
    const result = createTempWorkspace();
    ws = result.ws;
    tmpRoot = result.tmpRoot;

    fs.writeFileSync(path.join(ws.userDir, 'user-note.md'), '# User', 'utf-8');
    fs.writeFileSync(path.join(ws.agentDir, 'memory.md'), '# Agent', 'utf-8');
    fs.writeFileSync(path.join(ws.booksDir, 'book.pdf'), '%PDF-1.4', 'utf-8');
    fs.writeFileSync(path.join(ws.agentDir, 'ignored.txt'), 'ignored', 'utf-8');
  });

  after(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('lists only .md files in user/agent and .pdf files in books', () => {
    const docs = buildManifest(ws);
    assert.equal(docs.length, 3);
  });

  it('assigns source correctly', () => {
    const docs = buildManifest(ws);
    const sources = docs.map((d) => d.source).sort();
    assert.deepEqual(sources, ['agent', 'books', 'user']);
  });

  it('assigns type correctly based on file extension', () => {
    const docs = buildManifest(ws);
    const userDoc = docs.find((d) => d.source === 'user');
    const booksDoc = docs.find((d) => d.source === 'books');
    assert.equal(userDoc?.type, 'md');
    assert.equal(booksDoc?.type, 'pdf');
  });

  it('generates docId in source:relPath format', () => {
    const docs = buildManifest(ws);
    for (const doc of docs) {
      assert.ok(doc.docId.startsWith(`${doc.source}:`), `invalid docId: ${doc.docId}`);
    }
  });

  it('includes relPath relative to workspace root', () => {
    const docs = buildManifest(ws);
    const userDoc = docs.find((d) => d.source === 'user');
    assert.ok(userDoc?.relPath.startsWith('user/'), `invalid relPath: ${userDoc?.relPath}`);
  });

  it('returns empty array when no files exist', () => {
    const emptyResult = createTempWorkspace();
    const docs = buildManifest(emptyResult.ws);
    assert.equal(docs.length, 0);
    fs.rmSync(emptyResult.tmpRoot, { recursive: true, force: true });
  });
});
