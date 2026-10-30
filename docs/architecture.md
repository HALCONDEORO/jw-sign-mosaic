# Architecture

## One file, no build

The whole application is a single `index.html` (about 1,400 lines): markup, CSS and JavaScript in one file. There is no bundler, no framework and no runtime dependency. The repository is served as-is by GitHub Pages, so what you see in `index.html` is exactly what the browser runs.

## Where the data comes from

The page is a thin client over two public jw.org APIs plus the official CDN. The visitor's browser talks to these endpoints directly; the project never proxies or rehosts anything and persists nothing server-side. During a visit the page keeps only in-memory caches of metadata lookups (publication files, Bible chapters, listing titles) plus the browser's normal buffering; the in-memory maps live only for the visit.

| Purpose | Endpoint |
|---|---|
| Catalogue: languages, video-library sections, publication listings | `https://data.jw-api.org/mediator/v1/...` |
| Media links (including the sign-language Bible, one video per chapter, with verse markers) | `https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS?...` |
| The videos themselves (240p MP4 preferred) | the official jw.org CDN hosts returned by the media API |

The language catalogue and the publication listings of the built-in sections are fetched live, so new sign languages and new publications in those sections appear as jw.org publishes them. The section list itself and the curated books/brochures list are fixed in the code and change only with a page update.

## Main design decisions

- **Tiles**: one per sign language, created and destroyed as plain DOM nodes. Reordering (loaded / failed / unavailable) moves existing nodes instead of rebuilding them, so a playing video is never interrupted.
- **Strict matching**: programs are matched across languages by a language-agnostic key. A language without the program gets a black "not available" cell; the page never substitutes another video.
- **Synchronized playback**: Play all / Sync pause every tile, wait for a decodable frame per tile, seek them to a common timestamp, then start them together (a tile with a Bible verse selected starts at its own verse marker instead). A shared position slider and −10 s / +10 s buttons move every tile together (the APIs expose no chapter markers for non-Bible videos, so jumps are by relative position).
- **One audio stream at a time**: a single volume slider; unmuting any tile mutes the rest.
- **Optional storage**: the selection and volume persist in `localStorage`, wrapped so a blocked or full store degrades to a stateless visit instead of breaking the page.
- **Share links**: the current selection is encoded in the URL hash (`#l=CODES&c=SECTION&p=PUBLICATION`): the language list plus one shared collection and publication (not a per-tile mix). Every value is validated on restore, and the hash is consumed once so later edits save normally.
- **Internationalization**: a small string table drives the English and Spanish interfaces; publication titles come from the English or Spanish jw.org listings, falling back to the sign-language title.

## Tests and CI

Tests live in `test/*.test.cjs` and run with the Node.js test runner (`node --test`), no browser required: the parts under test (catalogue parsing, selection restore and validation, storage failure modes, strict matching, page metadata) are exercised offline with fixed inputs. CI (`.github/workflows/test.yml`) runs them on Node 22 for every change.

The tests do not contact jw.org: they cannot prove that a given publication exists in a given language, or that a particular device can play many streams at once. Those are runtime properties of the live catalogue and the visitor's hardware.
