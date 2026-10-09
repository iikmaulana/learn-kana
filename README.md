# Learn-Kana

A website where you will be shoved Kana characters up to your brain, until you get them all.

Practice hiragana and katakana right in the browser, on desktop or phone. Pick the groups you want, then type the romaji (or tap the right answer) as fast as you can.

> This is a fork of [Eldoprano/learn-kana](https://github.com/Eldoprano/learn-kana), created by **Eldoprano**.
> The original version is live on [GitHub Pages](https://eldoprano.github.io/learn-kana/) and [Cloudflare Pages](https://learn-kana.pages.dev/).

<p align="center">
  <img src="docs/screenshots/home-desktop.png" alt="Learn Kana home page on desktop: hiragana and katakana group selection with game mode options" width="68%">
  &nbsp;
  <img src="docs/screenshots/home-mobile.png" alt="Learn Kana home page on mobile, with hiragana / katakana tabs and a sticky start button" width="24%">
</p>

## Features

**Choosing what to practice**
- Pick any hiragana / katakana group, main kana and dakuten (`が`, `ぱ`, ...).
- Hover a group to see all of its characters (`あ` → あ い う え お).
- See how many characters, words or sentences your selection gives you before starting.

**Game modes**
- Practice **characters** or **words** (~600 beginner words, only the ones you can read with the groups you picked).
- **Sentences**: 500+ real beginner sentences (e.g. 「わたしは学生です」) that you type as a single romaji answer — only sentences you can read with the groups you picked appear, particles like は and を are shown in black, and the meaning is shown once you get one right.
- Answer by **typing** the romaji or by **multiple choice**.
- Play a fixed amount (*Give me 10 Kanas*), against the clock (*Give me 5 minutes*) or without a limit.
- Options: hints on/off, handwritten fonts, auto next.

**While playing**
- Instant feedback: the answer turns green when right and red as soon as it can't be right anymore (red only with hints on).
- Streak counter 🔥, and the background gets lighter the longer your streak.
- Progress bar for fixed-amount games.
- Hints (`?` key or the 💡 button) to reveal the answer.

**After a game**
- Accuracy, average time per answer, best streak and hints used.
- The kana you got wrong (with the right answer) and your slowest ones.
- Comparison with your average of the last 30 days, and your all-time best streak.
- *Try Problematics*: a new game with only the characters you struggle with.
- Progress stats per character, colored by how well you know them.

**Mobile**
- Works with on-screen keyboards (Android and iOS) and keeps the answer above the keyboard.
- Touch friendly layout, safe-area support for notched phones, installable as an app (PWA).

**Languages**
- Interface and word meanings in English and Indonesian (Bahasa Indonesia), switchable from the navbar. The first visit follows the browser language.

Progress and settings are saved locally in your browser, nothing needs an account.

## Keyboard shortcuts

| Key | In game | On the summary |
|---|---|---|
| `?` | Show the answer (when hints are on) | |
| `Shift` | Show the kana in the normal font (handwritten fonts mode) | |
| `Enter` | Next word (when auto next is off) | Play again |
| `Esc` | End the game | Back to the main menu |

## Running locally

Requires Node.js 18 or newer.

```bash
npm install
npm start          # development server on http://localhost:3000
npm run build      # production build in ./build
```

## Running with Docker

```bash
cp .env.example .env      # then set APP_PORT to the port you want
docker compose up -d --build
```

The app is served at `http://localhost:<APP_PORT>` (default `8080`). To change the port, edit `APP_PORT` in `.env` and run `docker compose up -d` again. You can also set it for a single run: `APP_PORT=3000 docker compose up -d`.

## Ideas to implement
- A beginner mode that slowly includes more characters into the mix. ❔
- A help window showing Kanas with their romanjis, together with similar Kanas. ❔
- Smaller font files (the Japanese fonts are ~47 MB in total). ❔
- Online sync of progress and settings. ❔

## Privacy & Analytics

This website can use [Umami](https://umami.is/), a privacy-focused, open-source analytics solution. It collects anonymous data to understand how the site is used and improve it. No personal data is collected, and cookies are not used for tracking.

Analytics is off unless you configure it in `.env`:

```bash
REACT_APP_UMAMI_SCRIPT_URL=https://your-umami-instance/script.js
REACT_APP_UMAMI_WEBSITE_ID=your-website-id
```

These values are read at build time, so restart `npm start` or rebuild the Docker image (`docker compose up -d --build`) after changing them.

## Credits

- Original project and idea by [Eldoprano](https://github.com/Eldoprano/learn-kana).
- Fonts: Belanosima, Klee One, Kaisei Tokumin, Noto Serif JP, Shippori Mincho, Tsukimi Rounded, Yuji Boku (SIL Open Font License), YokoMoji, JiyunoTsubasa and FreeFont LeftHanded. See the license files in [src/fonts](src/fonts).

## License

Apache License 2.0, see [LICENSE](LICENSE).
