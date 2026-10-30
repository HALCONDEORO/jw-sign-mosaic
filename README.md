# JW Sign Language Mosaic

Watch the same JW Broadcasting program — or any sign-language video publication from jw.org — in several sign languages at once, side by side, straight from the official jw.org CDN.

**Live demo: https://halcondeoro.github.io/jw-sign-mosaic/**

## Features

- **All sign languages**: the sign languages returned by the official catalogue API (/languages/E/all), searchable by name or code ("Añadir lengua" panel). The 8 most common ones load by default.
- **Publication picker**: each tile can play any video publication available in that language — Every video-library section offered on jw.org for that language: JW Broadcasting monthly programs plus the library collections (spiritual programs, music, series, children's videos, meetings and ministry, ministry tools, Bible, movies, interviews...), grouped as they appear on jw.org.
- **Global apply**: pick a collection and program once and apply it to every tile at once (matched across languages by the program's language-agnostic key).
- **Load first, then play**: nothing starts by itself. Every tile (including languages you add later) loads paused and shows its first frame; playback starts only when you press Play all (or Sync), together.
- **Titles in the interface language**: publication lists show English titles with the EN interface and Spanish with ES (from the jw.org English/Spanish listings; items that exist only in sign languages keep the sign-language title).
- **Not available = black cell**: if a language does not have the chosen publication, its cell is black and says so; it never shows a different video.
- **Compare a Bible passage**: in "For all" choose "Bible: book, chapter and verse", then a book, a chapter and (optionally) a verse. Every tile loads that chapter in its own language and opens at that verse; Play all then starts each tile at its verse. Languages without that chapter show the black "Not available" cell. Book names follow the interface language. Verse starts come from the verse markers of the jw.org sign-language Bible (not every chapter has them: those open at the chapter start with a short note).
- **Synchronized start**: Play all and Sync pause every tile, wait until each can show a frame, seek all to the furthest common timestamp and press play together. Tiles still loading are skipped and reported.
- **One volume control**: a single slider; only one tile has sound at a time (also when you unmute from a tile's own player controls).
- **Shareable link**: "Copy link" gives a URL that opens the mosaic with the same languages, collection and publication.
- **Jump all to the same position**: a slider (same relative position in every video) plus -10 s / +10 s buttons. The jw.org API exposes no chapter or song markers, so jumping is position based.
- **Retry failed**: a button appears when some tiles fail and reloads only those.
- Per-tile audio toggle, fullscreen, and removal.
- Your selection (languages + collection + program per tile) persists in `localStorage`.
- **Add more languages** individually, or add the available catalogue after confirmation. Bulk additions run one at a time and can be stopped. There is no fixed 16-tile limit. Many simultaneous videos can overload the device or connection; add only what your device handles. The player prefers the 240p MP4 rendition.
- **Keep the chosen program** when adding translations. If a translation is unavailable, the tile says so instead of substituting another program.
- Saved selections are validated and deduplicated on restore. Narrow screens use a single-column layout.

## Tech

Single `index.html`, no build step, no dependencies. Data comes from the public jw.org mediator API (`data.jw-api.org/mediator/v1`); videos stream from the official CDN. No media is downloaded to this repository, rehosted, proxied, cached by this application, or tracked. The browser streams media directly from JW servers. This is a custom HTML video player, not the official JW player or an iframe. Normal browser buffering still occurs.

Use only for personal, noncommercial viewing. [JW terms](https://www.jw.org/en/terms-of-use/) apply. Direct streaming is not presented here as an official embedding authorization. The publishers permit sharing official links and restrict publication of their material on other websites/apps and marketing uses. No media license is granted by this repository.

## Tests

Run `node --test test/*.test.cjs` (Node 20 or later). The offline tests cover default languages, additions, restoration, input validation, and strict program matching. They do not prove all catalogue translations exist or that a device can play the entire catalogue at once.

Personal, unaffiliated project. Not endorsed by JW.org or its publishers.

## License

MIT — see [LICENSE](LICENSE).
