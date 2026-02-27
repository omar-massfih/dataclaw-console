import { describe, expect, it } from 'vitest';

import { parseMarkdown } from './markdown';

describe('parseMarkdown', () => {
  it('parses headings and paragraphs', () => {
    const blocks = parseMarkdown('# Title\n\nHello world');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ type: 'heading', level: 1 });
    expect(blocks[1]).toMatchObject({ type: 'paragraph' });
  });

  it('parses nested inline formatting', () => {
    const blocks = parseMarkdown('Hello **bold and *italic*** text');
    expect(blocks[0]).toMatchObject({ type: 'paragraph' });
  });

  it('sanitizes link schemes', () => {
    const safe = parseMarkdown('[safe](https://example.com)');
    const unsafe = parseMarkdown('[unsafe](javascript:alert(1))');
    expect(JSON.stringify(safe)).toContain('https://example.com');
    expect(JSON.stringify(unsafe)).not.toContain('javascript:alert(1)');
  });

  it('parses unordered and ordered lists', () => {
    const blocks = parseMarkdown('- one\n- two\n\n1. alpha\n2. beta');
    expect(blocks[0]).toMatchObject({ type: 'list', ordered: false });
    expect(blocks[1]).toMatchObject({ type: 'list', ordered: true });
  });

  it('parses task list items', () => {
    const blocks = parseMarkdown('- [x] done\n- [ ] pending');
    expect(blocks[0]).toMatchObject({ type: 'list', ordered: false });
    const list = blocks[0];
    if (list.type !== 'list') {
      throw new Error('expected list');
    }
    expect(list.items[0].checked).toBe(true);
    expect(list.items[1].checked).toBe(false);
  });

  it('parses fenced code blocks with language', () => {
    const blocks = parseMarkdown('```ts\nconst x = 1;\n```');
    expect(blocks[0]).toMatchObject({ type: 'code', language: 'ts', content: 'const x = 1;' });
  });

  it('parses blockquotes', () => {
    const blocks = parseMarkdown('> quote line\n> second line');
    expect(blocks[0]).toMatchObject({ type: 'blockquote' });
  });

  it('parses pipe tables', () => {
    const blocks = parseMarkdown('| Name | Value |\n| --- | --- |\n| one | 1 |');
    expect(blocks[0]).toMatchObject({ type: 'table' });
  });

  it('handles incomplete markdown during streaming', () => {
    const blocks = parseMarkdown('```ts\nconst x = 1;');
    expect(blocks[0]).toMatchObject({ type: 'code', language: 'ts', content: 'const x = 1;' });
  });
});
