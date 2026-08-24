import { createElement, type ReactNode } from 'react';
import './WikiText.css';

const commentPattern = /\[!--[\s\S]*?--\]/g;
const inlinePattern = /(\[\[https?:\/\/[^\s\]]+(?:\s+[^\]]+)?\]\]|https?:\/\/[^\s<>"']+|\*\*[^*\n]+\*\*|\/\/[^/\n]+\/\/|__[^_\n]+__|--[^-\n]+--|\{\{[^}\n]+\}\}|\^\^[^^\n]+\^\^|,,[^,\n]+,,)/g;
const trailingPunctuation = /[),.;!?\]}，。；！？）》】]+$/;

function renderInline(source: string, keyPrefix: string): ReactNode[] {
  const text = source.replace(commentPattern, '');
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let sequence = 0;
  for (const match of text.matchAll(inlinePattern)) {
    const token = match[0];
    const start = match.index ?? 0;
    const key = `${keyPrefix}-${sequence++}`;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    if (token.startsWith('[[')) {
      const link = token.slice(2, -2);
      const separator = link.search(/\s/);
      const url = separator < 0 ? link : link.slice(0, separator);
      const label = separator < 0 ? url : link.slice(separator).trim();
      nodes.push(<a key={key} href={url} target="_blank" rel="noreferrer">{label}</a>);
    } else if (/^https?:\/\//.test(token)) {
      const url = token.replace(trailingPunctuation, '');
      nodes.push(<a key={key} href={url} target="_blank" rel="noreferrer">{url}</a>);
      if (url.length < token.length) nodes.push(token.slice(url.length));
    } else if (token.startsWith('**')) nodes.push(<strong key={key}>{renderInline(token.slice(2, -2), key)}</strong>);
    else if (token.startsWith('//')) nodes.push(<em key={key}>{renderInline(token.slice(2, -2), key)}</em>);
    else if (token.startsWith('__')) nodes.push(<u key={key}>{renderInline(token.slice(2, -2), key)}</u>);
    else if (token.startsWith('--')) nodes.push(<del key={key}>{renderInline(token.slice(2, -2), key)}</del>);
    else if (token.startsWith('{{')) nodes.push(<code key={key}>{token.slice(2, -2)}</code>);
    else if (token.startsWith('^^')) nodes.push(<sup key={key}>{renderInline(token.slice(2, -2), key)}</sup>);
    else if (token.startsWith(',,')) nodes.push(<sub key={key}>{renderInline(token.slice(2, -2), key)}</sub>);
    cursor = start + token.length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function renderLines(lines: string[], keyPrefix: string) {
  return lines.flatMap((line, index) => index ? [<br key={`${keyPrefix}-br-${index}`} />, ...renderInline(line, `${keyPrefix}-${index}`)] : renderInline(line, `${keyPrefix}-${index}`));
}

const isBlockStart = (line: string) => /^\+{1,6}\s+/.test(line) || /^----+$/.test(line.trim()) || /^[*#]\s+/.test(line) || /^>\s?/.test(line);

export function WikiText({ text }: { text?: string }) {
  const lines = (text ?? '').replace(commentPattern, '').split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }
    const heading = line.match(/^(\+{1,6})\s+(.+)$/);
    if (heading) {
      const level = Math.min(6, heading[1].length + 1);
      blocks.push(createElement(`h${level}`, { key: `heading-${index}` }, renderInline(heading[2], `heading-${index}`)));
      index += 1;
      continue;
    }
    if (/^----+$/.test(line.trim())) {
      blocks.push(<hr key={`rule-${index}`} />);
      index += 1;
      continue;
    }
    const list = line.match(/^([*#])\s+(.+)$/);
    if (list) {
      const marker = list[1];
      const items: ReactNode[] = [];
      while (index < lines.length) {
        const item = lines[index].match(/^([*#])\s+(.+)$/);
        if (!item || item[1] !== marker) break;
        items.push(<li key={`item-${index}`}>{renderInline(item[2], `item-${index}`)}</li>);
        index += 1;
      }
      blocks.push(marker === '#' ? <ol key={`list-${index}`}>{items}</ol> : <ul key={`list-${index}`}>{items}</ul>);
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      const quoteStart = index;
      while (index < lines.length && /^>\s?/.test(lines[index])) quoteLines.push(lines[index++].replace(/^>\s?/, ''));
      blocks.push(<blockquote key={`quote-${quoteStart}`}>{renderLines(quoteLines, `quote-${quoteStart}`)}</blockquote>);
      continue;
    }
    const paragraphLines: string[] = [];
    const paragraphStart = index;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) paragraphLines.push(lines[index++]);
    blocks.push(<p key={`paragraph-${paragraphStart}`}>{renderLines(paragraphLines, `paragraph-${paragraphStart}`)}</p>);
  }
  return <>{blocks}</>;
}
