# Section navigation

## Implemented first step

The global and tile section menus share one order: Bible book/chapter/verse first, Publications second, then the existing video-library collections in their previous relative order. The general Bible video collection is named "Videos about the Bible" so it is distinct from passage selection. Menu order does not replace restored selections or shared links and does not change the playback default for a new tile.

## Existing data

- Bible: 66 book names in English/Spanish, chapter counts, chapter media lookup and verse-number/start-time markers per sign language. Missing verse markers remain unavailable rather than starting another passage.
- Publications: a checked publication-code list, explicit track-number pairing, translated titles where available and media renditions. Track position is not a chapter number. Some publication track numbers are nonconsecutive.
- Publication normalization currently keeps titles and media choices, not chapter/paragraph/question markers. No validated chapter-to-paragraph-to-question map exists in this repository. A title containing a number is not evidence of its meaning.

## Proposed next steps, not implemented

1. Inside Publications, retain Publication > Video today. Add Chapter only when a verified source explicitly identifies the chapter and its tracks. Do not relabel every video as a chapter.
2. Add Paragraph and then Question controls only for explicit numbered markers within the selected chapter/track. A paragraph or question choice seeks to that language's own start time and opens paused. Keep "Whole chapter/video" available. Do not infer paragraph/question timing by proportional duration or a different language's timestamps.
3. Distinguish unsupported structure (no verified metadata) from an unavailable translation (known requested marker absent). Unsupported controls must explain why they are unavailable; they must not pretend to be working navigation.
4. Preserve stable publication/track/marker identifiers in saved selections and share links. Validate every restored identifier. If the selected marker is missing in a language, show unavailable instead of a nearby paragraph or question.
5. Before enabling this: define an explicit marker adapter, validate bounds and duplicate identifiers, cover missing data and stale responses with offline invented fixtures, then test desktop/mobile selectors and a paused seek. Real marker availability and any permitted metadata access need separate review.

This first step adds no network request or catalogue/media/text copy and makes no claim that publication paragraph or question data is currently available. No transcripts, questions, publication pages or media are included here. Existing repository content limits continue to apply.
