# Frequently asked questions

**Is this an official jw.org app?**
No. It is a personal, unaffiliated project. It is not endorsed by jw.org or its publishers, and it does not use the official JW player. It is a custom HTML video player that streams from the public jw.org API and CDN.

**Does the page download or rehost the videos?**
No. Your browser streams the videos directly from jw.org servers, exactly as it would on jw.org. This repository contains only the page code, its tests and its documentation; no original or recognizable jw.org media is stored here (the README screenshot shows the interface with the video areas heavily blurred). Normal browser buffering still happens, the same as on any video site.

**Is it free? Does it track anything?**
It is free, with no accounts and no ads. Your language and program selection and the volume are saved only in your own browser's localStorage, and a shared link additionally carries the selection in its URL fragment.

**Why do some tiles say "Not available in this language"?**
The usual cause is that the publication does not exist (yet) in that sign language on jw.org; it also appears when a selected Bible passage has no video in that language, or when a language's file set does not match the curated books/brochures list. The page never substitutes a different video: a missing program is always shown as missing.

**Why is the video only 240p?**
Video at 240p costs less memory, battery and data per stream, which matters when many tiles play at once. The player prefers the 240p rendition when available, otherwise the lowest available MP4 resolution. How readable a small tile looks depends on your screen and viewing distance.

**Can I watch two different programs at once?**
Yes. Each tile has its own Section and Publication selectors, so any tile can show any of the supported sections and publications offered in its language. The "For all" selectors plus "Apply to all" are just the fast way to set every tile to the same program.

**Why does only one tile have sound?**
So that twenty videos do not talk over each other. The audio toggle on a tile (or unmuting from its own player controls) picks the one tile you hear and mutes the rest; the shared slider only sets how loud it is.

**Does it work on a phone?**
Yes, with a single-column layout on narrow screens. Keep the tile count low on mobile: every tile is a live video stream, and how many a phone runs smoothly depends on the device and the data plan.

**Does it work offline?**
No. Everything (catalogue, media links, videos) is fetched live from jw.org each visit.

**Who can I contact about a problem or a takedown?**
Open an issue in the repository. The README's terms section explains the takedown policy: if the rights holder asks for a change or removal, it will be done promptly.
