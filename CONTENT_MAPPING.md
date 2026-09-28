# NJEN — Content Mapping

**Created 23-09-2026 (Day 7).** Maps every public area of the current site to its route, its status today, and the CMS collection that will supply it. Nothing here invents content: where NJEN's content is pending, the section stays hidden.

Companion documents: `PAYLOAD_CMS_PLAN.md` (collection design), `lib/content-types.ts` (typed contracts), `WEEK1_CLIENT_INPUT_REGISTER.md` (client dependencies), `SUPABASE_PAYLOAD_RESPONSIBILITY_MODEL.md` (data ownership).

**Day 10 verification (28-09-2026):** the CMS column below is still entirely forward-looking. Re-confirmed by inspection that **no Payload package, `payload.config.ts`, collection or database adapter exists**, and **no Supabase package, client or connection exists**. Content continues to be served through `lib/jobs.ts` and `lib/publications.ts` behind the typed contracts in `lib/content-types.ts`, so the mapping below is the swap plan, not the current wiring. Installation remains blocked on the NJEN-owned Supabase project (register D4/T1). No row in this document changed.

---

## 1. Public sections

| Section | Route | Status today | CMS collection | Required client content | Published now | Intentionally hidden | Scope |
|---|---|---|---|---|---|---|---|
| Homepage | `/` | Live; Release 1.3 copy; promotes only published sections | Resources/Articles later for any editorial blocks; jobs block reads Jobs | C2 copy corrections + approved photography; B10 hero artwork approval; B16 wording | **Yes** | No | Launch |
| Jobs | `/jobs` | Live with **labelled sample listings**; `noindex` while sample | **Jobs** | C11 verified listings (each with an application method) or approval of an empty board; B3 moderation/pay/expiry rules | **Yes** | No | Launch |
| Job detail | `/jobs/[slug]` | Live, generated per job; shows "How to apply" when the employer supplies one | **Jobs** | As C11 | **Yes** | No | Launch |
| Career Center | `/careers` | Live with client pathway copy; Shortcuts described, no price or purchase | Resources/Articles (`career-center`) | C10 pathway guides and Internship Exchange structure | **Yes** | No | Launch |
| Industry / Production | `/industry` | Live; static information only, no portal, no forms | Resources/Articles, if it becomes editable | B15 wording approval | **Yes** | No | Launch (public info only; the portal is post-launch) |
| What's Filming | `/whats-filming` | Built; returns 404 | **What's Filming** | C3 entries; B5 sources, rights and update owner | No | **Yes** | Launch |
| Events | `/events` | Built; returns 404 | **Events** | C4 listings | No | **Yes** | Launch |
| Resources (hub) | `/resources` | Built; returns 404 | Resources/Articles (`resources`) | C5 listings | No | **Yes** | Launch |
| Housing & Practical Resources | `/resources/housing` | Built; returns 404 | Resources/Articles (`housing`) | C14 curated entries with sources; B12 inclusion criteria | No | **Yes** | Launch (confirmed R1) |
| Mental Health for Artists | `/resources/mental-health` | Built; returns 404 | Resources/Articles (`mental-health`) | C15 content and vetted links; **B13 crisis wording**; B6 disclaimer | No | **Yes** | Launch (confirmed R2) |
| Children & Parents | `/children-parents` | Built; returns 404; collects no data | Resources/Articles (`children-parents`) | C6 content | No | **Yes** | Launch |
| Social Media Safety | `/social-media-safety` | Built; returns 404 | Resources/Articles (`social-media-safety`) | C7 guidance for the nine approved topics | No | **Yes** | Launch |
| Membership | `/membership` | Built; returns 404; no tiers, prices or signup | Resources/Articles | C9 explanation copy; B14 wording. Tiers/pricing are **post-launch** (B2) | No | **Yes** | Launch (information only) |
| About | `/about` | Built; returns 404 | Resources/Articles | C1 About copy | No | **Yes** | Launch |
| Contact | `/contact` | Built; returns 404; local form UI is preview-only and never sends or stores | Resources/Articles for page copy; submissions are not content | C8 contact details/enquiry owners, Resend access, B6 legal wording | No | **Yes** | Launch |
| Publications | `/publications` | Live public archive with an empty state until NJEN supplies approved issues. Linked from the header nav and footer. Public issues only: `PublicPublication.visibility` is the literal `"public"` and the service filters at runtime, so a members-only issue cannot be served, generated or indexed (members-only is post-launch and needs authentication plus server-side authorization, neither of which exists) | **Newsletter / Publications** | Approved public issues and cover media, if used | **Yes** | No | Launch; CMS-managed, no mass-email service |
| 404 page | any unknown URL | Live, `noindex`, links only to published pages | — | — | **Yes** | No | Launch |
| Error page | rendered on failure | Live; shows no error detail | — | — | **Yes** | No | Launch |

**Publishing a hidden section** is one change in `lib/sections.ts` (`published: true`) once its content exists and is approved. No page rewrite is needed.

**Post-launch areas have no route at all** and must not gain one before their phase: performer registration and directory, Industry/Production Portal, member accounts, membership checkout, crew/crafts and production-services directories, studio/set teachers, unions and guilds, CRM.

---

## 2. Jobs: CMS field mapping

How a Payload Job record maps to what the public receives (`PublicJob` in `lib/jobs.ts`). The service applies the publication rule first: **published, not scheduled in the future, not expired, not closed.**

| Payload field | Public DTO field | Used on | Public? |
|---|---|---|---|
| `title` | `title` | List, detail, metadata | Yes |
| `slug` | `slug` | URLs, static generation | Yes |
| `organization` | `organization` | List, detail | Yes |
| `location` | `location` | List, detail | Yes |
| `region` | `region` | Detail meta | Yes |
| `category` | `category` | Badges, list | Yes |
| `employmentType` | `type` | List, detail | Yes |
| `compensationMin/Max/Period` or `compensationDisplay` | `pay` (display string) | List, detail | Yes — display rules pending **B3** |
| `summary` | `summary` | Cards, meta description | Yes |
| `description` | `description` | Detail ("About the opportunity") | Yes |
| `responsibilities[]` | `responsibilities` | Detail | Yes |
| `qualifications[]` | `qualifications` | Detail | Yes |
| `applicationMethod` | `applicationMethod` | Detail ("How to apply") | Yes |
| `applicationUrl` | `applicationUrl` | Detail apply link | Yes |
| `publishedAt` | `posted` (formatted) | List, detail | Yes |
| `expiresAt` | `closingDate` | Detail meta | Yes, when supplied |
| `moderationStatus` | — | Decides inclusion | **No** |
| `closed` | — | Decides inclusion | **No** |
| `featured` | — | Ordering only | **No** |
| `source`, `sourceVerifiedAt` | — | Staff legitimacy review | **No** |
| `submittedBy` | — | Moderation queue | **No** |

**Rules that stay fixed:**
- **NJEN does not receive applications.** The detail page sends people to the employer's method and says so explicitly.
- No applicant tracking, resume storage, saved jobs, alerts or personalization at launch.
- Staff-only fields are never mapped, so they cannot appear in HTML, page props or any response.
- While `JOBS_ARE_SAMPLE_DATA` is true, listings are labelled "Example listings" and jobs pages are `noindex`; both switch off automatically with the CMS swap.

---

## 3. Media conventions

**Public editorial media (Payload Media collection)**

| Property | Rule |
|---|---|
| `alt` | Required for meaningful images; empty only for decorative ones |
| `caption` | Optional, shown with the image |
| `credit` | Required where the usage rights demand attribution |
| Filename | Lower case, hyphenated, descriptive (`ASSET_REQUIREMENTS.md`) |
| Metadata | Dimensions and file size tracked by the CMS |
| Featured usage | Hero/card images referenced by the owning record, not hard-coded in pages |
| Derivatives | Generated automatically (Next.js image optimisation); originals are preserved, never destructively resized |

Current public images (`public/njen-logo.png`, `public/whats-filming.jpg`) stay as static brand assets. Editorial images move into the CMS as NJEN supplies them (C12).

**Never in the public media library:** performer photos, verification or eligibility evidence, private member or industry documents, and the Shortcuts to Hollywood file. Those belong in **private Supabase Storage** with short-lived authorized access, post-launch (ARCH-6).

---

## 4. Forms mapping (Week 3, not built)

| Form | Where it will live | Destination | Blocked on |
|---|---|---|---|
| Contact | `/contact` | Local UI only; no sending or storage | C8 recipients, Resend access, B6 wording, server delivery/rate limiting |
| Newsletter / waitlist | Not rendered | No external subscription service at launch | No mass-email provider; future handling must use the single Publications architecture |
| Newsletter / waitlist | Not rendered at launch | No external subscription service | CMS archive is confirmed; any future form needs approved consent wording (B6) and must not create a second newsletter system |
| Job submission | Jobs area, for employers | Creates a **draft** Jobs record for staff review; nothing auto-publishes | Payload (T3), B3 moderation SOP |

The contact preview UI uses the field definitions in `lib/forms.ts` for local validation only. Real submissions require server-side validation, spam/rate protection, approved routing, and a transactional email setup. The provider-independent send contract in `lib/email.ts` has no implementation or provider connection.
