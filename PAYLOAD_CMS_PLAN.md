# NJEN — Payload CMS Plan (launch content)

**Status: PLANNED — NOT IMPLEMENTED.** 23-09-2026. Payload is **not installed**, no package was added, no Payload Cloud account exists, and no collection has been created. This is the Week 2 implementation plan, written locally so setup is quick once NJEN provides Vercel and Supabase access (register D2, D4, T3).

**Why Payload is not installed yet (evaluated 23-09-2026).** Payload 3 runs inside the Next.js app and its PostgreSQL adapter needs a reachable database to generate the admin routes and run its migrations. With no Supabase project available, installing it would (a) risk breaking the currently green production build, and (b) add several hundred packages that could not be verified against a real database. Installation therefore happens in Week 2, in the same change as the database connection. The preparation that does not need a database has been done instead: typed public contracts in `lib/content-types.ts`, the jobs service seam in `lib/jobs.ts`, the field mapping in `CONTENT_MAPPING.md`, and the migration boundary in `db/migrations/`.

Boundary (from `SUPABASE_PAYLOAD_RESPONSIBILITY_MODEL.md`): **Payload owns editorial content and staff publishing. Supabase owns future application/member/private data.** No record type has two owners.

---

## 0. Typed contracts already in the repository

| Contract | File | Covers |
|---|---|---|
| Public job DTO and publication rules | `lib/jobs.ts` | Jobs (the live seam, currently serving sample data) |
| Public content contracts | `lib/content-types.ts` | Events, What's Filming, Resources/Articles, Media, shared workflow states and the `ContentService` shape |
| Field-level CMS mapping | `CONTENT_MAPPING.md` | Which Payload field feeds which public field, and which fields stay staff-only |

These are types and documentation only: no data source, no runtime code, nothing rendered.

## 1. Launch collections

Only what the 30-day launch needs. No performer, member, industry, membership or payment collections — those are post-launch and belong to the application schema, not the CMS.

### Jobs
The launch job board (Business Rules §4). One source of truth; the public site reads it through `lib/jobs.ts`.

| Field | Type | Notes |
|---|---|---|
| `title` | text, required | |
| `slug` | text, required, unique | Detail page URL; generated from the title, editable |
| `organization` | text, required | Employer/production name |
| `category` | select | Managed as a list staff can extend without code |
| `location` | text | Display location, e.g. "Jersey City, NJ" |
| `region` | select | North Jersey, Central Jersey, South Jersey, The Shore |
| `employmentType` | select | Full-time, Part-time, Contract, Internship, Entry-level |
| `compensationMin` / `compensationMax` / `compensationPeriod` | number / number / select | Optional; display rules pending register **B3** |
| `compensationDisplay` | text | Optional free-text alternative, e.g. "$22–$26/hour" |
| `summary` | textarea, required | Card and meta description |
| `description` | rich text | Full detail |
| `responsibilities` / `qualifications` | array of text | |
| `applicationMethod` | textarea | How to apply, in the employer's words |
| `applicationUrl` | text (URL) | The employer's own application link |
| `source` | text | Where the listing came from — **staff-only, never public** |
| `sourceVerifiedAt` | date | Staff-only; legitimacy review (Business Rules §4) |
| `submittedBy` | text/relationship | Staff-only; for moderated submissions |
| `moderationStatus` | select | draft, in review, published, rejected, archived |
| `publishedAt` | date | |
| `expiresAt` | date | Closing date; automatic expiry where known |
| `closed` | checkbox | Manual close before expiry |
| `featured` | checkbox | |

**Public rule:** a job is returned only when `moderationStatus = published`, `expiresAt` is in the future or empty, and `closed` is false. Staff-only fields are never mapped into `PublicJob`.

**NJEN does not take applications.** The detail page directs users to the employer's method. No applicant tracking, no resume storage (Business Rules §3).

### Events
Business Rules §12: `title`, `slug`, `category`, `startsAt`, `endsAt`, `venue`, `location`, `region`, `description`, `registrationUrl`, `featured`, `moderationStatus`, `publishedAt`, `expiresAt`/archive.

### What's Filming / Studio Watch
Business Rules §5: `title`, `productionType`, `location`/`region`, `status`, `source`, `sourceDate`, `lastReviewedAt`, `publicNotes`, `moderationStatus`, `publishedAt`.
Rules: no sensitive production details, private addresses, call-sheet information or unverified rumours. Nothing may imply NJEN represents, produces or is affiliated with a project.

### Resources / Articles
One collection with an `area` field, covering the launch information sections: Resources/Education, Housing & Practical Resources, Mental Health for Artists, Children & Parents, Social Media Safety, Career Center.

`title`, `slug`, `area`, `summary`, `body` (rich text), `externalLinks` (label, URL, source, checked date), `moderationStatus`, `publishedAt`, `lastReviewedAt`, `featured`.

Notes: Mental Health entries stay blocked until the crisis-information decision (register **B13**); Housing entries follow the inclusion criteria (**B12**); both are curated information, not marketplaces or directories.

### Newsletter / Publications
One editorial collection provides the public archive now and supports future member-only issues without a second system.

`title`, `slug`, `summary`, `content` (rich text), `visibility` (`public` or `members-only`), `moderationStatus`, `publishedAt`, `expiresAt`, `archived`, `featured`, `coverMedia`, `createdAt`, `updatedAt`.

**Launch public rule:** only records that are published, current, and `visibility = public` reach the public content service. `members-only` records must not be returned by public queries, generated as static pages, rendered, or indexed. Member authentication and authorization remain post-launch. This is editorial publication, not a mass-email campaign system; no email marketing provider is needed.

### Media
`file`, **`alt` (required for meaningful images)**, `caption`, `credit`, `usageRights`.

**Public editorial images only.** Performer photos, verification evidence and the Shortcuts book are private files in Supabase Storage and must never be uploaded here (ARCH-6).

### Users (staff)
`email`, `name`, `role` (see below). Payload provides authentication for staff. Administrator MFA needs a reviewed plugin (`TECHNICAL_RECOMMENDATIONS.md` §2).

---

## 2. Staff workflow

```
Draft ──► Review ──► Publish ──► (Feature)
                        │
                        ├──► Schedule (publishedAt in the future)
                        ├──► Expire (expiresAt reached, or staff close)
                        └──► Archive
```

- **Draft:** not public, editable by Editors.
- **Review:** submitted for an Editor/Moderator or Admin decision. Public and employer submissions always land here; **nothing publishes automatically** (Business Rules §4).
- **Publish:** visible publicly from `publishedAt`.
- **Feature:** ordering/promotion flag; no separate state.
- **Schedule:** a future `publishedAt`. Payload supports scheduled publishing; if the deployment can't run the scheduling job reliably, the fallback is that the public query simply ignores future `publishedAt` values. Confirmed at implementation.
- **Expire:** automatic when `expiresAt` passes; staff can expire or close early. **Expired jobs never appear active** (Business Rules §14).
- **Archive:** kept for the record, out of public queries. Records are archived rather than deleted so future references stay valid.

Versions and drafts stay enabled, giving an edit history for content decisions.

---

## 3. Roles

| Role | Can | Cannot |
|---|---|---|
| **Admin** | Everything editorial: manage collections, publish, feature, expire, archive, manage staff users and roles | Access application/member data (it isn't in Payload); bypass audit |
| **Editor / Moderator** | Create and edit assigned collections, move items through review, moderate submissions, upload media | Manage staff users or roles, change site configuration, or publish where NJEN requires Admin approval |

- Named people are a client dependency (register **B7**).
- No shared accounts; MFA for administrators (Business Rules §14).
- Staff identity stays separate from future member identity (ARCH-4).

---

## 4. Implementation steps for Week 2 (not started)

1. Add Payload and its PostgreSQL adapter to the app (requires D2 and D4).
2. Apply **ARCH-1** at setup: keep Payload's tables out of the Supabase Data API.
3. Define the collections above, with access control defaulting to "published only" for public reads.
4. Run Payload's own migrations; keep them separate from `db/migrations/` (ARCH-2).
5. Point `lib/jobs.ts` at Payload, mapping to `PublicJob`, and set `JOBS_ARE_SAMPLE_DATA = false`. The "Example listings" labels and `noindex` then switch off automatically.
6. Repeat for Events, What's Filming and Resources as their content arrives, publishing each section in `lib/sections.ts` only when NJEN's content is approved.
7. Create staff accounts (B7) and enable admin MFA.
8. Re-run the security checks in `LAUNCH_QA_CHECKLIST.md`, including the ARCH-1 verification.

## 5. Explicitly out of scope for the CMS

Performer profiles and photos, the performer directory, industry portal and verification, member accounts, membership pricing and eligibility, payments and receipts, CRM records. All are post-launch, and all belong to the application schema in Supabase, not to Payload.
