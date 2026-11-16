# Changelog

## 1.3.0

- Video quality selector: 240p (default), 480p or 720p when the publication offers them. Switching swaps every loaded tile to the new resolution, keeping position and play/pause state.
- Share links carry the full mosaic state: when some tiles play a different publication than the shared one, the link restores each tile as it was.
- Keyboard shortcuts: K or Space toggles play, S syncs, J/Left and L/Right skip 10 s. Shortcuts never fire inside form fields or on focused buttons; toolbar buttons advertise their key with aria-keyshortcuts.
- Metadata cache: the sign-language catalogue and publication listings are kept as metadata (titles and links only, never media) so the page opens instantly and still shows its lists when the jw.org API is unreachable, labelled with the date of the saved copy. Videos always stream live.
- Featured tile: the star button on a tile makes it span the full width at the top of the mosaic; the choice persists and featuring never reloads or reseeks the video.
- Picture in picture: a per-tile button floats that video in a floating window, shown only in browsers that support it.

## 1.2.0

- Docs: 20-language screenshot, publications feature note, terms and takedown (#17).
- Page metadata: favicon, Open Graph tags, noscript fallback (#18).
- Repository hygiene: package.json, SECURITY, issue templates, gitignore, architecture note (#19).

## 1.1.0

- Bible passage picker: compare the same verse across sign languages; a chosen verse repeats.
- Strict availability: a language without the chapter or verse marker shows "Not available".
- Publications: books and brochures with video, in any sign language.
- Tile order: working first, then load errors, then unavailable.
- Storage-safe preferences when `localStorage` is blocked or full.
- Sync, shared volume, share link, jump all and retry failed.

## 1.0.x and earlier

See the tags and merged pull requests.
