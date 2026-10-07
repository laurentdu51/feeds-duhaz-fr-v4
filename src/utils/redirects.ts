import { decodeHtmlEntities } from './htmlDecode';

/**
 * Google News / Google Alerts feeds wrap article links in a redirect URL like
 * https://www.google.com/url?rct=j&sa=t&url=https://example.com/article&ct=ga&cd=...
 * This unwraps them to the final destination URL. Anything else is returned unchanged.
 */
export const unwrapGoogleRedirect = (rawUrl?: string | null): string | undefined => {
  if (!rawUrl) return undefined;
  const decoded = decodeHtmlEntities(rawUrl).trim();
  try {
    const url = new URL(decoded);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (
      (host === 'google.com' || host === 'news.google.com') &&
      (url.pathname === '/url' || url.pathname === '/link')
    ) {
      const target = url.searchParams.get('url') || url.searchParams.get('q');
      if (target && /^https?:\/\//i.test(target)) {
        return target;
      }
    }
  } catch {
    // Not a parsable URL - return as-is
  }
  return decoded;
};
