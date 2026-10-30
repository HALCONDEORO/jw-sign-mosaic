# Troubleshooting

## A tile says "Still not loading. Tap here to retry."

The video is taking longer than usual to arrive. Tap the tile's status line to retry just that tile. If several tiles struggle at once, your connection or device is probably at its limit: remove some languages (✕ on a tile, or ✕ Remove all) and try again.

## A tile says "The video failed to load."

Use the **↻ Retry failed (N)** button that appears at the top; it reloads only the failed tiles and leaves the playing ones alone. A retried tile loads paused and joins the next Play all.

## A tile is black and says "Not available in this language"

That is not an error: the chosen publication does not exist in that language on jw.org. Pick another program, or remove that language for this session.

## Play all starts only some tiles

Tiles that were still loading are skipped and the page tells you ("N not loaded yet; press Sync when they are ready"). Wait for them and press **⟳ Sync**: every tile is paused, aligned to the furthest common timestamp and started together.

## The publication list looks short or says it is incomplete

The list is fetched live and can arrive truncated on a slow connection ("The publication list is incomplete. Use Retry failed."). Press **↻ Retry failed** to fetch it again. If the list is incomplete, a previously chosen publication may be missing from it; retrying fixes that too.

## The videos stutter or the page feels slow

Every tile is a live stream; how many run smoothly depends on the device and the connection. On a phone or a slow connection, reduce the number of tiles. The player already prefers the 240p rendition when available to keep many streams playable.

## There is no sound, or sound in the wrong tile

Only one tile has sound at a time, by design. Click the audio toggle on the tile you want to hear; the others mute automatically. The shared Volume slider controls whichever tile is live.

## My selection was not remembered

The selection is stored in your browser's localStorage. It is not saved if your browser blocks storage (private mode in some browsers, strict settings) or if the quota is full. The page keeps working either way; it just cannot save.

## A shared link does not restore the mosaic

The link encodes the languages, section and publication in its `#` fragment. If part of the link was lost when copying, the page falls back to your saved selection. Copy the link again with **🔗 Copy link** and share it complete.

## The catalogue will not load at all

"Catalogue unavailable" means the jw.org catalogue API did not answer. Your saved languages are kept; try again later. The page itself does not cache the catalogue, so it needs that API to be reachable on every visit.
