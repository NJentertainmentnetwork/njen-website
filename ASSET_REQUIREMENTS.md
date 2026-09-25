# NJEN Asset Checklist

Requested by Master Business Rules section 17, "Asset Standards for Viral to
Confirm on Day 1".

These are technical requirements derived from the current layout code. They are
developer recommendations for NJEN to confirm, not business decisions. Sizes
come from the real rendered dimensions in `app/globals.css` and the `next/image`
usages, doubled for high-density (retina) screens.

## 1. Logo

| Item | Requirement |
|---|---|
| Preferred format | SVG (vector), plus PNG with transparency as fallback |
| Minimum PNG size | 216 × 216 px (rendered at 48 px, 40 px on mobile; 2× plus headroom) |
| Shape | Currently displayed as a circle (`border-radius: 50%`, `object-fit: cover`). A square or circular lockup works; a wide horizontal lockup will be cropped |
| Background | Transparent preferred. The current file has a solid black background |
| Current file | `public/njen-logo.png`, 1169 × 1187 px, 810 KB — larger than needed and not transparent |

Also needed: a favicon/app icon source (512 × 512 px square) — not yet implemented.

## 2. Photography and artwork

| Placement | Rendered size | Minimum supplied size | Crop |
|---|---|---|---|
| Homepage hero | up to 720 px wide | 1600 × 1480 px | ~1.08:1, near-square |
| Homepage editorial band | ~600 px wide, 520 px tall | 1600 × 1200 px | 4:3 landscape, centre-safe |
| Future card/listing images | not yet implemented | 1200 × 800 px | 3:2 landscape |
| Future social/Open Graph image | not yet implemented | 1200 × 630 px | fixed |

- **Format:** JPEG for photographs, PNG for artwork with flat colour or transparency. Next.js generates WebP automatically — do not pre-convert.
- **Maximum file size:** 500 KB per supplied web image. Supply originals at full resolution separately; they are not served directly.
- **Originals:** preserve high-resolution originals. Optimised web versions are generated from them, never by destructively resizing the original.
- **Real photography:** required for public-facing imagery. Do not substitute AI caricatures or synthetic people for approved photographs (Business Rules section 17).
- **Rights:** every asset needs known usage rights or permission before publication.
- **Alt text:** supply one sentence of meaningful alt text per image that conveys information. Purely decorative images are marked as decorative in code instead.

## 3. File naming

- Lower case, hyphen separated, no spaces or underscores: `whats-filming-hero.jpg`.
- No dates, version numbers or camera filenames: `img_4821.jpg` and `final-v3-NEW.png` are not acceptable.
- Name by content and placement, for example `career-center-card-internships.jpg`.

## 4. Items to confirm

1. Approved logo variants: is there a horizontal lockup, a mono/white version for dark backgrounds, and a transparent version?
2. Favicon/app icon source file.
3. Rights and approval status for the two existing images in `public/`.
4. Whether the existing hero artwork, which displays the domain **whatsfilminginnj.com**, is approved for the public homepage, whether NJEN owns that domain, and whether anything on the site should link to it.
5. Whether approved real photography will replace the current campaign artwork on the homepage.
6. Brand typography: the site currently requests Inter with a system-font fallback, and no webfont file is loaded. Confirm the approved brand typeface.
