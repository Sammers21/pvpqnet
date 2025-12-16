const express = require('express');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
const axios = require('axios');


const app = express();
const distIndexPath = path.join(__dirname, 'dist', 'index.html');
const templateIndexPath = fs.existsSync(distIndexPath)
  ? distIndexPath
  : path.join(__dirname, 'index.html');
const indexHtmlContent = fs.readFileSync(templateIndexPath, 'utf8');
const $ = cheerio.load(indexHtmlContent);
const baseTemplate = $.html();
const distDir = path.join(__dirname, 'dist');
const staticDir = fs.existsSync(distDir) ? distDir : path.join(__dirname, 'public');

const BASE_URL = process.env.PUBLIC_BASE_URL || 'https://pvpq.net';
const API_BASE_URL = process.env.SSR_API_BASE || 'https://pvpq.net';
const SSR_API_TIMEOUT_MS = Number(process.env.SSR_API_TIMEOUT_MS || 2500);
const DEFAULT_CACHE_TTL_MS = Number(process.env.SEO_CACHE_TTL_MS || 5 * 60 * 1000);
const ERROR_CACHE_TTL_MS = Number(process.env.SEO_CACHE_ERROR_TTL_MS || 60 * 1000);
const CURRENT_SEASON = 'TWW Season 3';
const DEFAULT_DESCRIPTION = "World of Warcraft PvP Ladder & Activity Tracker for Solo Shuffle, Blitz, 3v3 and 2v2 Arena, Rated Battlegrounds. R1 Rank One cutoffs, Gladiator cutoffs for every bracket. Player profiles with statistics, Meta analysis, AI post-game coaching, Multiclasser ratings, Hidden character tracking";
const DEFAULT_KEYWORDS = "World of Warcraft PvP, Solo Shuffle, Arena 3v3 leaderboard, Arena 3v3 ladder, Arena 2v2 ladder, Blitz ladder, Blitz activity, Rated Battlegrounds leaderboard, WoW Arena leaderboard, PvP stats, WoW ratings, AI arena coach, Arena Meta analysis, WoW PvP profiles, Rated Battlegrounds tracker, WoW PvP analytics, PvP character tracking, WoW PvP multiclass ratings, Shuffle Multiclassers ratings, R1 cutoff, Rank One cutoff, Gladiator cutoff, Solo Shuffle R1, 3v3 R1 cutoff, 2v2 R1 cutoff, Blitz R1 cutoff, RBG R1 cutoff, WoW Gladiator rating, TWW Season 3 cutoffs";
const DEFAULT_IMAGE = `${BASE_URL}/icons/original-logo.webp`;
const SITE_NAME = 'PVPQ.NET';
const TWITTER_HANDLE = '@pvpqnet';
const TWITTER_CREATOR = '@sammers_wow';
const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: BASE_URL,
  logo: DEFAULT_IMAGE,
  sameAs: [
    'https://twitter.com/pvpqnet',
    'https://github.com/Sammers21/pvpqnet',
    'https://discord.gg/TxaZQh88Uf',
  ],
  description: 'World of Warcraft PvP analytics, leaderboards, and player statistics.',
};
const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: BASE_URL,
  description: DEFAULT_DESCRIPTION,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE_URL}/{region}/{realm}/{name}`,
    },
    'query-input': 'required name=name',
  },
};
const REGION_TITLES = {
  us: 'North America (US)',
  eu: 'Europe (EU)',
};
const REGION_TO_LOCALE = {
  us: 'en-us',
  eu: 'en-gb',
};
const BRACKET_TITLES = {
  '2v2': '2v2 Arena',
  '3v3': '3v3 Arena',
  rbg: 'Rated Battlegrounds',
  shuffle: 'Solo Shuffle',
  'shuffle-multiclass': 'Shuffle Multiclassers',
};
const BRACKET_TYPE_LABELS = {
  SHUFFLE: 'Solo Shuffle',
  ARENA_3v3: '3v3 Arena',
  ARENA_2v2: '2v2 Arena',
  BATTLEGROUNDS: 'Rated Battlegrounds',
};
const ACTIVITY_LABELS = {
  activity: 'Activity Tracker',
  ladder: 'Leaderboard',
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: SSR_API_TIMEOUT_MS,
  headers: {
    'User-Agent': 'PvPQNet-SSR/1.0 (+https://pvpq.net)',
    'Accept-Encoding': 'gzip, deflate',
  },
  validateStatus: (status) => status < 500,
});

const seoCache = new Map();

function getCacheEntry(key) {
  const entry = seoCache.get(key);
  if (!entry) {
    return undefined;
  }
  if (entry.expiresAt < Date.now()) {
    seoCache.delete(key);
    return undefined;
  }
  return entry.value;
}

function setCacheEntry(key, value, ttlMs = DEFAULT_CACHE_TTL_MS) {
  seoCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

async function fetchWithCache(key, fetcher, { ttlMs = DEFAULT_CACHE_TTL_MS, errorTtlMs = ERROR_CACHE_TTL_MS } = {}) {
  const cached = getCacheEntry(key);
  if (typeof cached !== 'undefined') {
    return cached;
  }
  try {
    const value = await fetcher();
    setCacheEntry(key, value, value ? ttlMs : errorTtlMs);
    return value;
  } catch (error) {
    console.warn('[seo-cache]', key, error.message);
    setCacheEntry(key, null, errorTtlMs);
    return null;
  }
}

function capitalizeFirstLetter(str = '') {
  if (!str) return '';
  const lower = str.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function formatSegment(value = '') {
  return value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((segment) => capitalizeFirstLetter(segment))
    .join(' ');
}

function isValidRegion(value = '') {
  const normalized = value.toLowerCase();
  return normalized === 'us' || normalized === 'eu';
}

function isValidActivity(value = '') {
  const normalized = value.toLowerCase();
  return normalized === 'activity' || normalized === 'ladder';
}

function isValidBracket(value = '') {
  const normalized = value.toLowerCase();
  return (
    normalized === '2v2' ||
    normalized === '3v3' ||
    normalized === 'rbg' ||
    normalized === 'shuffle' ||
    normalized === 'shuffle-multiclass'
  );
}

function toCanonical(pathname = '/') {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  try {
    const canonicalUrl = new URL(normalizedPath, BASE_URL);
    return canonicalUrl.toString();
  } catch (error) {
    return `${BASE_URL}${normalizedPath}`;
  }
}

function truncateDescription(text = '', maxLength = 165) {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}

function cloneTemplate() {
  return cheerio.load(baseTemplate);
}

function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return undefined;
  }
  return number.toLocaleString('en-US');
}

function formatCharacterPath(region, realm, name) {
  if (!region || !realm || !name) {
    return undefined;
  }
  const realmSlug = encodeURIComponent(realm.toLowerCase());
  const nameSlug = encodeURIComponent(name.toLowerCase());
  return `/${region.toLowerCase()}/${realmSlug}/${nameSlug}`;
}

function mergeStructuredData(base = {}, extra) {
  if (!extra || typeof extra !== 'object') {
    return base;
  }
  return Object.assign({}, base, extra);
}

function normalizeImageUrl(url) {
  if (!url) {
    return undefined;
  }
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${BASE_URL}${url}`;
  }
  return `${BASE_URL}/${url}`;
}

function upsertMeta(dom, selector, attributes) {
  const element = dom(selector);
  if (element.length) {
    Object.entries(attributes).forEach(([key, value]) => element.attr(key, value));
    return;
  }
  const meta = dom('<meta />');
  Object.entries(attributes).forEach(([key, value]) => meta.attr(key, value));
  dom('head').append(meta);
}

function upsertLink(dom, rel, href) {
  const selector = `link[rel="${rel}"]`;
  const element = dom(selector);
  if (element.length) {
    element.attr('href', href);
    return;
  }
  const link = dom('<link />');
  link.attr('rel', rel);
  link.attr('href', href);
  dom('head').append(link);
}

function applyStructuredData(dom, structuredData) {
  dom('script[data-seo="ld-json"]').remove();
  if (!structuredData) {
    return;
  }
  const script = dom('<script />');
  script.attr('type', 'application/ld+json');
  script.attr('data-seo', 'ld-json');
  const payload = JSON.stringify(structuredData).replace(/</g, '\\u003c');
  script.text(payload);
  dom('head').append(script);
}

function renderSeoDocument({
  title,
  description = DEFAULT_DESCRIPTION,
  path: pathName = '/',
  ogImage = DEFAULT_IMAGE,
  robots = 'index,follow',
  structuredData,
  bodyHtml,
  keywords,
  region,
}) {
  const dom = cloneTemplate();
  const canonicalUrl = toCanonical(pathName);
  if (bodyHtml) {
    dom('#root').html(bodyHtml);
  }
  dom('title').text(title);
  upsertMeta(dom, 'meta[name="description"]', {
    name: 'description',
    content: truncateDescription(description),
  });
  // Keywords for SEO
  const finalKeywords = keywords || DEFAULT_KEYWORDS;
  if (finalKeywords) {
    upsertMeta(dom, 'meta[name="keywords"]', {
      name: 'keywords',
      content: finalKeywords,
    });
  }
  // Open Graph tags
  upsertMeta(dom, 'meta[property="og:title"]', {
    property: 'og:title',
    content: title,
  });
  upsertMeta(dom, 'meta[property="og:description"]', {
    property: 'og:description',
    content: truncateDescription(description, 180),
  });
  upsertMeta(dom, 'meta[property="og:type"]', {
    property: 'og:type',
    content: 'website',
  });
  upsertMeta(dom, 'meta[property="og:url"]', {
    property: 'og:url',
    content: canonicalUrl,
  });
  upsertMeta(dom, 'meta[property="og:image"]', {
    property: 'og:image',
    content: ogImage,
  });
  upsertMeta(dom, 'meta[property="og:site_name"]', {
    property: 'og:site_name',
    content: SITE_NAME,
  });
  upsertMeta(dom, 'meta[property="og:locale"]', {
    property: 'og:locale',
    content: 'en_US',
  });
  // Twitter tags
  upsertMeta(dom, 'meta[name="twitter:card"]', {
    name: 'twitter:card',
    content: 'summary_large_image',
  });
  upsertMeta(dom, 'meta[name="twitter:site"]', {
    name: 'twitter:site',
    content: TWITTER_HANDLE,
  });
  upsertMeta(dom, 'meta[name="twitter:creator"]', {
    name: 'twitter:creator',
    content: TWITTER_CREATOR,
  });
  upsertMeta(dom, 'meta[name="twitter:title"]', {
    name: 'twitter:title',
    content: title,
  });
  upsertMeta(dom, 'meta[name="twitter:description"]', {
    name: 'twitter:description',
    content: truncateDescription(description, 200),
  });
  upsertMeta(dom, 'meta[name="twitter:image"]', {
    name: 'twitter:image',
    content: ogImage,
  });
  upsertMeta(dom, 'meta[name="robots"]', {
    name: 'robots',
    content: robots,
  });
  // Canonical URL
  upsertLink(dom, 'canonical', canonicalUrl);
  // Hreflang for regional variants
  if (region) {
    const regionLower = region.toLowerCase();
    const altRegion = regionLower === 'eu' ? 'us' : 'eu';
    const altPath = pathName.replace(`/${regionLower}/`, `/${altRegion}/`);
    const altUrl = toCanonical(altPath);
    const hreflangLink = dom('<link />');
    hreflangLink.attr('rel', 'alternate');
    hreflangLink.attr('hreflang', regionLower === 'eu' ? 'en-GB' : 'en-US');
    hreflangLink.attr('href', canonicalUrl);
    dom('head').append(hreflangLink);
    const altHreflangLink = dom('<link />');
    altHreflangLink.attr('rel', 'alternate');
    altHreflangLink.attr('hreflang', altRegion === 'eu' ? 'en-GB' : 'en-US');
    altHreflangLink.attr('href', altUrl);
    dom('head').append(altHreflangLink);
    const defaultHreflang = dom('<link />');
    defaultHreflang.attr('rel', 'alternate');
    defaultHreflang.attr('hreflang', 'x-default');
    defaultHreflang.attr('href', `${BASE_URL}/`);
    dom('head').append(defaultHreflang);
  }
  // Apply page-specific structured data
  applyStructuredData(dom, structuredData);
  // Add Organization and WebSite schemas on main pages
  if (pathName === '/' || !structuredData) {
    const orgScript = dom('<script />');
    orgScript.attr('type', 'application/ld+json');
    orgScript.attr('data-seo', 'org-schema');
    orgScript.text(JSON.stringify(ORGANIZATION_SCHEMA).replace(/</g, '\\u003c'));
    dom('head').append(orgScript);
    const siteScript = dom('<script />');
    siteScript.attr('type', 'application/ld+json');
    siteScript.attr('data-seo', 'site-schema');
    siteScript.text(JSON.stringify(WEBSITE_SCHEMA).replace(/</g, '\\u003c'));
    dom('head').append(siteScript);
  }
  return dom.html();
}

function buildArmoryUrl(region = '', realm = '', name = '') {
  if (!region || !realm || !name) {
    return undefined;
  }
  const locale = region.toLowerCase() === 'eu' ? 'en-gb' : 'en-us';
  const realmSlug = realm.toLowerCase();
  const nameSlug = name.toLowerCase();
  return `https://worldofwarcraft.blizzard.com/${locale}/character/${region.toLowerCase()}/${realmSlug}/${nameSlug}`;
}

function renderCharacter(region, realm, name, pathName, options = {}) {
  const regionLc = (region || '').toLowerCase();
  const prettyRegion = REGION_TITLES[regionLc] || (regionLc ? regionLc.toUpperCase() : 'World of Warcraft');
  const prettyRealm = formatSegment(realm);
  const prettyName = formatSegment(name);
  const canonicalUrl = toCanonical(pathName);
  const characterLabel = `${prettyName}${prettyRealm ? `-${prettyRealm}` : ''}`;
  let description = `${characterLabel} ${CURRENT_SEASON} PvP stats on ${prettyRegion}. Ratings, match history, spec activity, ladder snapshots updated hourly.`;
  if (options.extraDescription) {
    description = `${description} ${options.extraDescription}`.trim();
  }
  const keywords = `${prettyName}, ${prettyRealm}, WoW PvP profile, ${CURRENT_SEASON}, ${prettyRegion} ladder, arena stats, character lookup`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: characterLabel,
    description,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    sport: 'World of Warcraft PvP',
    memberOf: `${prettyRegion} Ladder`,
  };
  const armoryUrl = buildArmoryUrl(region, realm, name);
  if (armoryUrl) {
    structuredData.sameAs = [armoryUrl];
  }
  const title = `${characterLabel} | ${prettyRegion} ${CURRENT_SEASON} PvP Profile | PVPQ.NET`;
  return renderSeoDocument({
    title,
    description,
    path: pathName,
    structuredData: mergeStructuredData(structuredData, options.structuredData),
    ogImage: options.ogImage || DEFAULT_IMAGE,
    bodyHtml: options.bodyHtml,
    keywords,
    region: regionLc,
  });
}

function renderActivity(region, activity, bracket, pathName, options = {}) {
  const regionLc = (region || '').toLowerCase();
  const prettyRegion = region ? REGION_TITLES[regionLc] || regionLc.toUpperCase() : 'Global';
  const activityLc = (activity || '').toLowerCase();
  const bracketLc = (bracket || '').toLowerCase();
  const activityLabel = ACTIVITY_LABELS[activityLc] || 'Leaderboard';
  const bracketLabel = bracket ? BRACKET_TITLES[bracketLc] || capitalizeFirstLetter(bracketLc) : 'WoW PvP';
  const bracketPrefix = bracket ? `${bracketLabel} ` : '';
  const title = `${bracketPrefix}${activityLabel} | ${prettyRegion} PvP ${CURRENT_SEASON} | PVPQ.NET`;
  let description = `${CURRENT_SEASON} ${bracketLabel} ${activityLabel.toLowerCase()} for ${prettyRegion}. Real-time ratings, player counts, spec representation from Blizzard API.`;
  let keywords = `WoW PvP, ${bracketLabel}, ${prettyRegion} ladder, ${CURRENT_SEASON}, arena rankings, gladiator, duelist`;
  if (!bracket) {
    description = `Live WoW ${CURRENT_SEASON} PvP ${activityLabel.toLowerCase()} for ${prettyRegion}. Solo Shuffle, Arena, RBG data with participation trends and rating movement.`;
    keywords = `WoW PvP, ${CURRENT_SEASON}, ${prettyRegion} ladder, Solo Shuffle, Arena, RBG, gladiator, duelist, leaderboard`;
    const brackets = ['shuffle', '3v3', '2v2', 'rbg', 'shuffle-multiclass'];
    const links = brackets.map(b => {
      const bLabel = BRACKET_TITLES[b] || b;
      return `<li><a href="/${regionLc}/${activityLc}/${b}">${bLabel}</a></li>`;
    }).join('');
    options.bodyHtml = `
      <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
        <h1>${title}</h1>
        <p>${description}</p>
        <h2>Select a Bracket</h2>
        <ul>${links}</ul>
      </div>
    `;
  }
  if (bracketLc === 'shuffle-multiclass') {
    description = `Top Solo Shuffle multiclassers on ${prettyRegion} for ${CURRENT_SEASON}. Wins across specs, rating swings, and class spread updated hourly.`;
    keywords = `WoW multiclasser, Solo Shuffle, ${CURRENT_SEASON}, ${prettyRegion}, multi-spec, alt ladder`;
  }
  if (bracketLc === 'shuffle') {
    keywords = `Solo Shuffle, WoW PvP, ${CURRENT_SEASON}, ${prettyRegion}, shuffle ladder, shuffle ratings, gladiator`;
  }
  if (options.extraDescription) {
    description = `${description} ${options.extraDescription}`.trim();
  }
  const canonicalUrl = toCanonical(pathName);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    about: `World of Warcraft ${CURRENT_SEASON} PvP Leaderboards`,
    inLanguage: 'en',
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: BASE_URL,
    },
  };
  return renderSeoDocument({
    title,
    description,
    path: pathName,
    structuredData: mergeStructuredData(structuredData, options.structuredData),
    ogImage: options.ogImage || DEFAULT_IMAGE,
    keywords,
    region: regionLc,
    bodyHtml: options.bodyHtml,
  });
}

async function renderCutoffs(region, pathName) {
  const regionKey = (region || '').toLowerCase();
  const prettyRegion = region
    ? REGION_TITLES[regionKey] || regionKey.toUpperCase()
    : 'World of Warcraft';
  const title = `${region ? prettyRegion : 'Global'} PvP Rating Cutoffs | PvPQ.net`;
  const description = truncateDescription(
    `Seasonal rating cutoffs for Solo Shuffle, 2v2, 3v3, and Rated Battlegrounds across ${prettyRegion}. Use PvPQ.net to forecast elite, rival, duelists, and legend thresholds before the ladder resets.`,
    180,
  );
  const canonicalUrl = toCanonical(pathName);

  const options = await buildCutoffsSeoExtras(regionKey, pathName);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: title,
    description,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
  };

  return renderSeoDocument({
    title,
    description,
    path: pathName,
    structuredData,
    bodyHtml: options.bodyHtml,
  });
}

async function renderMeta(region, pathName) {
  const regionKey = (region || '').toLowerCase();
  const prettyRegion = region ? REGION_TITLES[regionKey] || regionKey.toUpperCase() : 'Global';
  const title = `${prettyRegion} PvP Meta & Class Performance | PvPQ.net`;
  const description = truncateDescription(
    `Spec-by-spec PvP performance insights for ${prettyRegion}: win rates, representation, and ladder momentum for Solo Shuffle, Arena, and RBG with hourly refreshes.`,
    175,
  );
  const canonicalUrl = toCanonical(pathName);

  const options = await buildMetaSeoExtras(regionKey, pathName);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: title,
    description,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
  };

  return renderSeoDocument({
    title,
    description,
    path: pathName,
    structuredData,
    bodyHtml: options.bodyHtml,
  });
}

function renderGenericLanding(pathName = '/', customDescription) {
  const title = 'PvPQ.net | World of Warcraft PvP Activity, Ladder for Solo Shuffle, Blitz, 3v3 and 2v2 Arena, Meta, Players profiles, AI coaching';
  const description = customDescription || DEFAULT_DESCRIPTION;
  return renderSeoDocument({
    title,
    description,
    path: pathName,
  });
}

async function buildCutoffsSeoExtras(region, pathName) {
  if (!region) return {};
  const cacheKey = `cutoffs:${region}`;
  const data = await fetchWithCache(cacheKey, () => fetchCutoffs(region), {
    ttlMs: Number(process.env.SEO_CUTOFFS_TTL_MS || 30 * 60 * 1000),
  });
  if (!data) return {};
  return summarizeCutoffs(data, region, pathName);
}

async function buildMetaSeoExtras(region, pathName) {
  if (!region) return {};
  const cacheKey = `meta:${region}`;
  const data = await fetchWithCache(cacheKey, () => fetchMeta(region), {
    ttlMs: Number(process.env.SEO_META_TTL_MS || 60 * 60 * 1000),
  });
  if (!data) return {};
  return summarizeMeta(data, region, pathName);
}

async function buildCharacterSeoExtras(region, realm, name) {
  if (!region || !realm || !name) {
    return {};
  }
  const cacheKey = `player:${region.toLowerCase()}:${realm.toLowerCase()}:${name.toLowerCase()}`;
  const player = await fetchWithCache(cacheKey, () => fetchCharacterProfile(region, realm, name), {
    ttlMs: Number(process.env.SEO_CHARACTER_TTL_MS || 15 * 60 * 1000),
  });
  if (!player) {
    return {};
  }
  const extras = summarizeCharacterProfile(player, region, realm, name) || {};
  const ogImage = normalizeImageUrl(player?.media?.avatar || player?.media?.main_raw);
  if (ogImage) {
    extras.ogImage = ogImage;
  }
  return extras;
}

async function buildActivitySeoExtras(region, activity, bracket, pathName) {
  if (!region || !activity || !bracket) {
    return {};
  }
  const cacheKey = `ladder:${region}:${activity}:${bracket}`;
  const leaderboard = await fetchWithCache(cacheKey, () => fetchLeaderboardSnapshot(region, activity, bracket), {
    ttlMs: Number(process.env.SEO_LADDER_TTL_MS || 5 * 60 * 1000),
  });
  if (!leaderboard || !Array.isArray(leaderboard?.characters) || leaderboard.characters.length === 0) {
    return {};
  }
  return summarizeLeaderboard(leaderboard.characters, region, bracket, pathName);
}

async function fetchCharacterProfile(region, realm, name) {
  try {
    const regionSlug = (region || '').toLowerCase();
    const realmSlug = encodeURIComponent((realm || '').toLowerCase());
    const nameSlug = encodeURIComponent((name || '').toLowerCase());
    const response = await apiClient.get(`/api/${regionSlug}/${realmSlug}/${nameSlug}`);
    if (response.status >= 400) {
      return null;
    }
    return response.data;
  } catch (error) {
    console.warn('[seo-profile]', region, realm, name, error.message);
    return null;
  }
}

async function fetchCutoffs(region) {
  try {
    const localeRegion = REGION_TO_LOCALE[region] || region;
    const response = await apiClient.get(`/api/${localeRegion}/activity/stats`);
    if (response.status >= 400) {
      return null;
    }
    return response.data;
  } catch (error) {
    console.warn('[seo-cutoffs]', region, error.message);
    return null;
  }
}

async function fetchMeta(region) {
  try {
    const response = await apiClient.get('/api/meta', {
      params: {
        region: region.toUpperCase(),
      },
    });
    if (response.status >= 400) {
      return null;
    }
    return response.data;
  } catch (error) {
    console.warn('[seo-meta]', region, error.message);
    return null;
  }
}

async function fetchLeaderboardSnapshot(region, activity, bracket) {
  try {
    const localeRegion = REGION_TO_LOCALE[region] || region;
    if (bracket === 'shuffle-multiclass') {
      const response = await apiClient.get(`/api/${localeRegion}/ladder/multiclassers`, {
        params: {
          page: 1,
          role: 'all',
        },
      });
      if (response.status >= 400) {
        return null;
      }
      // Multiclasser API returns an array directly, wrap it to match expected structure
      return { characters: response.data, isMulticlass: true };
    }

    const activitySlug = encodeURIComponent(activity);
    const bracketSlug = encodeURIComponent(bracket);
    const response = await apiClient.get(`/api/${localeRegion}/${activitySlug}/${bracketSlug}`, {
      params: {
        page: 1,
        specs: '',
      },
    });
    if (response.status >= 400) {
      return null;
    }
    return response.data;
  } catch (error) {
    console.warn('[seo-leaderboard]', region, activity, bracket, error.message);
    return null;
  }
}

function summarizeCutoffs(data, region, pathName) {
  const cutoffs = data?.cutoffs?.rewards || {};
  const season = data?.cutoffs?.season || CURRENT_SEASON;
  const prettyRegion = REGION_TITLES[region.toLowerCase()] || region.toUpperCase();

  const rows = Object.entries(cutoffs)
    .map(([key, rating]) => {
      // key might be "SHUFFLE/CRIMSON_LEGEND" etc.
      const label = key.split('/').pop().replace(/_/g, ' ');
      return `<tr><td>${capitalizeFirstLetter(label)}</td><td>${rating}</td></tr>`;
    })
    .join('');

  const bodyHtml = `
    <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
      <h1>PvP Cutoffs for ${prettyRegion} - ${season}</h1>
      <p>Current rating thresholds for Gladiator, Rank 1, and other titles.</p>
      <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th align="left">Title / Tier</th>
            <th align="left">Rating Cutoff</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="2">No cutoff data available currently.</td></tr>'}
        </tbody>
      </table>
    </div>
  `;

  return { bodyHtml };
}

function summarizeMeta(data, region, pathName) {
  const specs = data?.specs || [];
  const prettyRegion = REGION_TITLES[region.toLowerCase()] || region.toUpperCase();

  // Sort by representation or some metric
  const sortedSpecs = [...specs].sort((a, b) => (b['0.850_presence'] || 0) - (a['0.850_presence'] || 0)).slice(0, 20);

  const rows = sortedSpecs.map((spec, i) => {
    const name = spec.spec_name;
    const winRate = spec['0.850_win_rate'] ? `${(spec['0.850_win_rate'] * 100).toFixed(1)}%` : '-';
    const presence = spec['0.850_presence'] ? `${(spec['0.850_presence'] * 100).toFixed(1)}%` : '-';
    return `
      <tr>
        <td>${i + 1}</td>
        <td>${name}</td>
        <td>${winRate}</td>
        <td>${presence}</td>
      </tr>
    `;
  }).join('');

  const bodyHtml = `
    <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
      <h1>PvP Meta Snapshot - ${prettyRegion}</h1>
      <p>Top performing specs in high rating brackets (Top 15%).</p>
      <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th align="left">Rank</th>
            <th align="left">Spec</th>
            <th align="left">Win Rate</th>
            <th align="left">Representation</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;

  return { bodyHtml };
}

function summarizeCharacterProfile(player, region, realm, name) {
  const brackets = Array.isArray(player?.brackets) ? player.brackets : [];
  const ordered = brackets
    .filter((bracket) => bracket && typeof bracket.rating === 'number')
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3);
  if (!ordered.length) {
    return {};
  }
  const summaryParts = ordered.map((bracket) => {
    const label = BRACKET_TYPE_LABELS[bracket.bracket_type] || formatSegment(bracket.bracket_type || '');
    const rating = formatNumber(bracket.rating) || bracket.rating;
    const rank = bracket.rank ? `#${formatNumber(bracket.rank)}` : null;
    return `${label} ${rating}${rank ? ` (${rank})` : ''}`;
  });

  const level = player.level || player.character_level;
  const ilvl = player.itemLevel || player.average_item_level || player.equipped_item_level;
  const race = player.race?.name || player.race;
  const gender = player.gender?.name || player.gender;
  const faction = player.fraction || player.faction;
  const spec = player.activeSpec?.name || player.activeSpec;
  const className = player.class?.name || player.class;
  const pvpTalents = Array.isArray(player.pvpTalents)
    ? player.pvpTalents.map((t) => t.name).join(', ')
    : undefined;

  const detailsParts = [];
  if (level) detailsParts.push(`Level ${level}`);
  if (gender) detailsParts.push(gender);
  if (race) detailsParts.push(race);
  if (faction) detailsParts.push(faction);
  if (className) detailsParts.push(className);
  if (spec) detailsParts.push(`(${spec})`);

  let detailsString = detailsParts.join(' ');
  if (ilvl) detailsString += `. Item Level ${ilvl}`;
  if (pvpTalents) detailsString += `. PvP Talents: ${pvpTalents}`;
  if (detailsString) detailsString += '.';

  let extraDescription = detailsString ? `${detailsString} ` : '';
  if (summaryParts.length) {
    extraDescription += `Recent ladder snapshot: ${summaryParts.join(' · ')}.`;
  }

  const additionalProperty = ordered.map((bracket) => {
    const label = BRACKET_TYPE_LABELS[bracket.bracket_type] || formatSegment(bracket.bracket_type || '');
    const wins = typeof bracket.won === 'number' ? bracket.won : undefined;
    const losses = typeof bracket.lost === 'number' ? bracket.lost : undefined;
    const wl = typeof wins === 'number' && typeof losses === 'number' ? `${wins}-${losses}` : undefined;
    const descriptionParts = [
      bracket.rank ? `Rank ${formatNumber(bracket.rank)}` : null,
      wl ? `${wl} W-L` : null,
    ].filter(Boolean);
    return {
      '@type': 'PropertyValue',
      name: label,
      value: `${bracket.rating} rating`,
      unitText: 'rating',
      description: descriptionParts.length ? descriptionParts.join(' | ') : undefined,
    };
  });

  const prettyName = formatSegment(name);
  const prettyRealm = formatSegment(realm);
  const prettyRegion = REGION_TITLES[region.toLowerCase()] || region;
  const armoryUrl = buildArmoryUrl(region, realm, name);

  const bodyHtml = `
    <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
      <h1>${prettyName} - ${prettyRealm} (${prettyRegion})</h1>
      <p>${extraDescription}</p>
      ${armoryUrl ? `<p><a href="${armoryUrl}" target="_blank">View on Armory</a></p>` : ''}
      <h2>Bracket Ratings</h2>
      <ul>
        ${ordered.map(b => {
    const label = BRACKET_TYPE_LABELS[b.bracket_type] || b.bracket_type;
    const rating = formatNumber(b.rating);
    const wl = b.won && b.lost ? `${b.won}-${b.lost} (${Math.round(b.won / (b.won + b.lost) * 100)}%)` : '';
    return `<li><strong>${label}</strong>: ${rating} ${wl ? `- ${wl}` : ''}</li>`;
  }).join('')}
      </ul>
    </div>
  `;

  const achievement = summaryParts;
  const structuredData = {
    achievement,
    additionalProperty,
    dateModified: player?.lastUpdatedUTCms ? new Date(player.lastUpdatedUTCms).toISOString() : undefined,
  };
  return {
    extraDescription,
    bodyHtml,
    structuredData,
  };
}

function summarizeLeaderboard(characters, region, bracket, pathName) {
  const isMulticlass = bracket === 'shuffle-multiclass';
  const usable = characters.filter(Boolean).slice(0, 25);
  if (!usable.length) {
    return {};
  }

  if (isMulticlass) {
    const tableRows = usable.map((c, i) => {
      const main = c.main || {};
      const profilePath = formatCharacterPath(region, main.realm, main.name);
      const url = profilePath ? toCanonical(profilePath) : '#';
      const score = formatNumber(c.total_score);
      return `
        <tr>
          <td>${i + 1}</td>
          <td><a href="${url}">${main.name}</a></td>
          <td>${main.class}</td>
          <td>${score}</td>
        </tr>`;
    }).join('');

    const bodyHtml = `
      <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
        <h1>Solo Shuffle Multiclass Leaderboard</h1>
        <p>Top players performing across multiple specializations.</p>
        <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th align="left">Rank</th>
              <th align="left">Player</th>
              <th align="left">Class</th>
              <th align="left">Total Score</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
    return { bodyHtml };
  }

  const leaderParts = usable.slice(0, 3).map((character) => {
    const prettyRealm = formatSegment(character.realm || '');
    const ratingText = formatNumber(character.rating) || character.rating;
    return `${character.name}${prettyRealm ? `-${prettyRealm}` : ''}${ratingText ? ` (${ratingText})` : ''}`;
  });
  const topRating = usable[0]?.rating;
  const extraDescription = leaderParts.length
    ? `Leaders right now: ${leaderParts.join(', ')}${topRating ? ` — top rating ${formatNumber(topRating)}.` : '.'}`
    : '';

  const tableRows = usable.map((c, i) => {
    const profilePath = formatCharacterPath(region, c.realm, c.name);
    const url = profilePath ? toCanonical(profilePath) : '#';
    const rating = formatNumber(c.rating) || c.rating;
    const wl = c.wins && c.losses ? `${c.wins}-${c.losses}` : '';
    return `
      <tr>
        <td>${i + 1}</td>
        <td><a href="${url}">${c.name}</a></td>
        <td>${rating}</td>
        <td>${wl}</td>
      </tr>`;
  }).join('');

  const bodyHtml = `
    <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
      <h1>${BRACKET_TITLES[bracket] || formatSegment(bracket)} Leaderboard</h1>
      <p>${extraDescription}</p>
      <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th align="left">Rank</th>
            <th align="left">Character</th>
            <th align="left">Rating</th>
            <th align="left">W-L</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;

  const itemList = {
    '@type': 'ItemList',
    name: `${BRACKET_TITLES[bracket] || formatSegment(bracket)} leaders`,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: usable.map((character, index) => {
      const profilePath = formatCharacterPath(region, character.realm, character.name);
      const wl =
        typeof character.wins === 'number' && typeof character.losses === 'number'
          ? `${character.wins}-${character.losses} W-L`
          : undefined;
      return {
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Person',
          name: `${character.name}${character.realm ? `-${formatSegment(character.realm)}` : ''}`,
          url: profilePath ? toCanonical(profilePath) : toCanonical(pathName),
          additionalProperty: [
            {
              '@type': 'PropertyValue',
              name: 'Rating',
              value: character.rating,
              unitText: 'rating',
            },
            wl
              ? {
                '@type': 'PropertyValue',
                name: 'Record',
                value: wl,
              }
              : null,
          ].filter(Boolean),
        },
      };
    }),
  };
  return {
    extraDescription,
    bodyHtml,
    structuredData: {
      mainEntity: itemList,
    },
  };
}

async function renderThree(one, two, three, pathName) {
  const regionLc = (one || '').toLowerCase();
  const activity = (two || '').toLowerCase();
  const bracket = (three || '').toLowerCase();
  if (isValidRegion(regionLc) && isValidActivity(activity) && isValidBracket(bracket)) {
    const options = await buildActivitySeoExtras(regionLc, activity, bracket, pathName);
    return renderActivity(regionLc, activity, bracket, pathName, options);
  }
  const characterOptions = isValidRegion(regionLc)
    ? await buildCharacterSeoExtras(regionLc, two, three)
    : {};
  return renderCharacter(one, two, three, pathName, characterOptions);
}

async function renderTwo(one, two, pathName) {
  const first = (one || '').toLowerCase();
  const second = (two || '').toLowerCase();
  if (isValidRegion(first) && isValidActivity(second)) {
    return renderActivity(first, second, undefined, pathName);
  }
  if (isValidRegion(first) && second === 'cutoffs') {
    return renderCutoffs(first, pathName);
  }
  if (isValidRegion(first) && second === 'meta') {
    return renderMeta(first, pathName);
  }
  return null;
}

app.use(express.static(staticDir));

app.get('/ping', function (req, res) {
  return res.send('pong');
});

app.get('/:pone/:ptwo/:pthree', async function (req, res) {
  const pathName = req.path;
  const { pone, ptwo, pthree } = req.params;
  console.log('THREE: ', pone, ptwo, pthree);
  try {
    const html = await renderThree(pone, ptwo, pthree, pathName);
    res.send(html);
  } catch (error) {
    console.error('THREE route error', error);
    res.status(500).send(renderGenericLanding(pathName));
  }
});

app.get('/:pone/:ptwo', async function (req, res) {
  const pathName = req.path;
  const { pone, ptwo } = req.params;
  console.log('TWO: ', pone, ptwo);
  try {
    const rendered = await renderTwo(pone, ptwo, pathName);
    if (rendered) {
      return res.send(rendered);
    }
  } catch (error) {
    console.error('TWO route error', error);
  }
  res.send(renderGenericLanding(pathName));
});

app.get('/cutoffs', async function (req, res) {
  res.send(await renderCutoffs(undefined, req.path));
});

app.get('/meta', async function (req, res) {
  res.send(await renderMeta(undefined, req.path));
});

app.get('/:pone/cutoffs', async function (req, res) {
  const { pone } = req.params;
  if (isValidRegion(pone)) {
    res.send(await renderCutoffs(pone, req.path));
  } else {
    res.send(renderGenericLanding(req.path));
  }
});

app.get('/:pone/meta', async function (req, res) {
  const { pone } = req.params;
  if (isValidRegion(pone)) {
    res.send(await renderMeta(pone, req.path));
  } else {
    res.send(renderGenericLanding(req.path));
  }
});

app.get('/sitemap.xml', function (req, res) {
  const regions = ['us', 'eu'];
  const brackets = ['2v2', '3v3', 'rbg', 'shuffle', 'shuffle-multiclass', 'blitz'];
  const activities = ['ladder', 'activity'];
  const now = new Date().toISOString().split('T')[0];
  const urls = [];
  // Static pages with highest priority
  urls.push({ loc: `${BASE_URL}/`, priority: '1.0', changefreq: 'hourly' });
  urls.push({ loc: `${BASE_URL}/cutoffs`, priority: '0.9', changefreq: 'hourly' });
  urls.push({ loc: `${BASE_URL}/meta`, priority: '0.8', changefreq: 'daily' });
  // Dynamic pages by region
  regions.forEach((region) => {
    urls.push({ loc: `${BASE_URL}/${region}/cutoffs`, priority: '0.9', changefreq: 'hourly' });
    urls.push({ loc: `${BASE_URL}/${region}/meta`, priority: '0.8', changefreq: 'daily' });
    // Landing pages for regions
    activities.forEach((activity) => {
      urls.push({ loc: `${BASE_URL}/${region}/${activity}`, priority: '0.85', changefreq: 'hourly' });
    });
    // Bracket-specific pages
    brackets.forEach((bracket) => {
      activities.forEach((activity) => {
        const priority = bracket === 'shuffle' ? '0.9' : '0.8';
        urls.push({ loc: `${BASE_URL}/${region}/${activity}/${bracket}`, priority, changefreq: 'hourly' });
      });
    });
  });
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.map((entry) => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
  res.header('Content-Type', 'application/xml');
  res.header('Cache-Control', 'public, max-age=3600');
  res.send(sitemap);
});

app.get('/*', function (req, res) {
  console.log('NO MATCH: ', req.path);
  res.send(renderGenericLanding(req.path));
});

if (require.main === module) {
  let port = process.env.PORT || 9001;
  console.log('Starting server on port ' + port);
  app.listen(port);
}

module.exports = app;