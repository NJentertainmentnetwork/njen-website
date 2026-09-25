# NJEN — 30-Day Public Launch QA Checklist

**Created 22-09-2026.** A single list of launch QA requirements, including those NJEN restated on 22-09-2026. Every item is a **launch requirement**. The status shows honestly where each one stands.

| Status | Meaning |
|---|---|
| **CURRENTLY COMPLETE** | Done and verified on the current local build (method stated). Items marked † must be **re-run** at final pre-launch. |
| **PENDING** | Not done yet; not blocked by infrastructure |
| **POST-INFRASTRUCTURE** | Needs staging, database/CMS, domain or provider accounts first |
| **FINAL PRE-LAUNCH** | Must be performed on the production candidate immediately before launch |

Nothing marked PENDING, POST-INFRASTRUCTURE or FINAL PRE-LAUNCH has been performed.

## 1. Devices, browsers and accessibility

| Requirement | Status | Evidence / next step |
|---|---|---|
| Responsive layout at 320, 375, 390, 414, 768, 1024, 1440 px | **CURRENTLY COMPLETE** † | Headless Chrome device emulation; re-verified Day 9 (25-09-2026) across 63 page/width combinations including Publications and the contact form: no overflow or clipping. **Emulation only.** |
| **Real iPhone testing** | **PENDING** → FINAL PRE-LAUNCH | Not yet performed. Test on a physical iPhone against staging, then production. |
| **Safari testing** (iOS and macOS) | **PENDING** → FINAL PRE-LAUNCH | Not yet performed. Needs Safari on real devices. |
| Automated accessibility scan | **CURRENTLY COMPLETE** † | axe-core 4.13; re-verified Day 9 (25-09-2026): 0 violations across 18 page/viewport runs, plus 0 on the contact form at desktop and mobile. |
| **Keyboard accessibility** | **CURRENTLY COMPLETE (partial)** † | Day 4: homepage tab order, skip link first, visible focus on every stop. A full-site keyboard pass with final content is FINAL PRE-LAUNCH. |
| **Screen-reader testing** (VoiceOver on iOS/macOS; NVDA on Windows) | **PENDING** → FINAL PRE-LAUNCH | Not yet performed. |
| Colour contrast (WCAG AA) | **CURRENTLY COMPLETE** † | axe plus a manual gradient review, Day 4. Re-check with final photography. |

## 2. Search engines and metadata

| Requirement | Status | Evidence / next step |
|---|---|---|
| Unique page titles and descriptions | **CURRENTLY COMPLETE** † | Day 4 metadata audit |
| Unpublished sections return 404 and are not linked | **CURRENTLY COMPLETE** † | Day 4: 10 hidden sections 404, even with indexing enabled |
| Sample job pages `noindex` | **CURRENTLY COMPLETE** | Automatic while `JOBS_ARE_SAMPLE_DATA` is true |
| **Staging remains no-index** | Mechanism **COMPLETE**; verification **POST-INFRASTRUCTURE** | `robots.txt` disallows everything by default (tested locally). On real staging, confirm Vercel Authentication protection, `robots.txt`, and Vercel's preview noindex header. |
| **Production is properly indexable at launch** | **FINAL PRE-LAUNCH** | Set `NJEN_ALLOW_INDEXING=true` in **production only**; confirm `robots.txt` allows crawling and real published pages carry no `noindex`. |
| **Canonical URLs** | **POST-INFRASTRUCTURE** | Needs the production domain (register C13) |
| **Sitemap** | **POST-INFRASTRUCTURE** | Needs the domain and published Payload content. Must list only published pages. |
| **Open Graph / social metadata** | **POST-INFRASTRUCTURE** | Needs the domain and an approved 1200×630 image (C12) |

## 3. Content integrity

| Requirement | Status | Evidence / next step |
|---|---|---|
| **No sample/demo jobs in production** | **FINAL PRE-LAUNCH** | Jobs come from Payload; `JOBS_ARE_SAMPLE_DATA` set to false; `data/jobs.ts` no longer read (the demo API was removed on 23-09-2026); either real verified jobs or the approved empty board (C11). |
| No placeholder or inert controls on public pages | **CURRENTLY COMPLETE** † | Day 4: 0 `href="#"`, 0 inert buttons, all internal links 200 |
| Broken-link check with final content | **FINAL PRE-LAUNCH** | Full crawl of production candidate |
| Legal/policy pages approved (Privacy, Terms, Accessibility) | **POST-INFRASTRUCTURE** | Needs NJEN wording (B6) |

## 4. Security and privacy

| Requirement | Status | Evidence / next step |
|---|---|---|
| **No secrets or API keys in client-side bundles** | **CURRENTLY COMPLETE** † | Day 4 scan of `.next/static`: no keys, no `process.env`, no environment-variable names. **Repeat on the final build** after providers are connected. |
| **No protected information in public APIs** | **CURRENTLY COMPLETE** † for the current code | **No public API routes exist**: the unused demo `/api/jobs` was removed on 23-09-2026. **Re-check after Payload/Supabase connection**, including any route Payload adds. |
| **No private performer information publicly exposed** | **CURRENTLY COMPLETE** † | No performer data exists (post-launch). Portal/directory probe paths 404. Re-verify at final pre-launch. |
| **No private industry information publicly exposed** | **CURRENTLY COMPLETE** † | Industry page is static and informational; portal probe paths 404 |
| Error pages leak no details | **CURRENTLY COMPLETE** † | Day 4: forced error with a fake secret — nothing leaked |
| **Final security review after database/CMS/infrastructure connection** | **POST-INFRASTRUCTURE** | Must include:<br>• **ARCH-1** — Payload tables not reachable through the Supabase Data API; RLS on any exposed table.<br>• Service-role key and connection string server-only.<br>• Payload admin protected by admin MFA.<br>• `NJEN_PREVIEW_UNPUBLISHED` absent in production.<br>• Staging isolated from production data. |
| Forms: server-side validation, spam protection, rate limiting | **POST-INFRASTRUCTURE** | Week 3 (needs Resend) |
| **Final authentication/authorization review once future systems are implemented** | **POST-LAUNCH** (per phase) | Before each post-launch phase goes live, run denial tests: guest, cross-account, performer-to-performer, unverified/expired industry, expired SAG-AFTRA eligibility, unpaid additional photo, editor/admin/superadmin. |

## 5. Operations

| Requirement | Status | Evidence / next step |
|---|---|---|
| **Backup/restore verification** | **POST-INFRASTRUCTURE** | Configure Supabase backups (T8), then **perform and document a restore test**. Configuration alone does not count. |
| **Monitoring verification** | **POST-INFRASTRUCTURE** | Sentry receives a deliberate test error; alerts reach named NJEN owners; personal-data scrubbing on |
| **Error reporting verification** | **POST-INFRASTRUCTURE** | Server and client errors both reported; the error page stays generic for visitors |
| Analytics verification | **POST-INFRASTRUCTURE** | Plausible records pageviews; no cookies set |
| Email deliverability | **POST-INFRASTRUCTURE** | Resend sending domain verified on NJEN DNS |
| Production deployment, domain and SSL, rollback plan | **FINAL PRE-LAUNCH** | Documented and rehearsed |
| NJEN ownership of all accounts, and recovery access | **FINAL PRE-LAUNCH** | Confirm every provider account is NJEN-owned (see `INFRASTRUCTURE_AND_COST_ASSESSMENT.md`) |
