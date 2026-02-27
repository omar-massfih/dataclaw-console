import type { ReactNode } from 'react';

import type { MarkdownBlockNode, MarkdownInlineNode } from './markdown';
import { parseMarkdown } from './markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function renderInlineNodes(nodes: MarkdownInlineNode[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-inline-${index}`;
    if (node.type === 'text') {
      return <span key={key}>{node.text}</span>;
    }
    if (node.type === 'code') {
      return <code key={key}>{node.text}</code>;
    }
    if (node.type === 'strong') {
      return <strong key={key}>{renderInlineNodes(node.children, key)}</strong>;
    }
    if (node.type === 'em') {
      return <em key={key}>{renderInlineNodes(node.children, key)}</em>;
    }
    return (
      <a key={key} href={node.href} target="_blank" rel="noreferrer noopener">
        {renderInlineNodes(node.children, key)}
      </a>
    );
  });
}

function renderBlockNodes(nodes: MarkdownBlockNode[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-block-${index}`;
    if (node.type === 'paragraph') {
      return <p key={key}>{renderInlineNodes(node.children, key)}</p>;
    }
    if (node.type === 'heading') {
      const Tag = `h${node.level}` as const;
      return <Tag key={key}>{renderInlineNodes(node.children, key)}</Tag>;
    }
    if (node.type === 'code') {
      return (
        <pre key={key}>
          <code className={node.language ? `language-${node.language}` : undefined}>{node.content}</code>
        </pre>
      );
    }
    if (node.type === 'blockquote') {
      return <blockquote key={key}>{renderBlockNodes(node.children, key)}</blockquote>;
    }
    if (node.type === 'list') {
      const ListTag = node.ordered ? 'ol' : 'ul';
      const start = node.ordered ? node.items[0]?.ordinal : undefined;
      return (
        <ListTag key={key} start={start}>
          {node.items.map((item, itemIndex) => (
            <li key={`${key}-item-${itemIndex}`} value={item.ordinal}>
              {item.checked !== null ? (
                <input type="checkbox" checked={item.checked} readOnly aria-label={item.checked ? 'checked task' : 'unchecked task'} />
              ) : null}
              <span>{renderInlineNodes(item.children, `${key}-item-${itemIndex}`)}</span>
            </li>
          ))}
        </ListTag>
      );
    }
    return (
      <div key={key} className="chat-markdown__table-wrap">
        <table>
          <thead>
            <tr>
              {node.headers.map((header, headerIndex) => (
                <th key={`${key}-header-${headerIndex}`}>{renderInlineNodes(header, `${key}-header-${headerIndex}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {node.rows.map((row, rowIndex) => (
              <tr key={`${key}-row-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${key}-row-${rowIndex}-cell-${cellIndex}`}>
                    {renderInlineNodes(cell, `${key}-row-${rowIndex}-cell-${cellIndex}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  });
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const blocks = parseMarkdown(content);
  return <div className={className}>{renderBlockNodes(blocks, 'markdown')}</div>;
}
