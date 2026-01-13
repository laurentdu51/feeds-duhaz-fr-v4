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
    const doc = new DOMParser().parseFromString(text, 'text/html');
    decoded = doc.documentElement.textContent || '';
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
