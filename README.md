# Learn-Kana

A website where you will be shoved Kana characters up to your brain, until you get them all.

Practice hiragana, katakana, N5 / N4 kanji, words and real sentences right in the browser, on desktop or phone. Pick the groups you want, then type the romaji (or tap the right answer) as fast as you can. A built-in dictionary lets you look up everything the app teaches, and a *Materials* page explains the particles and the grammar forms.

> This is a fork of [Eldoprano/learn-kana](https://github.com/Eldoprano/learn-kana), created by **Eldoprano**.
> The original version is live on [GitHub Pages](https://eldoprano.github.io/learn-kana/) and [Cloudflare Pages](https://learn-kana.pages.dev/).

<p align="center">
  <img src="docs/screenshots/home-desktop.png" alt="Learn Kana home page on desktop: hiragana and katakana group selection, with the mode panel on the side" width="68%">
  &nbsp;
  <img src="docs/screenshots/home-mobile.png" alt="Learn Kana home page on mobile, with hiragana / katakana / kanji tabs and a sticky start button" width="24%">
</p>

## Features

**Choosing what to practice**
- Pick any hiragana / katakana group, main kana and dakuten (`が`, `ぱ`, ...).
- Pick kanji groups too: 300 JLPT kanji (100 N5, 200 N4) in themed groups (*N5 Basics*, *N5 Nature*, *N5 Body*...), each with its meaning, on / kun readings and an example word.
- Hover a group to see all of its characters (`あ` → あ い う え お).
- See how many characters, words or sentences your selection gives you before starting.

**Game modes**
- Practice **characters** or **words** (1,400+ words, only the ones you can read with the groups you picked, including 570+ kanji words such as 電気, 花見 or 留学生 that unlock with your kanji groups; the reading of each kanji is shown after you answer). Pick a **topic** to narrow the words down: **General** for the everyday ones, **IT & work** for only the 180+ words you need at an IT company (プログラム, サーバー, データベース, デバッグ, めんせつ (job interview), しめきり (deadline)...), or **All words** for both.
- **Sentences**: 1,400+ real sentences covering the common JLPT N5 and N4 grammar (e.g. 「わたしは学生です」, 「すしを食べたことがあります」), 170+ of them about working at an IT company (「コードをレビューしてください」, 「わたしは日本のかいしゃではたらきたいです」) for the IT & work topic that you type as a single romaji answer — only sentences you can read with the groups you picked appear, particles like は and を are shown in black, and the words you have typed fade out as you go. Any common spelling works (Kunrei-shiki like *si*/*tu*, *kyoo* or *kyō*, は typed as *ha*, or kana from a Japanese keyboard), and a mistake is underlined from where it starts. Help comes in steps: furigana first, then the romaji of the word you are on. Once you get a sentence right you see its meaning plus every word with its romaji, its meaning and what each particle does. Four exercises: **Read** (type the sentence), **Listen** (type what you hear), **Particles** (type the missing particle) and **Arrange** (type the shuffled words in the right order), and you can narrow the sentences by length (short / medium / long), grammar pattern (〜です, 〜ます, あります・います, 〜か) and JLPT level (N5 / N4).
- **Grammar**: the verb form a sentence ends with (〜ます, 〜ません, 〜ました, 〜たいです, 〜てください...) is hidden and you complete it, by typing it or by choosing among four. It draws on the same sentences as the *Sentences* practice, so it can be narrowed to the IT & work topic and to N5 / N4 grammar.
- **Kanji review**: flash cards of the kanji you picked on a spaced repetition schedule. Turn the card over, then grade it *Forgot* / *Hard* / *Good* / *Easy* (or swipe left / right); each grade shows when the kanji comes back. Up to 10 new kanji a day, with a button to learn 10 more once those are done, and a summary of what you learned and when the next review is.
- Characters come in **random** order (the ones you know least show up more often) or **in order**, following the kana table (あ い う え お, か き く け こ...).
- Answer by **typing** the romaji or by **multiple choice**. Multiple choice offers kana that look alike (シ / ツ, ぬ / め, ...) and the ones you mix up the most as wrong answers.
- Play a fixed amount (*Give me 10 Kanas*), against the clock (*Give me 5 minutes*) or without a limit.
- Options: hints on/off, handwritten fonts, auto next, sound (reads each kana or word aloud in Japanese when you get it right).

**While playing**
- Instant feedback: the answer turns green when right and red as soon as it can't be right anymore (red only with hints on).
- Streak counter 🔥, and the background gets lighter the longer your streak.
- Progress bar for fixed-amount games.
- Hints (`?` key or the 💡 button) to reveal the answer.

**After a game**
- Accuracy, average time per answer, best streak and hints used.
- The kana you got wrong (with the right answer) and your slowest ones. Tap one to hear it.
- Comparison with your average of the last 30 days, and your all-time best streak.
- *Try Problematics*: a new game with only the characters you struggle with.
- **Practice mix-ups**: kana you answered with another kana's reading (シ ⇄ ツ, ぬ ⇄ め...) get their own practice game, from all kana whatever groups you picked. It's offered at the end of a game in which you mixed kana up, in the *Often mixed up* list of Learning Progress (tap a pair to practice just those two) and in its notification.
- Progress stats per character, colored by how well you know them.

**Dictionary**
- A *Dictionary* tab next to *Games* to look up every kana, kanji and word in the app, by Japanese, romaji or meaning (`水`, `mizu`, `water`). Romaji spelling variants work, and a typo gets a *Did you mean* suggestion.
- Filter by type (kana / kanji / words), JLPT level and topic, or show only the entries you still need to practice (below 80% mastery).
- Home shortcuts (kana table, kanji N5 / N4, all words), today's kanji and word, and your recent searches.
- Each entry shows your mastery and kanji review progress, and opens a detail sheet: readings with furigana, example sentences, the words that use a kanji and the kanji inside a word, all linked to each other. Tap to hear it.
- *Practice* one entry or all the current results in a game, whatever groups are selected in the menu.

**Materials**
- A *Materials* tab next to *Games* and *Dictionary* with the lessons: the particles (は, を, が, に, で, か, へ, の, と, も, より, ね) and the polite grammar forms (〜です, 〜ます, 〜ました, 〜ません, 〜ませんでした, 〜ましょう, 〜たいです, 〜て/でください, 〜て/でいます), each with what it does and two real example sentences from the practice, with their romaji and meaning.

**Chat**
- A *Chat* tab next to *Materials* in the navbar to practise a conversation:
  - Chats directly with an AI Japanese conversation tutor (powered by Google AI Studio / Gemini).
  - Keeps to polite beginner Japanese (JLPT N5/N4), answers in Japanese, romaji, and your language (English or Indonesian), and reads lines aloud.
  - Romaji and translation are hidden by default to encourage reading Japanese; tap **Bantuan** (Help) on any message to reveal them.
  - Fast response using streaming and optimized flash-lite models (`gemini-3.1-flash-lite` with fallback). Needs `VITE_GEMINI_API_KEY` in `.env`.

**Mobile**
- Works with on-screen keyboards (Android and iOS) and keeps the answer above the keyboard.
- Touch friendly layout, safe-area support for notched phones, installable as an app (PWA).

**Notifications**
- A bell in the navbar collects reminders made from your own progress: kanji due for review, a day streak about to end, your weakest kana, kana you keep mixing up, a backup you haven't saved in a while, and what's new in the app.
- Most reminders have a button to act on them right away (start the review, practice, save the backup). The weakest and mixed-up kana open Learning Progress at that section and highlight it, so you see where to find it next time. Dismissed reminders come back the next day, week or month when they still apply.

**Languages**
- Interface and word meanings in English and Indonesian (Bahasa Indonesia), switchable from the navbar. The first visit follows the browser language.

Progress and settings are saved locally in your browser, nothing needs an account. Save a backup file from Learning Progress to move them to another browser or device.

## Keyboard shortcuts

| Key | In game | On the summary |
|---|---|---|
| `?` | Show the answer (when hints are on) | |
| `Shift` | Show the kana in the normal font (handwritten fonts mode) | |
| `Enter` | Next word (when auto next is off) | Play again |
| `Esc` | End the game | Back to the main menu |

In a kanji review: `Space` / `Enter` turns the card over, `1`–`4` grade it (forgot / hard / good / easy), `←` means forgot, `→` means remembered and `Esc` ends the review.

## Running locally

Requires Node.js 18 or newer.

```bash
npm install
npm start          # development server (Vite) on http://localhost:3000
npm run build      # production build in ./build
npm run preview    # serve that build on http://localhost:3000
npm run lint       # ESLint, fails on any warning
npm run fonts      # regenerate the subset fonts after adding kana, words or kanji
node scripts/generateSentences.mjs   # regenerate the sentence data after changing templates
```

Run the tests once (they also run on GitHub Actions for every push to `main` and every pull request):

```bash
npm test           # Vitest, every test once (npm run test:watch to re-run on changes)
```

### AI tutor in the Chat tab (optional)

The free-chat mode of the *Chat* tab talks to [Google AI Studio](https://aistudio.google.com/apikey) (Gemini). Set your key in `.env`:

```bash
VITE_GEMINI_API_KEY=your-gemini-key
```

It is read at build time, so restart `npm start` (or rebuild) after changing it. The Chat tab needs it: left empty, the chat shows a notice and the input stays off.

The app has no backend, so the key is shipped inside the built JavaScript and is visible to anyone who opens the site. Use a key you are happy to expose: Google AI Studio lets you set a spending limit and revoke the key at any time.

## Running with Docker

```bash
cp .env.example .env      # then set APP_PORT to the port you want
docker compose up -d --build
```

The app is served at `http://localhost:<APP_PORT>` (default `8080`). To change the port, edit `APP_PORT` in `.env` and run `docker compose up -d` again. You can also set it for a single run: `APP_PORT=3000 docker compose up -d`.

## Ideas to implement
- A beginner mode that slowly includes more characters into the mix. ❔
- A help window showing Kanas with their romanjis, together with similar Kanas. ❔
- Online sync of progress and settings. ❔

## Deploying to GitHub Pages (or any static host)

This fork deploys itself: every push to `main` runs [.github/workflows/deploy.yml](.github/workflows/deploy.yml), which runs the tests, builds with `SITE_URL=https://learn-kana.gulagulali.tech` and publishes to GitHub Pages (the repository needs *Settings → Pages → Source: GitHub Actions*). You can also start it by hand from the Actions tab. To turn on analytics there, set `REACT_APP_UMAMI_SCRIPT_URL` and `REACT_APP_UMAMI_WEBSITE_ID` as repository variables (*Settings → Secrets and variables → Actions → Variables*).

The same build works at the root of a domain (Docker, `http://localhost:8080/game`) and in a sub folder (GitHub Pages, `https://<user>.github.io/learn-kana/game`): asset paths are relative and the app finds its folder at run time. Publish the contents of `./build` after `npm run build`. GitHub Pages has no fallback to `index.html` for app routes, so `404.html` (copied from `public/`) sends a reload of `/learn-kana/game` back into the app.

Set `SITE_URL` to the public address when building (e.g. `SITE_URL=https://<user>.github.io/learn-kana npm run build`, or in `.env` / as a Docker build arg) to add the canonical link, absolute link-preview image and `sitemap.xml` for search engines. Without it the build works the same, just without those.

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
