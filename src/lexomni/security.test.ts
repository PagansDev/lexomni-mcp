import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertSafeRelativePath, ensureInside } from './security.js';

describe('assertSafeRelativePath', () => {
  it('accepts simple relative paths', () => {
    assert.doesNotThrow(() => assertSafeRelativePath('note.md'));
    assert.doesNotThrow(() => assertSafeRelativePath('subdir/note.md'));
  });

  it('rejects paths with null byte', () => {
    assert.throws(() => assertSafeRelativePath('note\0.md'), /invalid/i);
  });

  it('rejects absolute paths', () => {
    assert.throws(() => assertSafeRelativePath('/etc/passwd'), /absolute/i);
  });

  it('rejects path traversal with ../', () => {
    assert.throws(() => assertSafeRelativePath('../outside.md'), /traversal/i);
  });

  it('rejects path traversal with ..\\', () => {
    assert.throws(() => assertSafeRelativePath('..\\outside.md'), /traversal/i);
  });

  it('rejects path starting with ..', () => {
    assert.throws(() => assertSafeRelativePath('..'), /traversal/i);
  });
});

describe('ensureInside', () => {
  const baseDir = '/workspace/agent';

  it('accepts path inside the base directory', () => {
    assert.doesNotThrow(() => ensureInside(baseDir, '/workspace/agent/note.md'));
    assert.doesNotThrow(() => ensureInside(baseDir, '/workspace/agent/sub/note.md'));
  });

  it('rejects path outside base directory via traversal', () => {
    assert.throws(
      () => ensureInside(baseDir, '/workspace/other/note.md'),
      /blocked/i,
    );
  });

  it('rejects absolute path escaping base directory', () => {
    assert.throws(
      () => ensureInside(baseDir, '/etc/passwd'),
      /blocked/i,
    );
  });
});
