# NJEN — Day 15 implementation report

**Date:** 02-10-2026 · **Branch:** `main` · **Last commit:** `44ff4a2`
**Nothing committed, pushed or deployed.** No account, DNS, Vercel, Supabase,
Resend or GitHub setting was touched. No credentials exist in the repository.

Goal for the day: move `/early-access` from a preview-only mock toward a real
lead-capture page — approved artwork, a real form, and a storage path that goes
live the moment NJEN supplies its own Supabase access.

---

## 1. Classification

### A. Unblocked — implemented

- Approved hero artwork, responsive, desktop and mobile compositions.
- Name field added; CTA changed to **GET EARLY ACCESS**.
- Real server route (`POST /api/early-access`) with server-side validation,
  honeypot, timing guard and rate limiting.
- Supabase storage adapter, dormant until NJEN sets two environment variables.
- Reviewed migration: table, indexes, row-level security, write function, export
  and deletion queries.
- Consent seam, so approved wording drops in without touching the form.
- Build, typecheck, route, accessibility and secret-scan verification.

### B. Client/access required — documented, not implemented

| # | Item | Blocks |
|---|---|---|
| B1 | Supabase project + the two environment variables | Actually storing leads |
| B2 | Approved consent wording and Privacy Policy URL (register B6) | The consent control |
| B3 | Vercel project access | Any preview or production deploy |
| B4 | Confirmed production domain (register C13) | Canonical URL, sitemap, indexing |
| B5 | Higher-resolution artwork exports | Sharpness on retina phones — see §8 |
| B6 | Decision: is `/early-access` indexed and in the sitemap? | Raised Day 14, still open |

### C. Not authorised — not touched

Vercel/Supabase/Resend/GitHub account settings, DNS, billing, production data,
legal wording, the main website design, the main homepage, site navigation.

---

## 2. Files changed

**Modified (6)**

| File | Change |
|---|---|
| `app/early-access/page.tsx` | Typographic hero replaced by the approved artwork; H1 moved to real text; storage state resolved server-side |
| `components/EarlyAccessForm.tsx` | Name field, new CTA, real submission, accessible status and error handling, consent slot |
| `lib/early-access.ts` | Submission/response contract, rate-limit constants, consent slot; the hard-coded "disabled" flag is gone |
| `lib/forms.ts` | New `early-access` form kind (name required, email required) |
| `app/globals.css` | Artwork hero, visually-hidden heading utility, consent field, form status line; dead typographic-hero rules removed |
| `.env.example` | `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` moved from "planned" to "read by the application" |

**Added (4)**

| File | Purpose |
|---|---|
| `app/api/early-access/route.ts` | The only path by which a signup is accepted |
| `lib/early-access-store.ts` | Server-only Supabase adapter (no SDK, no credentials) |
| `db/migrations/0002_early_access_signups.sql` | Reviewed SQL — **not applied anywhere** |
| `DAY15_EARLY_ACCESS_SUPABASE_SETUP.md` | The 15-minute client checklist |

**Untracked assets:** `public/images/early-access/` — the two client-supplied
PNGs, not yet committed.

---

## 3. Approved artwork implementation

The two files were delivered as
`NJEN_Early_Access_Desktop_Hero.png` (1118×1024) and
`NJEN_Early_Access_Mobile_Hero.png` (404×1024) — **not** under the filenames in
the Day 15 brief (`early-access-hero-desktop.png` / `-mobile.png`). The code
uses the real filenames. Renaming the delivered assets would have been a silent
change to client-supplied files.

**Used exactly as delivered.** Not recropped, retouched, recoloured, overlaid or
regenerated. No text, logo or element was altered, and the signup form is real
HTML — nothing is baked into the image.

**How it is served**

- A plain `<picture>` element, with `<source media="(min-width: 700px)">` for the
  desktop/tablet composition and the mobile poster as the `<img>`.
- `next/image` was **not** used here. It has no art-direction support, and these
  are two separate compositions rather than one image at two sizes. Toggling two
  `<Image>` elements with CSS would have downloaded both files on every visit.
- Both sources still go through Next's image optimizer (`/_next/image`), so the
  browser gets WebP/AVIF at the width it actually needs:

  | Asset | Delivered PNG | Served | Saving |
  |---|---|---|---|
  | Mobile | 813 KB | **85 KB** WebP | 90% |
  | Desktop | 2 218 KB | **214 KB** WebP | 90% |

  Verified against a production build, not assumed.

**No cropping, at any width.** `object-fit` is never applied; the poster scales
whole. Nothing in either composition can be cut off.

**No layout shift.** The `<img>` carries `width`/`height`, and CSS re-declares
`aspect-ratio` at the 700px switch so the reserved box and the file that lands
in it always agree. Without that second declaration the breakpoint itself would
have caused a jump. The hero is marked `fetchPriority="high"` and never lazy.

**Accessibility.** The artwork carries its headline as pixels, so the page's one
`<h1>` repeats that wording as real text, visually hidden. The image is then
marked decorative (`alt=""`) — giving it a full alt as well would make a screen
reader read the same sentence twice. Screen readers, search engines and
images-off browsing all get the headline.

---

## 4. Form changes

| Before | After |
|---|---|
| Email only | **Name** (required) + **Email** (required) |
| "Yes - I want early access" | **GET EARLY ACCESS** |
| Validated in the browser only | Validated in the browser **and again on the server** |
| Nothing submitted anywhere | Real `POST /api/early-access` |
| Success screen always shown | Success shown **only when the server confirms a row was written** |

Still two fields. This is a conversion page; every extra field costs signups.

**Captured:** name, email, signup timestamp, referral/source. The timestamp and
source are recorded **server-side** — a browser-supplied timestamp can be
anything. Source is read from `?source=` / `?utm_source=` / `?ref=`, falling back
to the referring **host only** (never the full referring URL, which can carry
personal data in its path).

**Kept:** honeypot, submission-timing guard, keyboard access, visible focus, 16px
inputs (so iOS does not zoom on focus), `aria-invalid`, `aria-describedby`,
focus moved to the first bad field.

**Fixed along the way.** The anti-abuse guards return a deliberately generic
form-level rejection. Previously that surfaced as "please correct the
highlighted fields" with nothing highlighted. Browser autofill can submit faster
than the timing floor, so a real visitor could hit a dead end with no way
forward. Form-level messages are now shown as form-level messages.

**No fake persistence anywhere.** The three outcomes are distinct:

| Server says | Visitor sees |
|---|---|
| Row stored | "You're in. Welcome to NJEN." |
| No storage configured | "Checked — but not saved", and plainly that nothing was kept |
| Write failed | "…your signup was not saved. Please try again shortly." |

---

## 5. Supabase requirements

Full steps in **`DAY15_EARLY_ACCESS_SUPABASE_SETUP.md`**. Summary of the eight
points asked for:

1. **Structure** — one table, `app.early_access_signups`, in the `app` schema
   established by migration 0001.
2. **Fields** — `id`, `name`, `email`, `signed_up_at`, `source`, `consent_text`,
   `consent_given_at`, `created_at`, `updated_at`. Unique on `lower(email)`, so
   a double submission is one lead, not two.
3. **Environment variables** — `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
   Two, both server-only. Nothing else.
4. **Server-side route?** — **Yes, and only that.** `POST /api/early-access`.
   The browser never holds a credential and never reaches the database.
5. **Client configuration** — none. No `NEXT_PUBLIC_SUPABASE_*`, no browser
   client, no anon key. Adding them would open a browser-side database entry
   point for no benefit.
6. **Existing architecture** — yes, and it was followed rather than bypassed:
   the provider-independent validation layer in `lib/forms.ts`, the `app` schema
   and `set_updated_at()` trigger from migration 0001, and the existing
   "boundary module per provider" pattern from `lib/email.ts`.
7. **Security / RLS** — RLS enabled **and forced**, with **no policy**, which
   denies everything. `anon` and `authenticated` are revoked. The `app` schema
   stays out of Supabase's Data API, so the table is unreachable over HTTP;
   writes go through one `security definer` function in `public` with a pinned
   `search_path`, executable by `service_role` alone. No IP address or user agent
   is stored.
8. **Export** — a `select` in the Supabase SQL Editor, then *Download CSV*. The
   query, and the single-record deletion query, are in the setup document and in
   the migration's footer.

**No new npm dependency.** The adapter uses `fetch` against Supabase's HTTP API.
Adding `@supabase/supabase-js` for one insert would have grown a four-dependency
project for no capability we need.

---

## 6. Privacy and consent — decisions required from NJEN

**No legal wording was invented.** The form currently shows no consent control.
The UI, the validation and the database column are all built and wired to a
single switch (`EARLY_ACCESS_CONSENT` in `lib/early-access.ts`); supplying the
answers below turns the whole thing on without further design work.

| # | Decision needed | Why it matters |
|---|---|---|
| P1 | **The exact consent wording**, as approved | Goes verbatim on the checkbox label. Nothing is drafted here |
| P2 | **Privacy Policy URL** | The label links to it. There is no privacy policy page on the site today |
| P3 | **Required, or optional?** | Required blocks signup until ticked — safer, costs some conversions. Optional captures more leads |
| P4 | **Is marketing/newsletter consent separate from joining the list?** | One box or two. In several jurisdictions "join the list" and "send me offers" are not the same permission |
| P5 | **Does one consent cover opportunities, events, offers and NJEN Insider?** | Determines whether the wording must enumerate them |
| P6 | **Double opt-in?** | If yes, the success screen must stop saying "you're in" and the schema needs a `confirmed_at` column. Decide before launch, not after |

**One thing to review now.** The line under the button —
*"Free to join. No spam. Unsubscribe anytime."* — shipped on Day 14 and is left
unchanged. It is marketing copy, not legal wording, but it is a promise: NJEN
must actually be able to honour an unsubscribe. Flagging it rather than removing
it unasked.

**Design note:** `consent_text` stores the wording shown at the moment of
signup, not a boolean. Proving consent means proving *what* was agreed to, and
wording changes over time.

---

## 7. Resend / DNS

**Resend is not required for lead capture, and should not block it.**

The flow is `form → server → Supabase → lead stored`. No email is sent at any
point. The confirmed architecture:

```
Stage 1 (built today)   Form → /api/early-access → Supabase.  No email. No DNS.
Stage 2 (later)         Supabase → Resend → confirmation / NJEN Insider.
```

Resend is needed only for a welcome email, double opt-in, or Insider sends —
none of which NJEN has asked for yet. Nothing was configured, no DNS record was
touched, no credential was added.

---

## 8. Vercel preview status

**No Vercel project, setting or deployment was created or changed** — that is
client-controlled.

What was verified locally instead, against a real production build:

- `npm run build` succeeds. **25 routes** (24 before, plus the new API route).
- `/early-access` is still **statically prerendered**, 2.9 kB page JS.
- `/api/early-access` is correctly dynamic and is never prerendered.
- **No environment variable is needed to render the page.** Built and served with
  everything unset; the page renders fully and says honestly that signups are not
  being stored.
- Both artwork files are served correctly and are optimized at request time.
- The page is ready to deploy through NJEN's Vercel project as-is.

**To deploy it, NJEN needs to:** give the developer access to the Vercel project
(or deploy from `main` itself). That is the only outstanding item for a preview.

---

## 9. Test results

| Check | Result |
|---|---|
| `npm run typecheck` | **Pass**, no errors |
| `npm run build` | **Pass**, 25/25 routes generated |
| `git diff --check` | **Clean** (CRLF notices only) |
| `/early-access` | **200** |
| All other routes | Unchanged — the 404s are the known unpublished sections (`requireSection` gate), identical to before |
| `GET /api/early-access` | **405**, as it should be |
| Hydration errors from application code | None |
| Secrets in `.next/static` | **None** |
| Secrets in sources | **None**; no `.env` file exists beyond `.env.example` |
| Dead CSS / stale references | None — every `ea-` class is both defined and used |

**API route, tested live against a production build:**

| Case | Result |
|---|---|
| Valid, storage unconfigured | `503 not-configured` — correctly refuses to claim a save |
| Missing name | `400 invalid`, field-level error |
| Malformed email | `400 invalid`, field-level error |
| Honeypot filled | `400`, generic rejection (no hint about which guard fired) |
| Submitted faster than a person can type | `400`, generic rejection |
| Non-JSON body | `400`, no crash |
| 6 posts from one IP | 5 accepted, 6th `429 rate-limited` |

**Responsive QA — 320 / 375 / 390 / 414 / 768 / 1024 / 1440 px.** Verified by
geometry against the compiled CSS, **not by screenshot**: no browser automation
is installed in this environment. No horizontal overflow at any width (every
container is `min(100% - 32px, …)`, the artwork is `width: 100%` with no fixed
minimum). Mobile poster is full-bleed to 460px then centred; desktop composition
takes over at 700px and caps at 1100px. Form inputs are full-width within a
540px column. Touch targets: inputs 54px, submit 56px, hero CTA 56px — all above
the 44px minimum.

**This is the one thing the client should check on a real iPhone**, which is
what they asked to do.

**Accessibility QA:** one `<h1>`, then `<h2>`s only — no skipped levels (the
success-screen heading was an `<h2>` outside the document order and is now an
`<h3>` inside its section). Every input has a real `<label>`. `aria-invalid` and
`aria-describedby` are set on error. Errors and status messages live in
announced regions (`role="alert"` / `role="status"`). Focus moves to the first
invalid field. Focus is visible throughout (inherited `:focus-visible`). The CTA
is a real link and the submit is a real button — no image-only control anywhere.
The CTA's capitals come from CSS, not from the markup, because some screen
readers spell out all-capitals text letter by letter.

---

## 10. Client blockers

1. **Supabase access** (B1) — the only thing between this page and real leads.
   Fifteen minutes, in `DAY15_EARLY_ACCESS_SUPABASE_SETUP.md`.
2. **Consent wording and Privacy Policy URL** (B2) — six decisions in §6.
3. **Vercel project access** (B3) — for any preview or deploy.
4. **Production domain** (B4) — canonical URL, sitemap and indexing stay off
   until it is confirmed.
5. **Indexing decision for `/early-access`** (B6) — raised Day 14, still open.
6. **Repository is still public** — raised 30-09, still outstanding.

---

## 11. Risks

**R1 — The artwork uses third-party trademarks and recognisable likenesses.**
Both posters carry the logos of Netflix, Disney, Warner Bros., Universal,
Paramount, Sony Pictures, Amazon MGM, NBC, HBO, Apple TV+ and A24, alongside what
appear to be the faces of identifiable working actors. NJEN has approved the
artwork and it has been implemented as approved. But this is the one item on the
page that could cause a real problem: studio marks arranged as a banner read as
claimed partnerships, and a performer's likeness used in advertising is a
right-of-publicity question in New Jersey regardless of how the image was made.
It also sits awkwardly against the standing instruction not to imply partners or
affiliations NJEN does not have. **Recommend NJEN confirms this cleared legal
review before the page is advertised**, since a Facebook campaign is exactly the
public, commercial use that attracts attention. This is a flag, not a refusal —
the decision is NJEN's.

**R2 — Artwork resolution.** The mobile poster is 404px wide. A current iPhone
is 390–430 CSS px at 3× — roughly 1200 physical pixels — so the poster renders
at about one third of the density the screen can show. Small text inside it
(the studio logos, the icon row) will look soft, and the client is reviewing on
an iPhone. The desktop poster has the same issue on retina laptops. **Ask for
re-exports at ≥1200px wide (mobile) and ≥2400px wide (desktop);** the code needs
no change beyond the two numbers, and the optimizer will keep the delivered file
size down.

**R3 — The poster is tall on a phone.** At 390px the mobile artwork is ~988px
tall, so on a 390×844 screen the "Join the early access list" button begins just
below the fold. It was left uncropped deliberately: cropping would cut the icon
row, which the Day 15 brief warns against. If NJEN would rather the CTA were
visible without scrolling, the cheap fix is a sticky bottom CTA bar on mobile —
a one-line decision, not shipped unasked.

**R4 — Rate limiting is per serverless instance.** The limiter holds state in
memory, and instances do not share memory, so the real ceiling is 5 per instance
per 10 minutes rather than 5 per site. It stops a browser or a naive script, not
a distributed flood. A shared limiter is Week 3/4 hardening; it was not a reason
to ship no limit at all. The unique index on `lower(email)` separately caps the
damage: repeat submissions collapse into one row.

**R5 — Storage state is resolved at build time.** `/early-access` stays static
for speed, so the "preview only" notice reflects the environment as it was when
the site was built. Setting the variables in Vercel triggers a redeploy anyway,
so in practice this resolves itself — but **step 5 of the setup checklist
(confirm the notice is gone) is not optional.**

**R6 — No email is sent, by design.** A signup today is stored and shown an
on-screen confirmation, nothing more. If NJEN expects people to receive a
welcome email, that is Resend (§7) and it is not built.

---

## 12. Git status

**Nothing committed. Nothing pushed. Nothing deployed.** Last commit is still
`44ff4a2`, branch `main`.

```
 M .env.example
 M app/early-access/page.tsx
 M app/globals.css
 M components/EarlyAccessForm.tsx
 M lib/early-access.ts
 M lib/forms.ts
?? app/api/
?? db/migrations/0002_early_access_signups.sql
?? lib/early-access-store.ts
?? public/images/
?? DAY15_IMPLEMENTATION_REPORT.md
?? DAY15_EARLY_ACCESS_SUPABASE_SETUP.md
```

`git diff --check` is clean. Test ports released.
