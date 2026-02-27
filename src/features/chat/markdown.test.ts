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
    const orderedList = blocks[1];
    if (orderedList.type !== 'list') {
      throw new Error('expected ordered list');
    }
    expect(orderedList.items[0]?.ordinal).toBe(1);
    expect(orderedList.items[1]?.ordinal).toBe(2);
  });

  it('preserves non-default ordered list numbering', () => {
    const blocks = parseMarkdown('3. third\n4. fourth\n\n1. one\n3. three');
    const firstList = blocks[0];
    const secondList = blocks[1];
    if (firstList?.type !== 'list' || secondList?.type !== 'list') {
      throw new Error('expected ordered lists');
    }
    expect(firstList.items[0]?.ordinal).toBe(3);
    expect(firstList.items[1]?.ordinal).toBe(4);
    expect(secondList.items[0]?.ordinal).toBe(1);
    expect(secondList.items[1]?.ordinal).toBe(3);
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
