# NJEN Preview QA Checklist (Day 24)

**Prepared 15-10-2026. For use once NJEN sends the protected Vercel Preview share link** (`docs/NJEN_DAY23_NEXT_CLIENT_ACTION.md`). Nothing below has been run on a deployment. Every result starts as **Not tested**.

The local results quoted in the "Local" column come from `DAY24_IMPLEMENTATION_REPORT.md`. A local pass is not a Preview pass.

**Rules while running it:**
- The Preview has **no storage variables**, so it cannot save a signup. Do not add any to run these checks.
- Use a test address only. Never paste a real visitor's details into a ticket, chat or report.
- Do not change any Vercel setting to make a check pass. Record the failure and stop.
- `scripts/early-access-live-check.mjs` and `scripts/early-access-browser-check.mjs` refuse non-local URLs. Run the checks below by hand, with a browser and `curl`.
- **Added later:** rows A3, A4, B1–B8 and C1 are read-only, and `scripts/site-smoke-check.mjs` runs them all against the Preview. It sends GET requests only and never submits the form: `node scripts/site-smoke-check.mjs --base https://<deployment>.vercel.app --share "<share link>"`. Copy each PASS/FAIL into the Result column. A1, A2 and sections C2–E still need a person, a browser and real devices.

**How to fill in a row:** tick one of Pass / Fail / Not tested, and add the device, browser and date in Notes.

---

## A. Which build is this?

| # | Check | How | Pass when | Local | Result | Notes |
|---|---|---|---|---|---|---|
| A1 | Repository | Vercel deployment page (screenshot from NJEN, or the share page) | `NJentertainmentnetwork/njen-website` | n/a | ☐ Pass ☐ Fail ☐ Not tested | |
| A2 | Commit | Same | Matches the commit on GitHub `main` that the developer expects (Day 24 changes included) | n/a | ☐ Pass ☐ Fail ☐ Not tested | Commit: |
| A3 | Private | Open the URL in a private window **without** the share link | Vercel login page, not the site | n/a | ☐ Pass ☐ Fail ☐ Not tested | |
| A4 | Health | `curl -s <preview>/api/health` (with the share-link cookie) | `{"status":"ok"}`, `Cache-Control: no-store` | Pass | ☐ Pass ☐ Fail ☐ Not tested | |

## B. Indexing, headers and routes

| # | Check | How | Pass when | Local | Result | Notes |
|---|---|---|---|---|---|---|
| B1 | robots.txt | Open `/robots.txt` | `User-Agent: *` / `Disallow: /` | Pass | ☐ Pass ☐ Fail ☐ Not tested | |
| B2 | Sitemap | Open `/sitemap.xml` | Empty `<urlset>` (no domain set) | Pass | ☐ Pass ☐ Fail ☐ Not tested | |
| B3 | Early Access noindex | View source of `/early-access` | `<meta name="robots" content="noindex, nofollow">` | Pass | ☐ Pass ☐ Fail ☐ Not tested | |
| B4 | Security headers | `curl -sI <preview>/early-access` | CSP, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` present; HSTS (added by Vercel); no `X-Powered-By` | Pass (HSTS n/a locally) | ☐ Pass ☐ Fail ☐ Not tested | |
| B5 | Hidden sections | Open `/whats-filming`, `/events`, `/resources`, `/about`, `/contact`, `/membership` | Each is the 404 page | Pass (10/10 sections) | ☐ Pass ☐ Fail ☐ Not tested | |
| B6 | No directory or portal | Open `/directory`, `/performers`, `/background-performers`, `/portal`, `/admin`, `/api/jobs` | 404 | Pass | ☐ Pass ☐ Fail ☐ Not tested | |
| B7 | Unknown page | Open `/this-does-not-exist` | Branded 404 with Home / Jobs / Career Center links; noindex | Pass | ☐ Pass ☐ Fail ☐ Not tested | |
| B8 | Internal links | Click every header, footer, mobile-bar and in-page link on `/`, `/jobs`, `/careers`, `/industry`, `/publications` | All open a real page; none goes off-site | Pass (crawl: 0 broken, 0 external) | ☐ Pass ☐ Fail ☐ Not tested | |

## C. Early Access: what a visitor sees (Preview has no storage)

| # | Check | How | Pass when | Local | Result | Notes |
|---|---|---|---|---|---|---|
| C1 | Preview notice | Open `/early-access` | Amber "Preview only" box above the form | Pass | ☐ Pass ☐ Fail ☐ Not tested | |
| C2 | Artwork | Same, on phone and desktop | Mobile poster below 700 px, desktop poster above; never cropped | Pass (emulation) | ☐ Pass ☐ Fail ☐ Not tested | |
| C3 | Empty submit | Tap "Get early access" with both fields empty | Both field errors; focus on the name field | Pass | ☐ Pass ☐ Fail ☐ Not tested | |
| C4 | Bad email | Name filled, email `nope` | "Enter a valid email address."; focus on email | Pass | ☐ Pass ☐ Fail ☐ Not tested | |
| C5 | Valid submit | Test name and test address | "Checked - but not saved"; **never** "You're in" | Pass | ☐ Pass ☐ Fail ☐ Not tested | |
| C6 | Focus after result | Keyboard: Tab to the button, press Enter | Focus moves to the "Checked - but not saved" heading, with no visible ring | Pass (fixed Day 24) | ☐ Pass ☐ Fail ☐ Not tested | |
| C7 | Rate limit | Submit 6 times within 10 minutes | 6th: "Too many attempts…" (may be looser: limit is per server instance) | Pass | ☐ Pass ☐ Fail ☐ Not tested | |
| C8 | Consent box | Look below the email field | **No** consent checkbox (no approved wording, B6) | Pass | ☐ Pass ☐ Fail ☐ Not tested | |
| C9 | Console | Desktop browser DevTools → Console, before and after submitting | Only the expected 503 for the signup request; no CSP violations, no errors | Pass | ☐ Pass ☐ Fail ☐ Not tested | |

## D. Real devices

| # | Check | Device / browser | Pass when | Local | Result | Notes |
|---|---|---|---|---|---|---|
| D1 | Layout, no sideways scroll | iPhone, Safari | `/early-access`, `/`, `/jobs`, `/careers`, `/industry` all fit; nothing clipped | Emulation only | ☐ Pass ☐ Fail ☐ Not tested | Model / iOS: |
| D2 | No zoom on focus | iPhone, Safari | Tapping name or email does not zoom the page | Emulation only (16 px inputs) | ☐ Pass ☐ Fail ☐ Not tested | |
| D3 | Email keyboard | iPhone, Safari | Email field shows the @ keyboard; name field "next", email "go" | Not tested | ☐ Pass ☐ Fail ☐ Not tested | |
| D4 | Facebook in-app browser | iPhone, link opened from a private test post or Messenger | Same as C1–C5 and D1–D2 | Not tested | ☐ Pass ☐ Fail ☐ Not tested | |
| D5 | Instagram in-app browser (if used for campaigns) | iPhone | Same | Not tested | ☐ Pass ☐ Fail ☐ Not tested | |
| D6 | Android Chrome (if available) | Any Android phone | Same as D1–D3 | Not tested | ☐ Pass ☐ Fail ☐ Not tested | |
| D7 | Desktop Safari (if available) | Mac | Layout and form as C1–C6 | Not tested | ☐ Pass ☐ Fail ☐ Not tested | |
| D8 | Bottom bar does not hide focus | iPhone with keyboard, or desktop at 390 px | No focused link or button is fully hidden under the mobile bar | Pass (emulation) | ☐ Pass ☐ Fail ☐ Not tested | |

## E. Keyboard and screen reader

| # | Check | How | Pass when | Local | Result | Notes |
|---|---|---|---|---|---|---|
| E1 | Skip link | Desktop: Tab once on `/`, press Enter, Tab again | First stop is "Skip to content"; next Tab lands inside the page content | Pass (Edge) | ☐ Pass ☐ Fail ☐ Not tested | Browser: |
| E2 | Visible focus | Tab through `/` and `/early-access` | Every stop has a visible ring | Pass (Edge) | ☐ Pass ☐ Fail ☐ Not tested | |
| E3 | VoiceOver, iPhone | Settings → Accessibility → VoiceOver; swipe through `/early-access` | H1 read once; "Your name" and "Email address" labels read; errors read when focus moves to a field; the result heading read after submit | **Not tested** | ☐ Pass ☐ Fail ☐ Not tested | |
| E4 | VoiceOver form messages | Same, trigger the rate limit (C7) | "Too many attempts…" is spoken without moving manually | **Not tested** | ☐ Pass ☐ Fail ☐ Not tested | |
| E5 | NVDA or VoiceOver on desktop (if available) | Same as E3 | Same | **Not tested** | ☐ Pass ☐ Fail ☐ Not tested | |

## F. Not on the Preview: needs NJEN's database and written approval

These stay **Blocked** until NJEN's Supabase inspection is back and a specific change is approved. Listed so they are not forgotten. Do not attempt them on the Preview.

| # | Check | Blocked on | Result |
|---|---|---|---|
| F1 | Real signup stored once, server timestamp and source | Inspection (Q0, Q1, Q3, Q4, Q9, Q12), approved SQL, variables on an approved project | ☐ Blocked |
| F2 | Repeat signup keeps one row | Same; expected result depends on Option A or B | ☐ Blocked |
| F3 | Vercel logs show status codes only, no names, emails or keys | Same | ☐ Blocked |
| F4 | Test row deleted afterwards | Same | ☐ Blocked |
| F5 | Consent box and stored wording | Approved wording (B6) | ☐ Blocked |

---

**Sign-off:** Preview QA is complete only when every row in A–E is Pass, or each Fail has a recorded fix and re-test. F is a separate milestone. Neither one is production launch approval.
