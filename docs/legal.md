# Legal notice

## What this repository contains

This repository hosts the page code, its tests and its documentation. It hosts no original or recognizable jw.org media, no transcripts, no catalogue copies, and no third-party logos or brand assets. The README screenshot shows only the interface with the video areas heavily blurred, so no recognizable jw.org video content is visible in it.

## How the page works

When someone visits the page, their browser requests the catalogue, the media links and the videos directly from jw.org servers (the public API and the official CDN). Nothing is downloaded to this repository, rehosted or proxied. The application does not store video or audio files; normal browser buffering still occurs.

## Browser storage and privacy

The page uses the visitor's `localStorage` when available. This storage survives closing the page and can be read on later visits to the same site in that browser profile. It is not limited to the current visit.

- **Preferences and saved selection:** interface language, volume, selected sign languages and programs, Bible passage selection, video quality and the featured tile.
- **Metadata cache:** the sign-language catalogue and publication listings, including titles, identifiers and media file links. These are metadata, not video or audio files. The page loads saved lists while requesting fresh data and can use saved metadata when the API is unavailable.
- **Visit-only data:** other lookup maps, such as Bible chapter media lookups and translated listing titles, remain in memory for the visit.

Saved publication listings are accepted for up to seven days when read. This is an age check, not scheduled deletion: older records can remain in storage. The saved language catalogue has no age limit in the code. Cache writes drop the oldest metadata entries if their serialized JSON exceeds the configured size limit. Preferences and saved selection have no automatic expiry in the application. The browser may also clear or evict site storage.

To remove the saved data, clear this site's storage/site data using the browser's settings. This removes the saved selection, preferences and metadata; the next visit starts without them and can save new data again. Other pages on the same origin share access to `localStorage`, so it should not be treated as a private vault, especially in a shared browser profile. A shared link also contains the chosen selection in its URL fragment; anyone given the link can read that selection.

Storage is best effort: blocked access or a full quota must not stop the page, but data may not be saved. There is no project-operated storage server. Requests sent directly to jw.org and the site's host are separate from browser storage and remain subject to those services' policies.

## Terms of use

Use the page only for personal, noncommercial viewing. The [JW terms of use](https://www.jw.org/en/terms-of-use/) apply to the streamed content. Direct streaming is not presented here as an official embedding authorization: the publishers permit sharing official links and restrict publication of their material on other websites or apps and marketing uses. No media license is granted by this repository.

This is a personal, unaffiliated project. It is not endorsed by JW.org or its publishers.

## Takedown

If the rights holder asks for a change or removal, it will be done promptly. Open an issue in this repository or contact the repository owner.

## License of the code

The page code in this repository is MIT licensed; see [LICENSE](../LICENSE). The license covers only the code written for this project. It grants no rights over jw.org content, which remains the property of its publishers.
