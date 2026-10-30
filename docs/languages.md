# Languages

The mosaic plays the same video in any sign language published on jw.org. This page explains where the language list comes from and what to expect from it.

## The catalogue

The language list comes from the official jw.org catalogue API (`/mediator/v1/languages/E/all`). At the time of writing it offers about 110 sign languages out of more than a thousand spoken and written languages. The page reads the live catalogue every time it loads; nothing is bundled into the repository, so new sign languages appear in the "Add language" panel as soon as jw.org publishes them.

Each language has a short code (LSE for Spanish Sign Language, ASL for American Sign Language, and so on). The search box in the "Add language" panel matches both the language name and its code.

## The default eight

On a fresh visit, eight widely used sign languages load automatically:

| Code | Language |
|------|----------|
| LSE | Spanish Sign Language |
| ASL | American Sign Language |
| BSL | British Sign Language |
| LSB | Brazilian Sign Language |
| LSM | Mexican Sign Language |
| LSF | French Sign Language |
| ISL | Italian Sign Language |
| DGS | German Sign Language |

Your own selection replaces the defaults as soon as you add or remove a language, and it is remembered in your browser.

## Not every video exists in every language

The jw.org catalogue is much larger in ASL or LSE than in a language with a recent sign-language translation. When you apply a program to all tiles, each language is matched by the program's language-agnostic key:

- If the program exists in that language, the tile loads it.
- If it does not, the tile shows the black "Not available in this language" cell. The page never substitutes a different video, a different program, or another language.

The same strict rule applies to Bible chapters and to verse markers (see the usage guide): a missing chapter or a missing marker means the black cell, never a fallback passage.

## Video quality

The player prefers the 240p MP4 rendition of each video. Twenty tiles at 240p are far easier on memory, battery and data than twenty HD streams, and sign language stays perfectly readable at that size. Fullscreening a tile still shows the same rendition.

## Interface language vs video languages

The ES / EN buttons switch only the interface (labels, buttons, and the language used for publication titles in the selectors). They never change which sign languages are in your mosaic. Publication titles come from the English or Spanish jw.org listings, with ASL and LSE as the reference sign languages for titles that only exist in sign language.
