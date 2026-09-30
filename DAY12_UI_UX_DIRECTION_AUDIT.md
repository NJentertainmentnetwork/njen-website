NJEN - DAY 12 UI/UX AUDIT AGAINST CLIENT VISUAL DIRECTION
=========================================================

Date: 30-09-2026
Scope: Read-only inspection of the existing UI, code, assets and navigation
against the visual direction NJEN stated on 30-09-2026. NO UI CODE WAS CHANGED.
No redesign was performed and none is proposed for implementation today.

Classification used (no scores, no rankings):
  ALIGNED               - matches the stated direction on current evidence
  ALIGNED WITH CURRENT APPROVED SCOPE - correct for what is approved today;
                          revisit if the approved scope changes
  PARTIALLY ALIGNED     - matches in part; a specific gap is named
  NEEDS IMPROVEMENT     - does not match, and is fixable in code today
  BLOCKED BY CONTENT/ASSETS - cannot be resolved without NJEN content or assets


THE DIRECTION BEING AUDITED AGAINST
====================================

  - New Jersey + Film + Television + Entertainment
  - NOT a New Jersey tourism website
  - Prioritise real photography of film/TV production and entertainment in NJ
  - Suitable: sets, cameras, crews, sound stages, production equipment, actors,
    background performers, theatres, studios, filming locations, relevant NJ
    urban/entertainment environments
  - Avoid: farms, orchards, forests, beaches, flowers, scenic landscapes, unless
    tied to a specific story or production
  - Modern, professional, premium, exciting, industry-focused; not flashy or
    cluttered
  - Excellent mobile/iPhone presentation, simple navigation, fast loading,
    accessibility, strong photography, clear CTAs
  - Easy to find: Jobs & Careers, What's Filming, Events, Education,
    Parents & Young Performers, Background Performers, Production/Industry
    Resources
  - Artwork direction is flexible and not final


SUMMARY TABLE
==============

  Area                                  | Classification
  --------------------------------------|---------------------------------
  Industry focus vs tourism feel         | ALIGNED
  Homepage messaging                     | PARTIALLY ALIGNED
  Navigation structure                   | PARTIALLY ALIGNED
  Jobs & Careers findability             | ALIGNED
  What's Filming findability             | BLOCKED BY CONTENT
  Events findability                     | BLOCKED BY CONTENT
  Education findability                  | PARTIALLY ALIGNED
  Parents & Young Performers findability | BLOCKED BY CONTENT
  Background Performers findability      | ALIGNED WITH CURRENT APPROVED
                                         | SCOPE (intentionally absent)
  Production/Industry Resources          | PARTIALLY ALIGNED
  Imagery strategy                       | BLOCKED BY ASSETS
  Mobile / iPhone layout                 | ALIGNED
  CTA visibility                         | ALIGNED
  Typography                             | ALIGNED
  Spacing and clutter                    | ALIGNED
  Accessibility                          | ALIGNED
  Performance - code and payload         | ALIGNED
  Performance - source asset weight      | NEEDS IMPROVEMENT


1. INDUSTRY FOCUS VS TOURISM  -  ALIGNED
=========================================

Evidence. The only photographic/graphic asset on the public site is
`public/whats-filming.jpg`, which was opened and examined. It is an
entertainment-industry composition: a director's chair marked "ACTION!", a
professional film camera on a tripod, a studio fresnel light, a film-strip band
labelled MOVIES / TV SHOWS / COMMERCIALS / DOCUMENTARIES, and the line
"HOLLYWOOD IS IN NEW JERSEY", over a night skyline.

There is no farm, orchard, forest, beach, flower or scenic landscape anywhere in
the project - there is only one photographic asset and it is production-themed.

Copy supports the same read: "New Jersey's entertainment headquarters",
"Entertainment job board", "Legitimate jobs beyond traditional acting
breakdowns", "What's filming in New Jersey", "A complete entertainment
ecosystem", "Help build New Jersey's entertainment workforce".

Conclusion: the current visual and verbal language reads as entertainment
industry, not tourism. The stated direction confirms the existing course rather
than requiring a change of course.


2. HOMEPAGE MESSAGING  -  PARTIALLY ALIGNED
============================================

Aligned: the hero, the "What brings you to NJEN?" quick-find row, the jobs band,
the ecosystem band and the employer/partner CTA are all industry-framed and
free of tourism language.

The gap is not tone, it is approval. Register item B16 flags homepage claims
that describe POST-LAUNCH capability as if it exists - "Mobile-first member
tools", "education partners", "Now building". Those remain PENDING CLIENT. This
is a wording-accuracy issue rather than a design issue, and it is a launch
blocker in the sense that the public site should not describe capability that is
not there.

What is already correct: the homepage only promotes sections that are actually
published. Every block is wrapped in `isSectionVisible(...)`, so the Events CTA,
the What's Filming band and the Contact CTA do not render while those sections
are unpublished. There are no links to 404 pages.


3. NAVIGATION STRUCTURE  -  PARTIALLY ALIGNED
==============================================

The registry in `lib/sections.ts` drives header, mobile bar and footer from one
source, so a section cannot be linked before it is published. That is good
architecture and it is working.

Against the eight areas NJEN wants easy to find:

  NJEN's area                  | Route              | Published | Why not
  -----------------------------|--------------------|-----------|---------------
  Jobs & Careers               | /jobs, /careers    | YES       | -
  What's Filming               | /whats-filming     | no (404)  | C3 content,
                               |                    |           | B5 sources
  Events                       | /events            | no (404)  | C4 listings
  Education                    | see section 4      | partial   | C5, C10
  Parents & Young Performers   | /children-parents  | no (404)  | C6 content
  Background Performers        | none - by design   | n/a       | POST-LAUNCH
  Production/Industry Resources| /industry (live),  | partial   | C5 listings
                               | /resources (404)   |           |

Four of the eight are currently reachable. The rest are built and return 404
under approved decision R5 ("no empty 'in preparation' pages"). So this is a
content gap, not a navigation-design gap: the moment content exists, each
section appears in navigation automatically with no code change beyond flipping
its `published` flag.

One structural observation for later: the mobile bottom bar is capped at Home
plus four sections. Today only three qualify, so it fits. When What's Filming,
Events, Resources, Children & Parents and Membership all publish, eight to ten
sections will compete for four slots, and the current `.slice(0, 4)` will
silently drop whatever falls past fourth place. That needs a deliberate decision
about mobile information architecture - a "More" menu, or a considered priority
order - before those sections go live. Recorded now so it is not discovered at
launch.


4. EDUCATION  -  PARTIALLY ALIGNED
===================================

Stated honestly: THERE IS NO SECTION CALLED "EDUCATION" in the code or in the
existing approved documentation, and none was invented for this audit.

What exists that covers the same ground:
  - Career Center (`/careers`, PUBLISHED) - pathway guides and the Internship
    Exchange structure, pending client content C10. The Master Business Rules
    reference "Internships / Career Launch (Internship Exchange, education
    partners)".
  - Resources (`/resources`, unpublished) - register C5 is titled "Resource and
    education listings".

So education content is currently planned to live inside Career Center and
Resources rather than as a standalone top-level section.

CLIENT DECISION NEEDED: should "Education" be its own top-level section with its
own navigation entry, or should it remain inside Career Center and Resources? If
it should be its own section, that is a scope addition and needs to be agreed
against the 30-day launch scope rather than assumed.


5. BACKGROUND PERFORMERS  -  ALIGNED WITH CURRENT APPROVED SCOPE
   (INTENTIONALLY ABSENT)
==================================================================

There is no Background Performers area, and that is correct rather than missing.
`MASTER_BUSINESS_RULES_ADDENDUM.md` §1 states the Background Performer Directory
is POST-LAUNCH, and `POST_LAUNCH_DEVELOPMENT_ASSESSMENT.md` places Background
Performer Profiles in Phase B at an estimated 10-16 weeks, dependent on Phase A.
It requires member authentication, consent handling, photo moderation and
server-side authorization, none of which exist or are in the 30-day scope.

If NJEN wants background performers to be FINDABLE at launch in an informational
sense - an explanatory page describing the programme, with no directory, no
profiles and no sign-up - that is a small, safe content page and would need
approved wording. That is a client decision, not an assumption, and it is not
being built today.


6. IMAGERY STRATEGY  -  BLOCKED BY ASSETS
==========================================

Current inventory - the entire public image library is two files:

  File                      | Dimensions  | Size   | Used
  --------------------------|-------------|--------|------------------------
  public/njen-logo.png      | 1169 x 1187 | 791 KB | Header, rendered 54 x 54
  public/whats-filming.jpg  | 1198 x 1182 | 288 KB | Homepage hero; and the
                            |             |        | editorial band, which
                            |             |        | only renders once
                            |             |        | What's Filming publishes

Observations, against NJEN's direction and against the project's own
`ASSET_REQUIREMENTS.md`:

  a) The hero asset is a COMPOSITED PROMOTIONAL GRAPHIC WITH TEXT BAKED IN, not
     photography. NJEN's direction asks to prioritise real photography of film/TV
     production, and `ASSET_REQUIREMENTS.md` §2 already states "Real photography:
     required for public-facing imagery". Subject matter is right; medium is not.

  b) The graphic carries a THIRD-PARTY DOMAIN, "WHATSFILMINGINNJ.COM", printed
     across the bottom. It is currently the largest visual element on the NJEN
     homepage. Whether NJEN intends its homepage hero to advertise another
     domain is a business decision, not a design one, and it should be confirmed
     deliberately.

  c) Text baked into an image cannot be read by assistive technology, cannot be
     translated, and blurs on scaling. The hero does carry meaningful alt text
     ("What's filming in New Jersey campaign artwork"), so it is not an
     accessibility failure - but the words in the picture are not real text.

  d) The SAME image is used for both the hero and the editorial band. The second
     usage is gated behind `isSectionVisible("whatsFilming")` so it does not
     render today. When What's Filming publishes, the same picture would appear
     twice on one page. Worth a second asset before that happens.

  e) Coverage: there is NO imagery at all for Jobs, Career Center, Industry,
     Events, Resources or Publications. Those pages are text-only.

What is needed from NJEN (already specified in `ASSET_REQUIREMENTS.md`):
  - Homepage hero, 1600 x 1480 px, real photography, with usage rights
  - Homepage editorial band, 1600 x 1200 px
  - A small library for section headers, 1200 x 800 px
  - Social/Open Graph image, 1200 x 630 px (register C12)
  - One sentence of meaningful alt text per image
  - Confirmed usage rights for every asset

Until those exist, no imagery work can meaningfully proceed. This is the single
largest gap between the current site and the stated visual direction.


7. MOBILE / IPHONE LAYOUT  -  ALIGNED
======================================

Evidence from the Day 11 verification run, repeated here because it is the
relevant evidence: headless Chrome at 320, 375, 390, 414, 768, 1024 and 1440 px
across three page states produced 21 checks with ZERO horizontal overflow.
Earlier days covered the other pages on the same widths.

Implementation supports it: a sticky header that collapses to a fixed bottom
navigation bar below 1000 px, `env(safe-area-inset-bottom)` padding so the bar
clears the iPhone home indicator, fluid `clamp()` type, full-width buttons and
single-column grids at 650 px, and `prefers-reduced-motion` respected.

NOT TESTED, and not claimed: real iPhone hardware and real Safari. Device
emulation is not a substitute. This remains a final pre-launch item in
`LAUNCH_QA_CHECKLIST.md`.


8. CTA VISIBILITY  -  ALIGNED
==============================

The hero leads with a primary orange "Browse jobs" button. A second hero CTA for
Events appears only when Events is published. The quick-find row gives four
labelled entry points. The jobs band has an inline "View all" link. Each path
card is a full-card link. A closing CTA band addresses employers and partners.

Every CTA points at a published section - there are no dead or decorative
buttons, and Day 4 verified zero `href="#"` and zero inert controls. Buttons use
a minimum height of 50 px, which comfortably clears the 44 px touch-target
guidance.


9. TYPOGRAPHY  -  ALIGNED
==========================

System font stack led by Inter, with no webfont request - which directly serves
the "fast loading" requirement, since there is no font file to download and no
layout shift from font swapping. Fluid display sizing via
`clamp(3.2rem, 7vw, 6.5rem)` for the hero and `clamp(2rem, 4vw, 3.35rem)` for
section headings. Tight negative letter-spacing on display text and a Georgia
serif italic accent in the hero give it a deliberate editorial feel rather than
a generic template look. Body text is 17 px desktop, 16 px mobile, line-height
1.6.

Reads as modern and professional. No change indicated.


10. SPACING AND CLUTTER  -  ALIGNED
====================================

Generous, consistent rhythm: 84 px section padding on desktop, 58 px on mobile;
a container capped at a max width with a 40 px gutter, tightening to 24 px below
650 px; card padding of 22-30 px; consistent 999 px pill radii and 18-28 px card
radii. The homepage is six clearly separated bands.

Against "premium and exciting without being flashy or cluttered": the restraint
is there. There are no autoplaying elements, no carousels, no modals, no
parallax and no decorative motion beyond small hover lifts, which are disabled
under `prefers-reduced-motion`.


11. ACCESSIBILITY  -  ALIGNED
==============================

Evidence: axe-core scans have returned ZERO violations on every run to date -
18 page/viewport runs on Day 9, plus 6 more on Day 11 covering the new jobs
filters at 390 px and 1440 px. Keyboard testing confirms a skip link first in
the tab order, a visible focus indicator on every sampled stop, and all filter
controls reachable.

Contrast was explicitly remediated on Day 4 (24 failures fixed by computing
exact ratios and adjusting `--blue` and introducing `--orange-strong`).

NOT TESTED, and not claimed: screen readers (VoiceOver, NVDA). Automated tools
find roughly a third to a half of real accessibility problems; they do not
replace a human pass with assistive technology. That remains a final pre-launch
item.


12. PERFORMANCE  -  CODE: ALIGNED / SOURCE ASSETS: NEEDS IMPROVEMENT
=====================================================================

Aligned, and genuinely good:
  - First Load JS is 103 kB shared, ~106 kB per page. The Day 11 filters added
    ZERO client JavaScript, because they are a server-rendered GET form.
  - Only three client components exist in the entire site (`NavLink`,
    `ContactForm`, the error boundary). Everything else is a Server Component.
  - 21 of 24 routes are statically prerendered.
  - No webfont, no analytics script, no tag manager, no chat widget, no
    third-party embed of any kind - verified by inspection.
  - `next/image` is used for both images, with `priority` on the hero and
    correct `sizes` hints.

Needs improvement:
  - `public/njen-logo.png` is 791 KB for an image rendered at 54 x 54 px in the
    header. `next/image` resizes and serves a small optimised version, so the
    RUNTIME cost to visitors is limited - but the source file exceeds the
    project's own stated maximum of 500 KB per supplied web image
    (`ASSET_REQUIREMENTS.md` §2), it inflates the repository and every build,
    and it is unnecessary at 1169 x 1187 px for a 54 px avatar. A properly sized
    logo export would be a one-file replacement.

This is a source-asset housekeeping item, not a visitor-facing performance
problem, and it is recorded as such rather than overstated.


13. WHAT WOULD BE DONE FIRST, IF AND WHEN DESIGN WORK IS APPROVED
==================================================================

Listed for planning only. NOTHING BELOW WAS IMPLEMENTED TODAY.

  Depends on nothing (developer can act as soon as design work is approved):
  1. Replace the oversized logo source with a correctly sized export.
  2. Decide mobile bottom-bar information architecture before more sections
     publish (section 3).
  3. Add section-header imagery slots to Jobs, Careers and Industry, ready to
     receive assets.

  Depends on NJEN:
  4. Real production photography (section 6) - the single biggest lever.
  5. B16 homepage wording corrections.
  6. The Education and Background Performers scope decisions (sections 4, 5).
  7. Open Graph image, 1200 x 630 px (C12), plus the production domain (C13),
     which together switch on social sharing previews.


14. LIMITATIONS OF THIS AUDIT
==============================

  - Read-only. No UI code, style, asset or content was changed.
  - No real iPhone, no real Safari, no screen-reader testing was performed, and
    none is claimed.
  - No Lighthouse or field performance measurement was run; the performance
    observations come from the build output, the asset files and code
    inspection.
  - Unpublished sections return 404, so their layouts could not be assessed as a
    visitor would see them. They were assessed from source only.
  - Visual judgement here is against NJEN's written direction. NJEN has stated
    the artwork direction is flexible and not final, and this audit treats it
    that way.
