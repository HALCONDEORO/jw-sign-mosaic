# JW Sign Language Mosaic

Watch the same JW Broadcasting program — or any sign-language video publication from jw.org — in several sign languages at once, side by side, straight from the official jw.org CDN.

**Live demo: https://halcondeoro.github.io/jw-sign-mosaic/**

## Features

- **All sign languages**: the sign languages returned by the official catalogue API (/languages/E/all), searchable by name or code ("Añadir lengua" panel). The 8 most common ones load by default.
- **Publication picker**: each tile can play any video publication available in that language — Every video-library section offered on jw.org for that language: JW Broadcasting monthly programs plus the library collections (spiritual programs, music, series, children's videos, meetings and ministry, ministry tools, Bible, movies, interviews...), grouped as they appear on jw.org.
- **Global apply**: pick a collection and program once and apply it to every tile at once (matched across languages by the program's language-agnostic key).
- Play all / pause all / one-click resync (jumps every tile to the furthest timestamp).
- Per-tile audio toggle (only one tile unmuted at a time), fullscreen, and removal.
- Your selection (languages + collection + program per tile) persists in `localStorage`.
- **Add more languages** individually, or add the available catalogue after confirmation. Bulk additions run one at a time and can be stopped. There is no fixed 16-tile limit. Many simultaneous videos can overload the device or connection; add only what your device handles. The player prefers the 240p MP4 rendition.
- **Keep the chosen program** when adding translations. If a translation is unavailable, the tile says so instead of substituting another program.
- Saved selections are validated and deduplicated on restore. Narrow screens use a single-column layout.

## Tech

Single `index.html`, no build step, no dependencies. Data comes from the public jw.org mediator API (`data.jw-api.org/mediator/v1`); videos stream from the official CDN. No media is downloaded to this repository, rehosted, proxied, cached by this application, or tracked. The browser streams media directly from JW servers. This is a custom HTML video player, not the official JW player or an iframe. Normal browser buffering still occurs.

Use only for personal, noncommercial viewing. [JW terms](https://www.jw.org/en/terms-of-use/) apply. Direct streaming is not presented here as an official embedding authorization. The publishers permit sharing official links and restrict publication of their material on other websites/apps and marketing uses. No media license is granted by this repository.

## Tests

Run `node --test test/capacity.test.cjs` (Node 20 or later). Sixteen offline tests cover default languages, additions, restoration, input validation, and strict program matching. They do not prove all catalogue translations exist or that a device can play the entire catalogue at once.

Personal, unaffiliated project. Not endorsed by JW.org or its publishers.

## License

MIT — see [LICENSE](LICENSE).
