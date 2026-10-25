/*
 * Adds the SEO parts that need the public address of the site to the build:
 * the canonical link, og:url and absolute og:image / twitter:image (link
 * previews need absolute URLs), the url of the JSON-LD data, sitemap.xml,
 * and the Sitemap line of robots.txt.
 *
 * The same build can be served from any address (see src/routes.js), so the
 * address comes from the SITE_URL environment variable at build time, e.g.
 *   SITE_URL=https://user.github.io/learn-kana npm run build
 * Without SITE_URL nothing is added: the build still works, without them.
 *
 * Runs after `vite build` (see "build" in package.json).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = path.join(root, 'build');

const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// https://user.github.io/learn-kana -> https://user.github.io/learn-kana/
export function normalizeSiteUrl(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  const url = new URL(text);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`SITE_URL must be an http(s) address, got "${text}"`);
  }
  url.hash = '';
  url.search = '';
  url.pathname = url.pathname.replace(/\/*$/, '/');
  return url.href;
}

export function addSiteUrl(html, siteUrl) {
  const image = new URL('icon512.png', siteUrl).href;
  const tags = [
    `<link rel="canonical" href="${escapeHtml(siteUrl)}" />`,
    `<meta property="og:url" content="${escapeHtml(siteUrl)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    '<meta property="og:image:width" content="510" />',
    '<meta property="og:image:height" content="510" />',
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
  ].join('');
  return html
    .replace('</head>', `${tags}</head>`)
    .replace('"@type":"WebApplication",', `"@type":"WebApplication","url":${JSON.stringify(siteUrl)},"image":${JSON.stringify(image)},`)
    .replace('"@type": "WebApplication",', `"@type": "WebApplication", "url": ${JSON.stringify(siteUrl)}, "image": ${JSON.stringify(image)},`);
}

// The indexed pages: the Games tab (menu), the Dictionary, Materials and Chat tabs (src/routes.js)
const SITEMAP_PATHS = ['', 'dictionary', 'materi', 'chat'];

export function sitemap(siteUrl, date = new Date()) {
  const lastmod = date.toISOString().slice(0, 10);
  const urls = SITEMAP_PATHS.map(page => `  <url>
    <loc>${escapeHtml(new URL(page, siteUrl).href)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>
`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}</urlset>
`;
}

// SITE_URL from the environment (Docker build arg, CI), else from the .env
// files a production build reads (this script runs outside of Vite)
function readSiteUrl() {
  if (process.env.SITE_URL !== undefined) return process.env.SITE_URL;
  for (const file of ['.env.production.local', '.env.local', '.env.production', '.env']) {
    const envPath = path.join(root, file);
    if (!fs.existsSync(envPath)) continue;
    // Only spaces around the value: \s would also eat the line breaks and
    // grab the next line (a comment) when SITE_URL is empty
    const match = /^[ \t]*SITE_URL[ \t]*=[ \t]*(.*?)[ \t]*$/m.exec(fs.readFileSync(envPath, 'utf8'));
    // Drop the quotes around a quoted value: SITE_URL="https://..."
    if (match) return match[1].replace(/^(['"])(.*)\1$/, '$2');
  }
  return '';
}

function main() {
  const siteUrl = normalizeSiteUrl(readSiteUrl());
  if (!siteUrl) {
    console.log('seo-postbuild: SITE_URL is not set, skipping the canonical address, og:url / og:image and sitemap.xml');
    return;
  }
  const indexPath = path.join(buildDir, 'index.html');
  fs.writeFileSync(indexPath, addSiteUrl(fs.readFileSync(indexPath, 'utf8'), siteUrl));
  fs.writeFileSync(path.join(buildDir, 'sitemap.xml'), sitemap(siteUrl));
  const robotsPath = path.join(buildDir, 'robots.txt');
  const robots = fs.existsSync(robotsPath) ? fs.readFileSync(robotsPath, 'utf8') : 'User-agent: *\nDisallow:\n';
  fs.writeFileSync(robotsPath, `${robots.trimEnd()}\n\nSitemap: ${new URL('sitemap.xml', siteUrl).href}\n`);
  console.log(`seo-postbuild: added ${siteUrl} (canonical, og:url, og:image, sitemap.xml)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
