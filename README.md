# JW Sign Mosaic

Watch the same JW Broadcasting program in several sign languages at once, in a single video-wall page.

A personal, unofficial tool: all videos are streamed directly from jw.org's public API and CDN at low resolution (240p per tile). Nothing is downloaded or re-hosted.

## Features

- Responsive grid of tiles, one per sign language (default: Spanish, American, British, Brazilian, Mexican, French, Italian and German Sign Language).
- Each tile streams the latest JW Broadcasting monthly program in that language; a per-tile selector switches to earlier programs.
- Global controls: play all, pause all, and sync (jumps every tile to the same position and resumes).
- One-audio-at-a-time: the speaker button on a tile unmutes it and mutes the rest (videos start muted so autoplay works).
- Fullscreen per tile; add or remove languages from the picker (choice persists in `localStorage`).

## How it works

- `index.html` is the whole app: no build, no backend.
- Language catalog and media lists come from the public mediator API at `https://data.jw-api.org/mediator/v1` (the same endpoint jw.org's own website uses; CORS-enabled, no key).
- Video files are progressive MP4s served from `*.jw-cdn.org`; tiles pick the 240p variant.

## Run

Open `index.html` in a browser, or serve the folder statically (`python3 -m http.server`). To deploy, push to GitHub and enable GitHub Pages on the branch root.

## Configuration

The default language set lives in `DEFAULT_LANGS` at the top of the script in `index.html`. Any sign language available on jw.org can be added from the in-page picker.

## Legal

Not affiliated with or endorsed by jw.org / JW Broadcasting. Content belongs to its owners; this page only links to their public streams. Personal use.

## License

MIT — see [LICENSE](LICENSE).
