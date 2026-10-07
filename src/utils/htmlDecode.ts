// Singleton textarea element for HTML entity decoding
let textareaElement: HTMLTextAreaElement | null = null;

const getTextarea = (): HTMLTextAreaElement => {
  if (!textareaElement) {
    textareaElement = document.createElement('textarea');
  }
  return textareaElement;
};

// Simple cache for decoded strings
const decodeCache = new Map<string, string>();
const MAX_CACHE_SIZE = 500;

export const decodeHtmlEntities = (text: string): string => {
  if (!text) return '';
  
  // Check cache first
  const cached = decodeCache.get(text);
  if (cached !== undefined) return cached;
  
  // Safe decode using DOMParser - prevents XSS by not executing scripts
  // DOMParser creates an inert document that doesn't execute scripts or load resources
  let decoded: string;
  try {
    decoded = text;
    // Some feeds are double (or triple) encoded: "&amp;eacute;" -> "&eacute;" -> "é"
    for (let i = 0; i < 3; i++) {
      if (!/&[a-z#0-9]+;/i.test(decoded)) break;
      const doc = new DOMParser().parseFromString(decoded, 'text/html');
      const next = doc.documentElement.textContent || '';
      if (next === decoded) break;
      decoded = next;
    }
  } catch {
    // Fallback for edge cases - just return the original text
    decoded = text;
  }
  
  // Cache the result (with size limit)
  if (decodeCache.size >= MAX_CACHE_SIZE) {
    const firstKey = decodeCache.keys().next().value;
    if (firstKey) decodeCache.delete(firstKey);
  }
  decodeCache.set(text, decoded);
  
  return decoded;
};

/**
 * Decodes entities and removes any markup from a plain-text field (titles, badges).
 * Safe by construction: text nodes only, no HTML rendering involved.
 */
export const cleanPlainText = (text: string): string => {
  if (!text) return '';
  return decodeHtmlEntities(text).replace(/<[^>]*>/g, '').trim();
};
