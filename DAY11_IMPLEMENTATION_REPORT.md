NJEN - DAY 11 IMPLEMENTATION REPORT
===================================

Date: 29-09-2026
Phase: Days 11-17 "Public launch features" (30_DAY_LAUNCH_PLAN.md) - first day
Mode: Local implementation and verification. No Git operation, no deployment, no
provider configuration, no production change of any kind.


1. DAY 11 OBJECTIVE, TAKEN FROM THE APPROVED ROADMAP
----------------------------------------------------

`30_DAY_LAUNCH_PLAN.md` does not break the month into single days. Day 11 is the
first day of the phase "Days 11-17 - Public launch features", which lists five
requirements. Those five are the Day 11 scope; nothing was invented, and nothing
from Days 18+ was started.

Each was audited against the actual code before any change was made.

  # | Roadmap requirement                                          | Status
 ---|--------------------------------------------------------------|------------------
  1 | Connect jobs index/detail to approved published records       | BLOCKED
  2 | Implement filters needed for launch (category/location/type;  | DONE TODAY
    | keep scope small)                                             |
  3 | Connect Career Center and Events/What's Filming to chosen     | BLOCKED
    | content source                                                |
  4 | Implement employer/partner intake or verified posting         | BLOCKED
    | workflow according to locked scope                            |
  5 | Add SEO metadata, sitemap/robots, social metadata,            | ALREADY DONE
    | error/not-found states                                        | (Days 4-9);
    |                                                               | extended today

Requirement 2 was the one substantial unblocked deliverable, and it is complete.
Requirement 5 was already satisfied and was extended where the new work touched
it. Requirements 1, 3 and 4 all depend on the same missing input - an NJEN-owned
Supabase project, and NJEN's approved content - and are covered in section 7.


2. WORK COMPLETED
------------------

2.1 Launch filters for the jobs board (requirement 2)
------------------------------------------------------

The jobs index previously listed every published job with no way to narrow it.
The roadmap asks for category, location and type filters, and explicitly says to
keep the scope small. That is exactly what was built: three facets, no keyword
search, no salary or date facets.

Design decisions, and why:

- FILTERING RUNS ON THE SERVER, in `lib/jobs.ts`, not in the browser. This is
  the rule the Days 4-10 work established ("Keep sorting and any future
  filtering server-side"). A filtered list comes from the same gated read as an
  unfiltered one, so a filter can only ever narrow what the Day 10 publication
  gate already permitted. It cannot widen it, and it is not a route to an
  unpublished record. That was tested, not assumed (section 4).

- THE FILTER UI IS A PLAIN GET FORM, server-rendered, with no client component
  and no JavaScript. Consequences worth stating: it works before or without
  JavaScript; every filtered view has its own shareable, bookmarkable URL; and
  the page added ZERO kilobytes of client JavaScript (First Load JS is still
  106 kB, unchanged).

- VALUES ARE ALLOW-LISTED, NOT SANITISED. A submitted value is accepted only if
  it exactly matches an option derived from the currently published jobs.
  Anything else is discarded, so an arbitrary query string can never be echoed
  back into the page. This is stricter than escaping and it fails closed.

- ONLY FACETS WITH MORE THAN ONE VALUE ARE SHOWN. A select offering a single
  choice filters nothing. The entire filter bar disappears when no facet is
  worth showing, so an empty or single-job board does not display dead controls.
  This matters directly at launch, when the board may legitimately be empty
  (register C11).

- A FILTERED VIEW IS `noindex, follow`. The same listings under a query string
  are a duplicate of `/jobs`; only the unfiltered index should be indexed. The
  job links themselves stay crawlable. This extends requirement 5.

Behaviour added to the page:
- a result count ("Showing 1 of 3 listings" when filtered, "3 listings" when not);
- a distinct empty state for "no listings match those filters", separate from the
  existing "no current listings" state for an empty board;
- a "Clear filters" link, shown only when a filter is actually active;
- an honest notice when a supplied value was not recognised and was ignored,
  rather than silently discarding it.

2.2 Live deployment verified (resolves a Day 10 open item)
-----------------------------------------------------------

Day 10 had to report the Vercel deployment as unverified, because no access had
been provided. A public URL is now available, so the deployment was verified
read-only, from the outside, with no dashboard access and no change of any kind:

  Check                                   | Result
  ----------------------------------------|----------------------------------
  `/`, `/jobs`, `/publications`            | 200
  `/events`, `/contact`                    | 404 (correctly unpublished)
  `/robots.txt`                            | 200, `User-Agent: *` `Disallow: /`
  X-Content-Type-Options                   | nosniff
  Referrer-Policy                          | strict-origin-when-cross-origin
  X-Frame-Options                          | SAMEORIGIN
  Permissions-Policy                       | present, as configured
  X-Powered-By                             | absent
  Strict-Transport-Security                | present (added by Vercel)

The deployment is live and serving the expected build: the section registry, the
404 behaviour for unpublished sections, the default-deny robots policy and all
four security headers all behave in production exactly as they do locally.

`vercel.json` (`{"framework": "nextjs"}`) is present in the repository and was
left untouched, as instructed.

What this does NOT establish, and is not claimed: which of the three Vercel
projects this URL belongs to; whether Preview deployments are protected; the
plan the account is on; or anything about the other two projects. Those still
need dashboard access (section 6).


3. FILES CHANGED
-----------------

  File                          | Change                                  | Size
  ------------------------------|-----------------------------------------|--------
  lib/jobs.ts                   | Added server-side filter layer:         | +107
                                | JOB_FILTER_KEYS, JobFilters,            |
                                | JobFilterOptions, JobsView,             |
                                | getJobsView(). Existing reads and the   |
                                | Day 10 publication gate untouched.      |
  components/JobFilters.tsx     | NEW. Server-rendered GET filter form.   | +72
  app/jobs/page.tsx             | Reads searchParams, renders the filter  | +65/-17
                                | bar, result count and filtered empty    |
                                | state; generateMetadata now marks       |
                                | filtered views noindex.                 |
  app/globals.css               | .filter-bar, .filter-heading,           | +12
                                | .filter-fields, .filter-actions,        |
                                | .result-count + two breakpoints.        |

Deleted: none. Dependencies: none added - `package.json` and
`package-lock.json` are untouched. No change to `vercel.json`, `next.config.ts`,
`lib/publish-gate.ts`, `lib/forms.ts`, `lib/sections.ts`, `data/jobs.ts`, the
database files, or any other page.

Build impact: `/jobs` moves from static to dynamic (it now reads search
parameters), which is expected and correct for a filtered index. Every other
route is unchanged. Client JavaScript is unchanged at 106 kB.


4. TEST RESULTS - ACTUALLY RUN
-------------------------------

  Command / check                                   | Result
  --------------------------------------------------|--------------------------
  npm run typecheck (tsc --noEmit, strict)          | PASS, no errors
  npm run build                                     | PASS, 24 routes, 0 warnings
  Filter behaviour over HTTP (20 assertions)        | 20 passed, 0 failed
  Hostile-input assertions, markup-only (5)         | 5 passed, 0 failed
  Authorization/gate assertions with filters (3)    | 3 passed, 0 failed
  axe-core 4.x, 3 page states x 2 viewports         | 0 violations in all 6 runs
  Responsive, 3 page states x 7 widths (21 checks)  | 0 horizontal overflow
  Keyboard reachability of filter controls          | all 3 selects reachable,
                                                    | visible focus on every
                                                    | sampled stop (40 sampled)
  Live deployment, read-only (section 2.2)          | PASS, as tabulated above

Filter behaviour covered: each facet individually; two facets combined; a
contradictory combination producing the empty state; the result count in both
filtered and unfiltered form; an unknown value being discarded with the notice
shown and all listings still returned; an over-long (200-character) value
discarded; an empty value treated as no filter rather than as a filter; an
unrelated query parameter ignored; the "Clear filters" link appearing only when
filtered; and filtered views carrying noindex.

Hostile input was tested with `<script>alert(1)</script>`, an attribute-breakout
payload (`" onfocus="alert(1)`) and a script-breakout payload
(`</script><img src=x onerror=alert(1)>`). In every case the value was rejected
by the allow-list, the selects fell back to "All", and nothing appeared in the
rendered markup.

One honest note on method. An initial, cruder assertion searched the whole
response body and reported a hit for `onfocus=`. On inspection the match was
inside Next.js's own RSC flight payload - the framework serialises the request's
search parameters into a JSON string inside a `<script>` block - where it is
JSON-escaped and `<` is encoded as `<`. The `<script` and `</script>` counts
were verified as balanced under the breakout payload, and no `onerror` or
injected tag reached the markup. The assertion was corrected to measure rendered
markup with script blocks stripped; the application code was not changed,
because it was not at fault. A second assertion of mine was also wrong - it
expected no `selected` attribute at all, when correct behaviour is
`<option value="" selected="">All</option>`, the fallback to "All". Both were
test defects, and both are recorded here rather than quietly fixed.

Axe runs covered the unfiltered index, a filtered index and the
no-matches state, at 390 px and 1440 px each.

NOT TESTED, and why:
- Real iPhone and Safari: no physical device or Safari available here. Emulation
  is not a substitute and is not being presented as one.
- Screen readers (VoiceOver, NVDA): not available in this environment.
- Vercel dashboard, build logs, Preview protection, project settings: no access.
- Supabase, Payload, email delivery: none of these exists to test.
- Lint: `npm run lint` is configured as `next lint`, which Next 15 reports as
  deprecated; typecheck and build both pass and cover the same ground here.


5. SECURITY AND BUSINESS-RULE POSITION
---------------------------------------

Preserved, and re-verified after the change:
- The Day 10 fail-closed publication gate is untouched and still applied on
  every read. Filters run after it.
- The Day 10 submission timing validation is untouched.
- Unpublished sections still 404 (verified locally and on the live site).
- An unknown job slug still 404s.
- A filter cannot reach a hidden section: `/events?category=Theater` is 404.
- No new public API route, no server action, no route handler, no persistence.
- No client-side authorization was introduced; the filter form carries no
  authority, it only narrows an already-gated list.

Business rules respected: no invented jobs, events or claims; no performer
directory; no signup, payment or post-launch feature; sample listings remain
labelled as examples and `noindex`; nothing protected or unpublished is exposed.


6. CLIENT INPUT REQUIRED
-------------------------

Genuinely new since the Day 10 message (a draft is in
`DAY11_CLIENT_MESSAGE_DRAFT.md`):

- WHICH OF THE THREE VERCEL PROJECTS IS OFFICIAL. `njen-website`,
  `njen-website-live` and `njen-website-production` all appear connected to the
  same repository. Three projects building the same branch means three
  deployments of the same code, and it will become genuinely confusing once a
  domain is attached and environment variables are set - a variable set on the
  wrong project has no effect, which is a slow and unpleasant thing to debug.
  Blocks: attaching the production domain; setting launch environment variables
  (`NJEN_SITE_URL`, `NJEN_ALLOW_INDEXING`).

- WHETHER PREVIEW DEPLOYMENTS ARE PROTECTED. Vercel Authentication is free and
  keeps staging off the public internet. Cannot be verified without access.

Still outstanding from before, unchanged (see `WEEK1_CLIENT_INPUT_REGISTER.md`):
Supabase project (D4/T1); Vercel plan confirmation and viewer access; production
domain (C13); Privacy/Terms/Accessibility wording (B6); contact destination
(C8); real job listings or approval of an empty board (C11); named staff admins
(B7); repository decision (A2a).

What continues regardless: nothing in this list blocks further front-end work on
already-approved sections.


7. INCOMPLETE DAY 11 TASKS, AND WHY
------------------------------------

  Requirement                            | Blocked by
  ---------------------------------------|--------------------------------------
  1. Jobs index/detail from approved      | Supabase project (D4/T1), then Payload;
     published records                    | plus real listings or approval of an
                                          | empty board (C11)
  3. Career Center, Events, What's        | Same, plus NJEN's approved content for
     Filming connected to content source  | those sections (C3, C4, C10)
  4. Employer/partner intake or verified  | Needs a moderation backend. The field
     posting workflow                     | definitions already exist in
                                          | `lib/forms.ts`; a public form with no
                                          | backend would be a non-functional
                                          | control, which this project has
                                          | consistently refused to ship

Requirement 2 is complete. Requirement 5 was already complete and was extended.

Preparatory work that is already done for the blocked items: the typed content
contracts, the content service seam, the publication gate, the moderated
job-submission field definitions, the CMS plan and the content mapping. When the
database arrives, the blocked requirements are wiring, not design.


8. RISKS
---------

- THREE VERCEL PROJECTS ON ONE REPOSITORY. Highest-priority item. Risk of
  environment variables or a domain being attached to the wrong project, and of
  an unprotected preview being mistaken for production. Mitigation: client
  confirms which is official; the others are paused or removed by the client.

- `/jobs` IS NOW SERVER-RENDERED. Correct for a filtered index, but it no longer
  benefits from full static caching. At this traffic level this is not a
  concern; if it ever becomes one, the unfiltered index can be cached
  separately. Recorded so it is a known choice, not a surprise.

- FILTER OPTIONS ARE DERIVED FROM THE DATA. With real CMS listings the location
  facet could grow long if locations are entered inconsistently ("Newark" vs
  "Newark, NJ"). Worth a controlled location field, or a region facet, when the
  CMS collections are built. Not a problem today with three sample listings.

- SAMPLE DATA IS STILL ON THE BOARD. Labelled and `noindex`, and it must be
  replaced before launch (register C11). This is tracked in
  `LAUNCH_QA_CHECKLIST.md` as a final pre-launch item.


9. DAY 12 NEXT ACTIONS
-----------------------

Client-side, and unblocking the most work:
1. Confirm the official Vercel project; pause or remove the other two.
2. Enable Vercel Authentication on Preview.
3. Provide the Supabase project (D4/T1) - this single item unblocks roadmap
   requirements 1, 3 and 4.

Developer-side, in order, once the above land:
4. Apply migration `0001` to a development database and verify the ARCH-1
   mitigation (the `public` schema must not be exposed through the Supabase Data
   API) BEFORE any content is entered.
5. Install Payload against the real `DATABASE_URI` and build the launch
   collections from `PAYLOAD_CMS_PLAN.md`.
6. Switch `lib/jobs.ts` to the CMS source and set `JOBS_ARE_SAMPLE_DATA = false`
   in the same change. The publication gate and the filters both continue to
   work unchanged; only the source of the records changes.

Available without any client input, if Day 12 needs front-end work: linking the
category badge on a job detail page back to its filtered listing, and a region
facet once the CMS supplies a controlled region field.


10. HONEST COMPLETION STATUS
-----------------------------

DAY 11 IS COMPLETE FOR EVERYTHING THAT IS NOT BLOCKED.

One of the five roadmap requirements was implementable today; it is implemented,
tested and verified. One was already satisfied and was extended. The remaining
three are blocked on a single client dependency - the Supabase project - plus
NJEN's approved content, and no amount of developer time moves them.

This is NOT a claim that the Days 11-17 phase is finished; it is not. It is a
claim that no unblocked Day 11 work remains on the developer's side.

Not claimed anywhere in this report: any Git operation, any deployment, any push,
any provider configuration, any iPhone/Safari/screen-reader testing, or any
inspection of the Vercel dashboard. The live-site checks in section 2.2 were
read-only HTTP requests to a public URL.

Ready for manual review and commit. Ports used during testing (3000) have been
released.
