/* Paths of the app, in one place.
 *
 * The same build is served from the root of a domain (Docker / nginx, e.g.
 * http://localhost:8080/game) and from a sub folder (GitHub Pages, e.g.
 * https://user.github.io/learn-kana/game). "homepage": "." makes the assets
 * relative (./static/...), which works on both as long as every route is one
 * level deep; the router's basename is found at run time (getBasename).
 */
export const ROUTES = {
  // The Games tab: the practice menu
  menu: '/',
  game: '/game',
  // The Dictionary tab: every kana, kanji and word the app teaches
  dictionary: '/dictionary',
  // The Materials tab: the particle and grammar (bunpou) lessons
  materi: '/materi',
  // The Chat tab: the conversation practice with the taught sentences or the
  // AI tutor
  chat: '/chat',
};

// Old addresses, still opened from bookmarks and installed apps: the game
// used to live at /learn-kana∕game (with a "∕" division slash, U+2215, to
// stay one level deep) and the menu also at /learn-kana
export const LEGACY_ROUTES = {
  game: '/learn-kana∕game',
  menu: '/learn-kana',
};

// Session-only game modes travel in the URL, not in localStorage, so a mode
// can't stick around for the next game: ?mode=review starts a kanji review,
// ?mode=mixups a game with the kana the user mixes up (see confusions.js)
export const GAME_MODES = {
  review: 'review',
  mixups: 'mixups',
};

export function gamePath(mode) {
  return mode ? `${ROUTES.game}?mode=${mode}` : ROUTES.game;
}

// The folder the app is served from, without a trailing slash: '' at the
// root of a domain, '/learn-kana' on GitHub Pages. Read from where the main
// script was loaded from (./static/js/... is resolved by the browser).
export function getBasename(doc = typeof document === 'undefined' ? null : document) {
  const script = doc && [...doc.querySelectorAll('script[src]')]
    .find(element => /\/static\/js\//.test(element.src));
  if (!script) return '';
  try {
    const { pathname } = new URL(script.src, doc.baseURI);
    return pathname.slice(0, pathname.indexOf('/static/js/')).replace(/\/+$/, '');
  } catch (error) {
    return '';
  }
}

// Whether a browser path (with the basename) is the game screen
export function isGamePath(pathname, basename = getBasename()) {
  const path = pathname.startsWith(basename) ? pathname.slice(basename.length) : pathname;
  return path.replace(/\/+$/, '') === ROUTES.game || decodeURIComponent(path) === LEGACY_ROUTES.game;
}

// GitHub Pages has no fallback to index.html: public/404.html sends unknown
// paths back to the app as ?/path (see that file); this puts the path back
// in the address bar before the router starts
export function restoreRedirectedPath(location = window.location, history = window.history) {
  const match = /^\?\/([^&]*)(?:&(.*))?$/.exec(location.search);
  if (!match) return;
  const path = match[1].replace(/~and~/g, '&');
  const query = match[2] ? `?${match[2].replace(/~and~/g, '&')}` : '';
  const base = location.pathname.replace(/\/?$/, '/');
  history.replaceState(null, '', `${base}${path}${query}${location.hash}`);
}
