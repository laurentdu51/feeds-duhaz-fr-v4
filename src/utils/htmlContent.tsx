import React from 'react';
import { decodeHtmlEntities } from './htmlDecode';

// Whitelisted tags for safe rendering of RSS/Steam HTML content
const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'strong', 'i', 'em', 'u', 'a', 'img',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'div', 'span', 'hr', 'pre', 'code',
]);

export const containsHtml = (text: string): boolean => /<\/?[a-z][\s\S]*>/i.test(text || '');

const isSafeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

// Converts a parsed DOM node into React elements (no innerHTML, whitelist-based)
const nodeToReact = (node: Node, key: number | string): React.ReactNode => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  const children = Array.from(el.childNodes).map((child, i) =>
    nodeToReact(child, `${key}-${i}`)
  );

  if (!ALLOWED_TAGS.has(tag)) {
    // Unknown tag: render its children without the wrapper
    return <React.Fragment key={key}>{children}</React.Fragment>;
  }

  if (tag === 'img') {
    const src = el.getAttribute('src') || '';
    if (!isSafeUrl(src)) return null;
    return (
      <img
        key={key}
        src={src}
        alt={el.getAttribute('alt') || ''}
        loading="lazy"
        className="w-full h-auto rounded-lg my-3"
      />
    );
  }

  if (tag === 'a') {
    const href = el.getAttribute('href') || '';
    if (!isSafeUrl(href)) return <React.Fragment key={key}>{children}</React.Fragment>;
    return (
      <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
        {children}
      </a>
    );
  }

  if (tag === 'br') return <br key={key} />;
  if (tag === 'hr') return <hr key={key} className="my-4 border-border" />;

  return React.createElement(tag, { key }, children);
};

// Renders an HTML string (e.g. Steam feed content) as safe React elements.
// Uses DOMParser (inert document, no script execution) and a tag whitelist.
export const renderHtmlContent = (html: string): React.ReactNode => {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return Array.from(doc.body.childNodes).map((node, i) => nodeToReact(node, i));
  } catch {
    return html;
  }
};
