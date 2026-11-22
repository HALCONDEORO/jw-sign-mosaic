# Frequently asked questions

**Is this an official jw.org app?**
No. It is a personal, unaffiliated project. It is not endorsed by jw.org or its publishers, and it does not use the official JW player. It is a custom HTML video player that streams from the public jw.org API and CDN.

**Does the page download or rehost the videos?**
No. Your browser streams the videos directly from jw.org servers. This repository contains only the page code, its tests and its documentation; no original or recognizable jw.org media is stored here (the README screenshot shows the interface with the video areas heavily blurred). Normal browser buffering still happens, the same as on any video site.

**Is it free? Does it track anything?**
It is free, with no accounts and no ads. The page saves your selection and preferences (including interface language, quality, volume and featured tile) in your browser's `localStorage`. It also saves catalogue and publication-list metadata, including titles and media links, but not video or audio files. These records can survive closing the page. A shared link additionally carries the selection in its URL fragment. Browser storage is not a private vault: other pages on the same origin and people using the same browser profile may access it. Requests go directly to jw.org and the site's host, whose policies also apply. See [Browser storage and privacy](legal.md#browser-storage-and-privacy).

**How do I remove the saved data?**
Clear this site's storage/site data in your browser's settings. This removes the saved selection, preferences and metadata together. A new visit can save data again. Publication listings are accepted for up to seven days, but that age check does not automatically erase old entries; the language catalogue and preferences have no automatic expiry in the application.

**Why do some tiles say "Not available in this language"?**
The usual cause is that the publication does not exist (yet) in that sign language on jw.org. In Bible mode it also appears when the language has no video of the chosen chapter, or has the chapter but no marker for the chosen verse; and a language whose file set does not match the curated books/brochures list shows it too. The page never substitutes a different video: a missing program is always shown as missing.

**Why is the video 240p by default?**
Video at 240p costs less memory, battery and data per stream, which matters when many tiles play at once. If a publication offers higher resolutions, the Quality selector in the toolbar switches every tile to 480p or 720p, keeping position and play/pause state. How readable a small tile looks depends on your screen and viewing distance; the featured tile (star button) gives one language a full-width view.

**Can I watch two different programs at once?**
Yes. Each tile has its own Section and Publication selectors, so any tile can show any of the supported sections and publications offered in its language. The "For all" selectors plus "Apply to all" are just the fast way to set every tile to the same program.

**Why does only one tile have sound?**
So that twenty videos do not talk over each other. The audio toggle on a tile (or unmuting from its own player controls) picks the one tile you hear and mutes the rest; the shared slider only sets how loud it is.

**Does it work on a phone?**
Yes, with a single-column layout on narrow screens. Keep the tile count low on mobile: every tile is a live video stream, and how many a phone runs smoothly depends on the device and the data plan.

**Does it work offline?**
Videos always stream live from jw.org, so playback needs a connection. The catalogue and publication listings are cached as metadata in your browser: if the jw.org API is unreachable, the page still opens with the saved lists, labelled with the date they were last updated.

**Who can I contact about a problem or a takedown?**
Open an issue in the repository. The README's terms section explains the takedown policy: if the rights holder asks for a change or removal, it will be done promptly.
