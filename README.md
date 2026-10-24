# JW Sign Language Mosaic

Watch the same JW Broadcasting program — or any sign-language video publication from jw.org — in several sign languages at once, side by side, straight from the official jw.org CDN.

**Live demo: https://halcondeoro.github.io/jw-sign-mosaic/**

## Features

- **All sign languages**: the full jw.org catalog of 110 sign languages (every sign language listed by the official API, /languages/E/all), searchable by name or code ("Añadir lengua" panel). The 8 most common ones load by default.
- **Publication picker**: each tile can play any video publication available in that language — JW Broadcasting monthly programs plus the library collections (spiritual programs, music, series, children's videos, Bible, movies, interviews...), grouped as they appear on jw.org.
- **Global apply**: pick a collection and program once and apply it to every tile at once (matched across languages by the program's language-agnostic key).
- Play all / pause all / one-click resync (jumps every tile to the furthest timestamp).
- Per-tile audio toggle (only one tile unmuted at a time), fullscreen, and removal.
- Your selection (languages + collection + program per tile) persists in `localStorage`.
- **Limit: 16 simultaneous languages.** More parallel video streams degrade browser playback; the app refuses to add beyond that and says so. Chosen as a safe ceiling for a typical desktop; all videos are the 240p progressive MP4 rendition to keep bandwidth and decode load low.

## Tech

Single `index.html`, no build step, no dependencies. Data comes from the public jw.org mediator API (`data.jw-api.org/mediator/v1`); videos stream from the official CDN. Nothing is proxied, stored, or tracked.

Personal, unaffiliated project. Not endorsed by JW.org or its publishers.

## License

MIT — see [LICENSE](LICENSE).
