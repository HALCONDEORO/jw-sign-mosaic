# Architecture

## One file, no build

The whole application is a single `index.html` (about 1,400 lines): markup, CSS and JavaScript in one file. There is no bundler, no framework and no runtime dependency. The repository is served as-is by GitHub Pages, so what you see in `index.html` is exactly what the browser runs.

## Where the data comes from

The page is a thin client over two public jw.org APIs plus the official CDN. The visitor's browser talks to these endpoints directly; the project never proxies or rehosts anything and persists nothing server-side. Some lookup maps live only in memory during the visit, while the language catalogue and publication listings also persist in the browser's `localStorage`. These saved records contain metadata, including titles and media links, not video or audio files. Normal browser buffering is separate from the application's metadata cache.

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
- **Optional storage**: selection, featured tile, interface language, quality and volume persist in `localStorage`, alongside the metadata cache described below. Reads and writes are wrapped so blocked access or a full store does not break the page; saving may fail.
- **Share links**: the current selection is encoded in the URL hash (`#l=CODES&c=SECTION&p=PUBLICATION`): the language list plus one shared collection and publication (not a per-tile mix). Every value is validated on restore, and the hash is consumed once so later edits save normally.
- **Internationalization**: a small string table drives the English and Spanish interfaces; publication titles come from the English or Spanish jw.org listings, falling back to the sign-language title.

## Browser storage lifecycle

| Storage key | Contents | Lifetime in the application |
|---|---|---|
| `jwSignMosaic.v2` | Tile language codes, collection/program selections, requested unavailable programs, shared selection and featured tile | No automatic expiry |
| `jwSignMosaic.lang` | Interface language | No automatic expiry |
| `jwSignMosaic.quality` | Preferred video quality | No automatic expiry |
| `jwSignMosaic.vol` | Master volume | No automatic expiry |
| `jwSignMosaic.meta.v1` | Timestamped language catalogue and reduced publication listings, including titles, identifiers and MP4 links | Catalogue has no read-age limit; publication listings are accepted for seven days |
| `jwSignMosaic.langs.v1` | Legacy language selection, read only as a fallback when no usable v2 selection exists | No automatic removal during migration |

`metaRead` checks a record's age only when a caller supplies an age limit. `cachedListing` uses seven days; `loadCatalog` supplies no age limit. A rejected old record is not deleted on read. On writes, `metaWrite` drops the oldest entries until the serialized JSON fits `META_LIMIT` (350 × 1024 JavaScript string code units, not a guarantee about storage bytes). The browser can also evict site storage.

Saved catalogue data can fill the language list immediately, then `loadCatalog` requests a live refresh on each visit. Publication selectors can start from a recent saved listing, refresh from the API and fall back to that listing after a request failure. Partial or empty live publication results are not written to this cache. Cached entries are validated before use, and fallback lists are labelled with their saved date. This is metadata fallback, not offline video playback.

Bible chapter media lookups and translated-title maps remain in memory for the visit. Clearing this site's browser storage removes the saved preferences, selection and metadata together; a later visit can create them again. `localStorage` is shared by pages on the same origin in the same browser profile, not a confidential store. See [Browser storage and privacy](legal.md#browser-storage-and-privacy) for the visitor-facing explanation.

## Tests and CI

Tests live in `test/*.test.cjs` and run with the Node.js test runner (`node --test`), no browser required: the parts under test (catalogue parsing, selection restore and validation, storage failure modes, strict matching, page metadata) are exercised offline with fixed inputs. CI (`.github/workflows/test.yml`) runs them on Node 22 for every change.

The tests do not contact jw.org: they cannot prove that a given publication exists in a given language, or that a particular device can play many streams at once. Those are runtime properties of the live catalogue and the visitor's hardware.
