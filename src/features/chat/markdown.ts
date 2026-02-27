export type MarkdownInlineNode =
  | { type: 'text'; text: string }
  | { type: 'strong'; children: MarkdownInlineNode[] }
  | { type: 'em'; children: MarkdownInlineNode[] }
  | { type: 'code'; text: string }
  | { type: 'link'; href: string; children: MarkdownInlineNode[] };

export interface MarkdownListItem {
  checked: boolean | null;
  children: MarkdownInlineNode[];
}

export type MarkdownBlockNode =
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: MarkdownInlineNode[] }
  | { type: 'paragraph'; children: MarkdownInlineNode[] }
  | { type: 'code'; language: string | null; content: string }
  | { type: 'blockquote'; children: MarkdownBlockNode[] }
  | { type: 'list'; ordered: boolean; items: MarkdownListItem[] }
  | { type: 'table'; headers: MarkdownInlineNode[][]; rows: MarkdownInlineNode[][][] };

const CODE_FENCE_RE = /^\s*```([a-zA-Z0-9_-]+)?\s*$/;
const HEADING_RE = /^\s{0,3}(#{1,6})\s+(.+)$/;
const BLOCKQUOTE_RE = /^\s*>\s?(.*)$/;
const TABLE_SEPARATOR_RE = /^\s*\|?\s*:?-{3,}:?(?:\s*\|\s*:?-{3,}:?)*\s*\|?\s*$/;
const ORDERED_LIST_RE = /^\s*(\d+)\.\s+(.+)$/;
const UNORDERED_LIST_RE = /^\s*[-*+]\s+(.+)$/;
const TASK_LIST_RE = /^\s*[-*+]\s+\[([ xX])\]\s+(.+)$/;

function isBlank(line: string): boolean {
  return line.trim().length === 0;
}

function sanitizeHref(rawHref: string): string | null {
  const href = rawHref.trim();
  if (!href) {
    return null;
  }
  if (href.startsWith('/')) {
    return href;
  }

  try {
    const url = new URL(href, 'https://example.com');
    if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:') {
      return href;
    }
    return null;
  } catch {
    return null;
  }
}

function parseTableCells(line: string): string[] {
  const trimmed = line.trim();
  const normalized = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
  const trailingRemoved = normalized.endsWith('|') ? normalized.slice(0, -1) : normalized;
  return trailingRemoved.split('|').map((cell) => cell.trim());
}

function isTableStart(lines: string[], index: number): boolean {
  if (index + 1 >= lines.length) {
    return false;
  }
  const current = lines[index];
  const next = lines[index + 1];
  return current.includes('|') && TABLE_SEPARATOR_RE.test(next);
}

function parseInlines(source: string): MarkdownInlineNode[] {
  const nodes: MarkdownInlineNode[] = [];
  let cursor = 0;

  const pushText = (text: string) => {
    if (!text) return;
    const previous = nodes[nodes.length - 1];
    if (previous?.type === 'text') {
      previous.text += text;
      return;
    }
    nodes.push({ type: 'text', text });
  };

  while (cursor < source.length) {
    if (source.startsWith('`', cursor)) {
      const closing = source.indexOf('`', cursor + 1);
      if (closing !== -1) {
        nodes.push({ type: 'code', text: source.slice(cursor + 1, closing) });
        cursor = closing + 1;
        continue;
      }
      pushText(source[cursor]);
      cursor += 1;
      continue;
    }

    if (source.startsWith('**', cursor)) {
      const closing = source.indexOf('**', cursor + 2);
      if (closing !== -1) {
        nodes.push({ type: 'strong', children: parseInlines(source.slice(cursor + 2, closing)) });
        cursor = closing + 2;
        continue;
      }
      pushText(source[cursor]);
      cursor += 1;
      continue;
    }

    const marker = source[cursor];
    if (marker === '*' || marker === '_') {
      const closing = source.indexOf(marker, cursor + 1);
      if (closing !== -1) {
        nodes.push({ type: 'em', children: parseInlines(source.slice(cursor + 1, closing)) });
        cursor = closing + 1;
        continue;
      }
    }

    if (source.startsWith('[', cursor)) {
      const labelEnd = source.indexOf(']', cursor + 1);
      if (labelEnd !== -1 && source[labelEnd + 1] === '(') {
        const hrefEnd = source.indexOf(')', labelEnd + 2);
        if (hrefEnd !== -1) {
          const label = source.slice(cursor + 1, labelEnd);
          const href = source.slice(labelEnd + 2, hrefEnd);
          const sanitized = sanitizeHref(href);
          if (sanitized) {
            nodes.push({ type: 'link', href: sanitized, children: parseInlines(label) });
          } else {
            nodes.push(...parseInlines(label));
          }
          cursor = hrefEnd + 1;
          continue;
        }
      }
    }

    pushText(source[cursor]);
    cursor += 1;
  }

  return nodes;
}

export function parseMarkdown(content: string): MarkdownBlockNode[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlockNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (isBlank(line)) {
      i += 1;
      continue;
    }

    const codeFence = CODE_FENCE_RE.exec(line);
    if (codeFence) {
      const language = codeFence[1] ?? null;
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !CODE_FENCE_RE.test(lines[i])) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length && CODE_FENCE_RE.test(lines[i])) {
        i += 1;
      }
      blocks.push({ type: 'code', language, content: codeLines.join('\n') });
      continue;
    }

    const heading = HEADING_RE.exec(line);
    if (heading) {
      const level = heading[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      blocks.push({ type: 'heading', level, children: parseInlines(heading[2].trim()) });
      i += 1;
      continue;
    }

    if (isTableStart(lines, i)) {
      const headers = parseTableCells(lines[i]).map((cell) => parseInlines(cell));
      i += 2;
      const rows: MarkdownInlineNode[][][] = [];
      while (i < lines.length && lines[i].includes('|') && !isBlank(lines[i])) {
        rows.push(parseTableCells(lines[i]).map((cell) => parseInlines(cell)));
        i += 1;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    if (BLOCKQUOTE_RE.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length) {
        const quoteMatch = BLOCKQUOTE_RE.exec(lines[i]);
        if (!quoteMatch) {
          break;
        }
        quoteLines.push(quoteMatch[1]);
        i += 1;
      }
      blocks.push({ type: 'blockquote', children: parseMarkdown(quoteLines.join('\n')) });
      continue;
    }

    const listOrdered = ORDERED_LIST_RE.test(line);
    const listUnordered = UNORDERED_LIST_RE.test(line);
    if (listOrdered || listUnordered) {
      const ordered = listOrdered;
      const items: MarkdownListItem[] = [];
      while (i < lines.length) {
        const current = lines[i];
        if (isBlank(current)) {
          break;
        }
        const taskMatch = TASK_LIST_RE.exec(current);
        const orderedMatch = ORDERED_LIST_RE.exec(current);
        const unorderedMatch = UNORDERED_LIST_RE.exec(current);
        if (ordered) {
          if (!orderedMatch) break;
          items.push({
            checked: null,
            children: parseInlines(orderedMatch[2].trim()),
          });
        } else {
          if (!unorderedMatch) break;
          if (taskMatch) {
            items.push({
              checked: taskMatch[1].toLowerCase() === 'x',
              children: parseInlines(taskMatch[2].trim()),
            });
          } else {
            items.push({
              checked: null,
              children: parseInlines(unorderedMatch[1].trim()),
            });
          }
        }
        i += 1;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const paragraphLines: string[] = [line];
    i += 1;
    while (i < lines.length && !isBlank(lines[i])) {
      const next = lines[i];
      if (
        CODE_FENCE_RE.test(next) ||
        HEADING_RE.test(next) ||
        BLOCKQUOTE_RE.test(next) ||
        ORDERED_LIST_RE.test(next) ||
        UNORDERED_LIST_RE.test(next) ||
        isTableStart(lines, i)
      ) {
        break;
      }
      paragraphLines.push(next);
      i += 1;
    }
    blocks.push({ type: 'paragraph', children: parseInlines(paragraphLines.join('\n')) });
  }

  return blocks;
}
