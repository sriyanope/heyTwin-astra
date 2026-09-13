# Supplied visual references

These are unchanged source assets for the canonical [heyTwin design system](../../DESIGN_SYSTEM.md), not a deployed theme or a component implementation.

- PDF copied from `/Users/sriyan/Desktop/TFR Brand Kit (2).pdf`.
- PNGs copied byte-for-byte from `/Users/sriyan/Desktop/TFR Brand Kit.zip`; `asset-manifest.json` records archive entry paths and SHA-256 hashes. Print variants and macOS metadata were omitted from this reference subset.
- The ZIP's colour wordmarks visibly say **HEYTWIN** and **HTWIN**; do not infer their content from the older TFR directory names. The PDF's old TFR logos are historical references.
- User-supplied assets retain their original rights; do not assume the application's MIT licence grants additional rights to these materials.

Evidence methods: `pdftotext -layout` for the typography-page labels, `pdffonts` for embedded face names, rendered PDF pages and PNGs for visual inspection. Palette values were extracted from page 5 vector RGB fills using `pdftocairo -f 5 -l 5 -svg`, normalised to nearest 8-bit sRGB, and compared with opaque pixels in `original logo/original_color_logo.png`. This avoids treating screenshot interpolation colours as tokens.

The archive contains no standalone font files. PDF font subsets are identification evidence, not webfont deliverables.
