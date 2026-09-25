# NJEN — Infrastructure and Cost Assessment

**Prepared 22-09-2026. Status: planning document — no account has been created and nothing is connected.**

## Pricing notice

Prices were **re-verified on each provider's official pricing page on 22-09-2026**. The exception is Payload's hosted offering, taken from Payload's official site on 17-09-2026.

**All figures are approximate estimates in USD, exclude tax, and can change at any time.** Usage-based charges can exceed base prices. **This is not a quote.** Where a figure could not be verified, it is marked *not verified*.

This document supersedes the cost figures in `TECHNICAL_RECOMMENDATIONS.md`. That document remains the record of *why* each provider was chosen. The approved directions are in register R6: Supabase, Payload, Vercel, Resend, Plausible, Sentry; the newsletter provider is open.

---

## 1. Ownership model (applies to every provider)

**NJEN owns and controls:**
- the GitHub organization and repository;
- the Vercel production account;
- the Supabase organization and project;
- the Payload deployment and configuration (inside NJEN's repository and Vercel project);
- the domain and DNS;
- all production data;
- all credentials;
- storage, email infrastructure, analytics, monitoring and backups;
- any future payment account.

**The developer receives only the access needed to do the work**, by invitation to NJEN's accounts.

**Never:**
- sharing passwords;
- a developer or personal account as the permanent owner of production infrastructure;
- production secrets stored in Git.

Secrets live only in the hosting provider's encrypted environment settings, and service-role keys never reach the browser.

```
NJEN GitHub Organization  (NJEN = Owners, 2+ people, 2FA)
      ↓
NJEN private repository
      ↓
Developer = Write access   (cannot delete, transfer, change visibility or manage access)
```

See `GITHUB_ACCESS_CHECKLIST.md` for step-by-step setup.

---

## 2. Provider comparison

### GitHub — source code and change history
| Item | Detail |
|---|---|
| Purpose | NJEN-owned repository, change history, code review; later CI |
| Launch requirement | **Yes — required now** (register A2/D1/D7, P0) |
| Post-launch requirement | Yes — continuing development and handoff |
| Recommended plan | **Free** organization to start. **Team** once branch protection is wanted (protected branches on private repos need Team). |
| Initial cost | $0 |
| Expected monthly cost | Free: $0. Team: **$4 per user/month "for the first 12 months"** as shown on GitHub's pricing page (price after 12 months *not verified*); ≈ $8/month for 2 users. |
| What increases cost | More users on Team; Actions minutes beyond the Free allowance of 2,000/month for private repos |
| NJEN ownership | NJEN creates the organization; 2+ NJEN Owners with 2FA |
| Developer access | **Write** role on the one repository |
| Simpler/cheaper alternative | Stay on Free (no private-repo branch protection) |
| Lock-in | Low — Git history is fully portable |
| Required before launch? | **Yes (now)** — blocks staging and handoff |
| Configurable after launch? | The plan can be upgraded at any time |

### Vercel — hosting, staging and production
| Item | Detail |
|---|---|
| Purpose | Builds and hosts the Next.js app (including Payload admin); preview/staging and production environments |
| Launch requirement | **Yes** — Week 1 staging demo and production (A3, D2, P0) |
| Post-launch requirement | Yes |
| Recommended plan | **Pro.** The free Hobby plan is for personal, non-commercial use only, so it isn't allowed for NJEN. |
| Initial cost | $0 setup |
| Expected monthly cost | **$20 per developer seat/month**, including $20 of usage credit; viewer seats unlimited and free. ≈ **$20/month** with one developer seat. |
| Staging protection | **Vercel Authentication** protects preview/staging deployments **with no paid add-on**; NJEN reviewers use free viewer seats. Password Protection is optional at **$20 per project/month** — not required. |
| What increases cost | Additional developer seats; traffic/compute beyond the included credit; optional Password Protection |
| NJEN ownership | NJEN-owned team, billing and domains |
| Developer access | Team member with developer permissions (not Owner) |
| Simpler/cheaper alternative | Netlify or another Node host (similar cost; migration work); self-hosting (more operational burden) |
| Lock-in | Low–medium — standard Next.js is portable; Vercel-specific settings would need replacing |
| Required before launch? | **Yes** |
| Configurable after launch? | Seats and add-ons can change at any time |

### Supabase — PostgreSQL database (plus future auth and private storage)
| Item | Detail |
|---|---|
| Purpose | Launch: the PostgreSQL database that stores Payload content. Post-launch: member auth, application data, private file storage. |
| Launch requirement | **Yes** — database for the CMS and real jobs (D4, P0) |
| Post-launch requirement | Yes — auth, performer, membership, portal and payment records, private photos |
| Recommended plan | **Pro** for staging and production. Free only for local experiments: free projects **pause after 1 week of inactivity**, limit 2 active projects, **no backups**. |
| Initial cost | $0 setup |
| Expected monthly cost | **$25/month** (Pro), including $10/month compute credit (one Micro instance), 8 GB database disk, 100,000 auth monthly active users, 100 GB file storage, 250 GB egress, 100 origin images for image transformations, and **daily backups kept 7 days**. **Spend caps are on by default.** |
| What increases cost | Disk over 8 GB ($0.125/GB); storage over 100 GB ($0.0213/GB); egress over 250 GB ($0.09/GB); auth users over 100,000 ($0.00325 each); image transformations over 100 origin images ($5 per 1,000); larger compute; **point-in-time recovery $100/month per 7 days' retention** (optional, T8); Team plan $599/month only if compliance reports are required |
| NJEN ownership | NJEN-owned organization and project, billing, backups |
| Developer access | Organization member below Owner |
| Simpler/cheaper alternative | Neon (PostgreSQL only — no auth/storage, so later phases would need more vendors) |
| Lock-in | Low for PostgreSQL data; medium once Auth, Storage and RLS are used |
| Required before launch? | **Yes** |
| Configurable after launch? | PITR, compute size and plan can change later |

### Payload CMS — content management and staff admin
| Item | Detail |
|---|---|
| Purpose | Staff create, edit, review, publish, feature, expire and archive launch content (jobs, events, What's Filming, resources) without developer or database work |
| Launch requirement | **Yes** — Business Rules §3 and §14 (T3, P0) |
| Post-launch requirement | Yes — content keeps growing; may host restricted admin views |
| Recommended plan | **Self-hosted open source (MIT licence)** inside the NJEN Next.js app on Vercel, storing content in Supabase PostgreSQL. Payload's own hosted service currently limits new projects to Enterprise teams (payloadcms.com, 17-09-2026). |
| Initial cost | $0 licence |
| Expected monthly cost | **$0** for Payload itself. It runs on the Vercel and Supabase costs above. |
| What increases cost | Only indirectly: more database size, media storage and compute on Supabase/Vercel |
| NJEN ownership | Configuration and content models live in NJEN's repository; content lives in NJEN's database |
| Developer access | Staging admin account; production access by least privilege |
| Simpler/cheaper alternative | None cheaper. Hosted CMSs (e.g. Sanity) would add a vendor and put content in their cloud. |
| Lock-in | Medium — collections, admin UI and rich text would need translation to another CMS |
| Required before launch? | **Yes** |
| Configurable after launch? | Collections and roles can grow over time |

### Resend — transactional email
| Item | Detail |
|---|---|
| Purpose | Contact/submission notifications at launch; account emails post-launch |
| Launch requirement | **Yes** — Week 3 forms (D5/T5, P1) |
| Post-launch requirement | Yes — account, receipt and notification emails |
| Recommended plan | **Free** at launch: 3,000 emails/month, max 100/day, 3 domains. Upgrade when volume requires. |
| Initial cost | $0 |
| Expected monthly cost | Launch: **$0**. Pro: **$20/month** for 50,000 emails. Scale: from **$90/month** for 100,000. |
| Newsletter | **OPEN (T5a).** Resend's marketing email is free up to 1,000 contacts, then from **$40/month** for 5,000 contacts. A dedicated newsletter tool is the alternative (*not priced here*). |
| What increases cost | Email volume above the plan; daily limit on Free; newsletter contact count |
| NJEN ownership | NJEN-owned account and sending domain (DNS records on NJEN's domain) |
| Developer access | Team member; API keys created by NJEN and stored only in Vercel environment settings |
| Simpler/cheaper alternative | Postmark or Amazon SES (SES is cheaper at high volume but needs more setup) |
| Lock-in | Low — one server-side email module |
| Required before launch? | **Yes** (forms need it) |
| Configurable after launch? | Plan upgrades at any time |

### Sentry — error monitoring
| Item | Detail |
|---|---|
| Purpose | Production error reporting and alerting — "monitoring/error reporting is active" is a launch acceptance rule (Business Rules §20) |
| Launch requirement | **Yes** — by Week 3/4 (D6/T7, P1) |
| Post-launch requirement | Yes |
| Recommended plan | **Team** once NJEN staff need to see errors. The free Developer plan is limited to **one user**. |
| Initial cost | $0 |
| Expected monthly cost | Developer: **$0** (1 user, 5,000 errors, 30-day history). Team: **$26/month billed annually** (unlimited users, 50,000 errors, up to 90-day history; monthly-billing price *not shown*). |
| What increases cost | Error/event volume above plan; more uptime monitors ($1.00 per additional uptime alert); Business plan ($80/month annually) |
| NJEN ownership | NJEN-owned organization and alert rules |
| Developer access | Organization member |
| Simpler/cheaper alternative | Stay on Developer (NJEN would lack access); self-hosted open-source alternatives (more operational work) |
| Lock-in | Low — one SDK initializer |
| Required before launch? | **Yes** |
| Configurable after launch? | Plan changes at any time |

### Plausible — privacy-friendly analytics
| Item | Detail |
|---|---|
| Purpose | Cookieless visitor analytics ("no need for cookie banners"), suitable for a site used by families |
| Launch requirement | Recommended at launch ("analytics as approved", D6/T6, P1) |
| Post-launch requirement | Yes |
| Recommended plan | **Starter** |
| Initial cost | $0 |
| Expected monthly cost | Starter **$9/month** (up to 10,000 pageviews, 1 site); Growth **$14/month** (up to 3 sites); Business **$19/month** (up to 10 sites). Annual billing gives 2 months free. |
| What increases cost | Traffic above the pageview tier (higher-traffic tier prices *not captured*); more sites |
| NJEN ownership | NJEN-owned account |
| Developer access | Team member for setup |
| Simpler/cheaper alternative | Vercel Web Analytics (50,000 events/month included with Vercel, but data stays in Vercel); self-hosted Plausible Community Edition |
| Lock-in | Low — one script/adapter; history may not transfer |
| Required before launch? | Recommended, so launch traffic is measured; can be added right after launch |
| Configurable after launch? | Yes |

---

## 3. 30-DAY LAUNCH COSTS (estimate)

| Provider | Plan at launch | Monthly estimate |
|---|---|---:|
| GitHub | Free (or Team for 2 users) | $0 – $8 |
| Vercel | Pro, 1 developer seat; staging protected by Vercel Authentication | $20 |
| Supabase | Pro | $25 |
| Payload | Self-hosted (MIT) | $0 |
| Resend | Free | $0 – $20 |
| Sentry | Developer → Team when NJEN needs access | $0 – $26 |
| Plausible | Starter / Growth | $9 – $14 |
| **Total** | | **≈ $54 – $113 per month** |

- **Optional at launch, not included above:**
  - Supabase point-in-time recovery: $100/month per 7 days (T8).
  - Vercel Password Protection: $20/project/month (not needed).
  - Newsletter above 1,000 contacts: from $40/month on Resend, or an alternative tool.
- **Not included:** domain registration/renewal (registrar-dependent) and any paid add-ons NJEN chooses.
- **One-time costs:** no setup fees were listed by these providers.

## 4. POST-LAUNCH COSTS (cost factors — no estimate until each phase is scoped)

| Driver | Phase | Provider cost factor |
|---|---|---|
| Member accounts | A | Supabase auth users above 100,000 at $0.00325 each; Resend volume for account emails |
| Paid membership, additional photos, Shortcuts purchases, paid events | A, E, I | **Payment provider fees** (provider not chosen, T10 — not priced); tax handling |
| Performer photos | B, E | Supabase storage above 100 GB, egress above 250 GB, image transformations above 100 origin images ($5 per 1,000); possibly a file-scanning service (not chosen) |
| Industry directory usage | C, D | Database compute size; audit/log storage |
| Growth in traffic and errors | All | Vercel usage above the included credit; Plausible pageview tier; Sentry event volume |
| Backups and compliance | All | Point-in-time recovery ($100/month per 7 days); Supabase Team ($599/month) only if compliance reports are required |
| SAG-AFTRA and industry verification | A, C | Mostly staff time; any third-party verification service (not chosen) |
| More developers | All | Vercel developer seats ($20 each); GitHub Team seats |

## 5. How Payload and Supabase work together (summary)

Full detail is in `SUPABASE_PAYLOAD_RESPONSIBILITY_MODEL.md`.

- **One NJEN-owned Supabase project** hosts one PostgreSQL database with **two boundaries**:
  - **Payload:** editorial content (jobs, events, What's Filming, resources, articles) and NJEN staff accounts.
  - **Application schema:** future members, performers, organizations, verification, membership pricing and eligibility, payments and audit.
- **No duplication:** each record type has exactly one owner. Jobs are Payload content; future applications reference job ids.
- **Supabase Storage (private buckets)** holds future protected files. Payload media holds public editorial images only.
- **Decision ARCH-1 (before Week 2 setup):** configure Supabase so Payload tables are **not** exposed through the Supabase Data API. Recommended: remove `public` from the exposed schemas, plus RLS on Payload tables.
- One database means one backup and **one restore test**.

## Sources (official pages, read 22-09-2026 unless noted)

- GitHub pricing — https://github.com/pricing · GitHub plans — https://docs.github.com/en/get-started/learning-about-github/githubs-plans (17-09-2026)
- Vercel pricing — https://vercel.com/pricing · Deployment Protection — https://vercel.com/docs/deployment-protection
- Supabase pricing — https://supabase.com/pricing · Custom schemas / Data API — https://supabase.com/docs/guides/api/using-custom-schemas · Row Level Security — https://supabase.com/docs/guides/database/postgres/row-level-security
- Payload repository (MIT) — https://github.com/payloadcms/payload · Postgres adapter — https://payloadcms.com/docs/database/postgres · Payload Cloud — https://payloadcms.com/new (17-09-2026)
- Resend pricing — https://resend.com/pricing
- Sentry pricing — https://sentry.io/pricing/
- Plausible — https://plausible.io/
