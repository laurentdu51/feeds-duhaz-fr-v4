/**
 * Utilitaires Steam : conversion d'une URL de boutique en flux RSS d'actualités.
 *
 * Exemples acceptés :
 *  - https://store.steampowered.com/app/2713000/Resonance_A_Plague_Tale_Legacy/
 *  - https://store.steampowered.com/app/2713000
 *  - steamcommunity.com/app/2713000
 *  - 2713000
 *  - https://store.steampowered.com/feeds/news/app/2713000/ (déjà un flux)
 */

export function extractSteamAppId(input: string): string | null {
  if (!input) return null;
  const value = input.trim();

  // ID brut
  if (/^\d+$/.test(value)) return value;

  // URL de flux déjà formée
  const feedMatch = value.match(/\/feeds\/news\/app\/(\d+)/i);
  if (feedMatch) return feedMatch[1];

  // URL de boutique / communauté
  const appMatch = value.match(/\/app\/(\d+)/i);
  if (appMatch) return appMatch[1];

  return null;
}

export function buildSteamRSSUrl(appId: string): string {
  return `https://store.steampowered.com/feeds/news/app/${appId}/`;
}

export function isSteamRSSFeed(url: string): boolean {
  return /store\.steampowered\.com\/feeds\/news\/app\/\d+/i.test(url ?? '');
}

/** Convertit une URL Steam en flux RSS. Renvoie l'URL d'origine si non reconnue. */
export function convertSteamToRSS(url: string): string {
  const appId = extractSteamAppId(url);
  return appId ? buildSteamRSSUrl(appId) : url;
}

/** Déduit un nom de jeu lisible depuis le slug de l'URL boutique. */
export function extractSteamGameName(url: string): string | null {
  const match = (url ?? '').match(/\/app\/\d+\/([^/?#]+)/i);
  if (!match) return null;
  const name = decodeURIComponent(match[1])
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return name || null;
}
