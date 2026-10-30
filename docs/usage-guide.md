# Usage guide

JW Sign Language Mosaic is a single web page that plays the same jw.org video publication in several sign languages at once, side by side, streamed from the official jw.org servers.

Open it here: **https://halcondeoro.github.io/jw-sign-mosaic/**

The interface is available in English and Spanish (the ES / EN buttons in the top right corner). All control names below are the English ones.

## Quick start

1. Open the page. Eight common sign languages load as tiles, each paused on its first frame. Nothing plays by itself.
2. (Optional) Pick a different program with the "For all" selectors and press **Apply to all**.
3. Press **▶ Play all**. Every tile starts together.

## The mosaic

Each tile is one sign language. A tile shows its language name and code, two selectors (Section and Publication), and the video with its own small controls: audio toggle for that language, fullscreen, and remove (✕).

The counter next to the main buttons shows how many languages are selected.

## Choosing what to watch

Each tile can play any video publication that jw.org offers in its language:

- **Section** groups the video library as on jw.org: JW Broadcasting monthly programs plus the collections (programs, music, series, children's videos, meetings and ministry, ministry tools, Bible, movies, interviews and more).
- **Publication** lists the videos in that section, including books and brochures that have video. Publication titles follow the interface language (English or Spanish); items that exist only in sign languages keep their sign-language title.

To change every tile at once, use the **For all** selectors at the top and press **Apply to all**. The program is matched across languages by its language-agnostic key, so every tile loads the same program in its own sign language.

## Bible passage mode

In any Section selector (global or per tile), choose **Bible: book, chapter and verse**, then a book, a chapter, and optionally a verse.

- Every tile loads that chapter in its own language and opens paused at the chosen verse. **Play all** then starts each tile at its verse.
- With a verse selected, each playing tile loops that verse (from its verse marker to the next one; the last verse ends with the chapter). **Whole chapter** plays straight through.
- Verse markers are per language, so tiles loop independently. Seeking by hand is always respected.
- Strict availability: a language without the chapter, or without a marker for the chosen verse, shows the black "Not available in this language" cell. It never loads a different passage or the chapter from its start.

## Playing in sync

- **▶ Play all** and **⟳ Sync** pause every tile, wait until each can show a frame, seek all to the furthest common timestamp, and start them in the same tick. Tiles still loading are skipped and reported ("N not loaded yet; press Sync when they are ready").
- **⏸ Pause all** pauses everything.
- **Jump all to the same position**: the long slider moves every video to the same relative position (same percentage through each video), and **−10 s** / **+10 s** nudge all of them together. The jw.org API exposes no chapter or song markers, so jumping is position based.
- **Volume** is a single shared slider. Only one tile has sound at a time; unmuting one tile (from the shared slider or from a tile's own controls) mutes the others.

## Adding and removing languages

- **＋ Add language…** opens a searchable list of every sign language in the official jw.org catalogue (search by name or code).
- **Add all catalogue languages…** adds the whole catalogue one language at a time after a confirmation, keeping the current program. **Stop adding** cancels the bulk add partway.
- **✕ Remove all** clears the mosaic after a confirmation.
- There is no fixed tile limit, but many simultaneous videos can exhaust memory, battery or data. Add only what your device handles. The player prefers the 240p MP4 rendition to keep many streams playable.
- If a translation of the current program does not exist, the added tile says so instead of substituting another program.

## When something is not available

If a language does not have the chosen publication, its tile is black and says **Not available in this language**. The page never shows a different video in its place.

## Retry failed

If some tiles fail to load, a **↻ Retry failed (N)** button appears and reloads only those tiles. A retried tile loads paused and joins the next Play all. Tapping a failed or slow tile retries just that one.

## Tile order

Tiles that loaded come first, then tiles with a load error, then tiles whose language has no such video. Within each group, tiles keep the order you added them. Tiles are moved, not rebuilt, so playing videos are not interrupted, and a failed tile that later loads moves back up.

## Sharing the mosaic

**🔗 Copy link** puts a URL on your clipboard that opens the mosaic with the same languages, section and publication. Anyone opening the link gets the same layout, paused and ready to play.

## What the page saves

Your selection (languages, section and program per tile) and the volume persist in your browser's localStorage, so the mosaic comes back as you left it. If the browser blocks storage or the quota is full, the page keeps working normally; it just does not save.

## Capacity note

Start with the usual eight and add more. Actual capacity depends on your device and connection: twenty simultaneous streams is comfortable on a desktop with broadband; a phone may struggle well before that.
