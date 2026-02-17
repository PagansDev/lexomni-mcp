import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chunkMarkdownByLines, chunkTextByChars } from './chunking.js';

describe('chunkMarkdownByLines', () => {
  it('returns a single chunk for text smaller than the limit', () => {
    const text = 'line 1\nline 2\nline 3';
    const chunks = chunkMarkdownByLines(text, 10);
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0].chunkIndex, 0);
    assert.equal(chunks[0].lineStart, 1);
    assert.equal(chunks[0].lineEnd, 3);
    assert.equal(chunks[0].text, text);
  });

  it('splits into multiple chunks when exceeding the limit', () => {
    const lines = Array.from({ length: 10 }, (_, i) => `line ${i + 1}`);
    const text = lines.join('\n');
    const chunks = chunkMarkdownByLines(text, 3);
    assert.equal(chunks.length, 4);
    assert.equal(chunks[0].chunkIndex, 0);
    assert.equal(chunks[0].lineStart, 1);
    assert.equal(chunks[0].lineEnd, 3);
    assert.equal(chunks[1].chunkIndex, 1);
    assert.equal(chunks[1].lineStart, 4);
    assert.equal(chunks[3].lineEnd, 10);
  });

  it('returns a single chunk for empty text', () => {
    const chunks = chunkMarkdownByLines('', 10);
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0].text, '');
  });

  it('indexes chunkIndex sequentially starting from 0', () => {
    const lines = Array.from({ length: 6 }, (_, i) => `l${i}`).join('\n');
    const chunks = chunkMarkdownByLines(lines, 2);
    chunks.forEach((c, i) => assert.equal(c.chunkIndex, i));
  });
});

describe('chunkTextByChars', () => {
  it('returns a single chunk for text smaller than the limit', () => {
    const text = 'short text';
    const chunks = chunkTextByChars(text, 100);
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0].chunkIndex, 0);
    assert.equal(chunks[0].text, text);
  });

  it('splits into multiple chunks by character count', () => {
    const text = 'abcdefghij';
    const chunks = chunkTextByChars(text, 3);
    assert.equal(chunks.length, 4);
    assert.equal(chunks[0].text, 'abc');
    assert.equal(chunks[1].text, 'def');
    assert.equal(chunks[2].text, 'ghi');
    assert.equal(chunks[3].text, 'j');
  });

  it('does not include lineStart/lineEnd in chunks', () => {
    const chunks = chunkTextByChars('abc', 10);
    assert.equal(chunks[0].lineStart, undefined);
    assert.equal(chunks[0].lineEnd, undefined);
  });

  it('indexes chunkIndex sequentially starting from 0', () => {
    const text = 'abcdefgh';
    const chunks = chunkTextByChars(text, 2);
    chunks.forEach((c, i) => assert.equal(c.chunkIndex, i));
  });
});
