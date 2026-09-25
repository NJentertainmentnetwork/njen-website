# NJEN High-Level Database and Role Model

**Status:** Architecture only. Created 18-09-2026; updated 22-09-2026 for Business Rules Addendum v1.1. No Supabase project, production table, authentication system, migration or access policy has been created by this document.

Read with `SUPABASE_PAYLOAD_RESPONSIBILITY_MODEL.md` (who owns each record) and `MASTER_BUSINESS_RULES_ADDENDUM.md` (current business rules). Reviewed application migrations are prepared in `db/migrations/` (**not applied**); launch content collections are planned in `PAYLOAD_CMS_PLAN.md`.

**22-09-2026 changes:**
- Jobs moved from application tables to the Payload collection, removing a duplicate source of truth.
- Launch data separated from future data.
- Performer photo, pricing and payment records added.
- Membership pricing and SAG-AFTRA eligibility records added.

## Design rules

- Public pages, APIs, search results, client bundles, URLs and errors must never reveal protected data.
- Server-side authorization is authoritative; UI visibility is not permission.
- An account grants neither performer-directory nor Industry Portal access.
- A performer manages only their own profile. Industry access is explicit, verified, scoped and revocable.
- Verification, moderation and membership status are separate concepts.
- **Business values are configuration, not code.** Prices, discounts and eligibility rules live in Admin-editable, audited configuration. Transactions record the values applied at the time.

## 1. CURRENT LAUNCH DATA (30-day public launch)

All launch data is **editorial content owned by Payload CMS**, stored in PostgreSQL. No member, performer, industry or payment data exists at launch.

| Collection (Payload) | Key fields | Public exposure |
|---|---|---|
| Jobs | title, organization name, location, type, category, pay/compensation fields, description, responsibilities, qualifications, **application method/URL**, source, moderation status, published date, expiry/closing date, closed/archived state, featured | Published, current jobs only, via `lib/jobs.ts` DTOs |
| Events | title, category, date/time, location/region, description, link/registration info, featured, publish state, expiry/archive | Published only |
| What's Filming | title, type, location/region, status, source, source date, last-reviewed date, public notes, publish state | Published only |
| Resources and articles | Resources/Education, Housing, Mental Health, Children & Parents, Social Media Safety, Career Center content, featured, publish state | Published only |
| Media | public editorial images with alt text | Public by design; **never** performer or protected files |
| Staff users | Admin, Editor/Moderator; MFA for admins | Never public |

Launch forms (Week 3) — contact, newsletter/waitlist, moderated job submission — are submitted server-side with validation and rate limiting. Where they are stored is decided with the email/newsletter choice (register T5a). Job submissions enter the Jobs collection as **drafts**.

## 2. FUTURE DATA (post-launch, application schema in Supabase)

Nothing in this section exists yet. It is the target model for the post-launch phases in `POST_LAUNCH_DEVELOPMENT_ASSESSMENT.md`.

### 2.1 Identity and organizations

| Area | Core records | Relationship and boundary |
|---|---|---|
| Identity | `users` (Supabase Auth), `profiles`, `role_assignments` | One user has one profile. Roles are capability assignments, not a public profile field. Staff privilege stays separate from member or industry access. |
| Organizations | `organizations`, `organization_members` | An organization has many members; each membership has its own role and lifecycle. |
| Verification | `verification_cases`, `verification_evidence`, `verification_decisions` | Records subject, type (**industry organization**, **industry user**, **SAG-AFTRA eligibility**), reviewer, status, expiry, revocation and reasons. Evidence is a private-storage reference only. |
| Industry access | `industry_access_grants`, `organization_access` | Grants identify user, optional organization, scope, approver, expiry and revocation. **No directory-access fee** for qualified, verified industry users (Addendum 1.1-B). |

### 2.2 Background performer system

| Record | Purpose | Key fields |
|---|---|---|
| `performer_profiles` | Profile identity and **ownership** | owner user id (unique), status, verification status, moderation status, visibility to industry directory, created/updated |
| `performer_profile_fields` | Approved searchable/display fields | Final fields are an OPEN owner decision; stored so the list can change without a schema rebuild |
| `performer_consents` | Consent and privacy status | consent type, version accepted, date, withdrawn date |
| `performer_guardians` | Guardian model for minors | Required before minor profiles are activated; rules OPEN |
| `performer_photos` | Every photo | profile id, storage reference (private bucket), **slot type: included or additional**, moderation status, reviewer, order, created/removed |
| `performer_photo_allowance` | How many photos a profile may hold | included count (from configuration; currently **2**), purchased additional count |
| `photo_purchases` | Each paid additional photo | profile id, quantity, **unit price charged (snapshot)**, currency, pricing-config version, payment reference, status (pending/paid/failed/refunded) |

**Rule:** a performer can upload an additional photo only when the allowance permits. The allowance increases only after the payment provider **confirms** payment through a server-side webhook, never on the browser's word.

### 2.3 Membership, pricing and eligibility

| Record | Purpose | Key fields |
|---|---|---|
| `membership_plans` | Regular/non-union plans | name, billing interval, **base price**, active, effective dates |
| `pricing_config` | Admin-configurable business values | key (e.g. `additional_photo_price`, `performer_included_photos`), value, currency, effective from, changed by. **Current values: additional photo $25; included photos 2.** |
| `discount_rules` | Configurable discounts | rule name (e.g. **SAG-AFTRA**), **percentage (currently 40%)**, applies to (comparable regular/non-union plan), required eligibility type, active, effective dates |
| `eligibility_verifications` | SAG-AFTRA and future eligibility checks | user, eligibility type, **method** (OPEN — e.g. staff review of evidence), evidence reference (private storage), status (pending/verified/rejected/expired/revoked), reviewer, verified date, **expiry/re-check date** |
| `memberships` | A member's membership | user, plan, status, start/renewal/end, applied discount rule (if any) and the eligibility record it relied on |
| `entitlements` | What a membership grants | e.g. Shortcuts to Hollywood access; source (membership or separate purchase) |
| `pricing_audit` | History of configuration changes | who, what, old value, new value, when |

**Rules:**
- A discount applies only when the linked eligibility record is **verified and current**. A user-selected checkbox never qualifies (Addendum 1.1-C).
- Prices are computed on the server from `membership_plans` + `discount_rules` + eligibility at checkout time, then **snapshotted** on the transaction.

### 2.4 Payments and operations

| Record | Purpose | Boundary |
|---|---|---|
| `payment_references` | Provider transaction/checkout/subscription ids, amount, currency, status, receipt reference, idempotency key | **No card data is ever stored**; the payment provider (T10, post-launch) holds it |
| `receipts` | Receipt number/reference and status per payment | Visible to the paying user and authorized staff only |
| `audit_records` | Append-only audit of privileged, security-relevant, verification, moderation and pricing actions | Never public |
| `file_references` | Metadata for private storage objects | Short-lived signed access only |
| `saved_jobs`, `applications`, `notifications`, CRM records | Future member/industry activity | Visible only to their owner and authorized staff; reference Payload job ids |

`db/schema.sql` is a useful Release 1.3 reference, but not the target schema. Before production data is introduced, it must be reconciled with this model and the Payload collections, then converted into reviewed, versioned migrations for the app schema only.

## Lifecycle separation

| Lifecycle | Examples | Must not imply |
|---|---|---|
| Account | invited, active, suspended, closed | verified industry access |
| Verification | unverified, pending, verified, rejected, revoked, expired | publication or staff privilege |
| Eligibility (e.g. SAG-AFTRA) | pending, verified, rejected, expired, revoked | industry access or staff privilege |
| Content moderation | draft, in review, published, rejected, archived | organization verification |
| Photo moderation | pending, approved, rejected, removed | payment status |
| Payment | pending, paid, failed, refunded | verification or moderation |
| Industry access | requested, granted, expired, revoked | general member access |
| Job availability | draft, published, closed, expired, archived | an application workflow |

## Permission model

| Role | Access and owned data | May edit | Cannot access | Boundary |
|---|---|---|---|---|
| Guest | Published public content | Nothing | Accounts, profiles, directories, moderation, admin | Public only |
| Registered Member | Own account, membership, eligibility status and approved member features | Own account and saved items when launched | Other members, performer directory, Industry Portal | Protected; an account alone grants no directory access |
| Background Performer | Own performer profile, photos, allowance, purchases and receipts | Own profile, photos, consents, permitted fields | Other performers, the performer directory, industry search, staff records | Protected; server-side ownership check |
| Production / Industry User | Approved Industry Portal scopes, including the performer directory (no access fee) | Permitted organization membership details | Data outside granted scope; staff data; payment records | Protected; active verification and grant required |
| Production Company / Organization | Organization jobs and permitted workflows | Authorized organization records; job submissions (drafts) | Other organizations' private records; unrestricted directories | Protected; verified organization and member authorization |
| Service Provider | Approved listing workflows | Own organization submissions | Performer/industry data unless separately authorized | Protected; no automatic industry access |
| Editor / Moderator | Assigned CMS collections, moderation queues and photo review | Assigned content and moderation decisions | Credentials, payments, pricing config, security settings, unassigned private data | Protected staff role; least privilege |
| Admin | Operations, pricing configuration and assigned audits | Content, roles, verification, **pricing/discount/eligibility configuration**, within policy | Superadmin infrastructure and break-glass controls | Protected; MFA and audit logging |
| Superadmin | System configuration and emergency administration | Privileged configuration under change control | Unnecessary routine private-data access | Protected; minimal membership, MFA, audited use |

## Enforcement approach when implemented

1. Resolve the authenticated user and active roles on the server.
2. Check capability and record relationship for every protected read or write.
3. Apply reviewed Row Level Security to data in any schema exposed to the Supabase Data API. Service credentials remain server-only. **Do not leave CMS or application tables in an exposed schema without RLS** (decision ARCH-1).
4. Use private storage and short-lived, authorized file access for photos and evidence.
5. Compute prices and discounts only on the server, from configuration. Confirm payments only through verified provider webhooks, with idempotency.
6. Test denial paths for: guest; cross-account; performer-to-performer; unverified industry; expired/revoked grant; expired SAG-AFTRA eligibility; unpaid additional photo; editor, admin and superadmin.

## Public versus protected query boundary

**Public queries** may return only:
- approved, published, current jobs;
- published events, What's Filming entries, resources and articles;
- public Industry / Production information —

each through explicit public fields.

**Protected queries** remain server-side, and must never reach route parameters, autocomplete, static data, page props, API errors or client bundles. They include:
- member, performer, eligibility and industry records;
- verification evidence;
- internal moderation and audits;
- private contacts;
- CRM records;
- private files;
- pricing configuration;
- payment and membership references.
