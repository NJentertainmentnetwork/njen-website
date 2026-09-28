# NJEN Master Business Rules — Addendum v1.1

**Status:** Business-rule record, 22-09-2026. Documentation only — nothing here is implemented.

This addendum updates the client's *NJEN Developer Master Business Rules, Version 1.0* (14-09-2026, PDF in this repository) with NJEN's latest instructions. The PDF is NJEN's own document and is not edited. Where this addendum and v1.0 differ, **this addendum is current**, as the v1.0 change-control rule requires ("Changes should be recorded as explicit decisions rather than silently changing behavior in code").

Every rule below is **POST-LAUNCH** unless stated otherwise. None of it expands or delays the 30-day public launch.

---

## Change log

| # | v1.0 section | Change | Source |
|---|---|---|---|
| 1.1-A | §7 Background Performer Program | **Additional-photo price changes from $20 to $25.** The v1.0 "$20 per additional photo" is **obsolete**. | NJEN instruction, 22-09-2026 |
| 1.1-B | §7, §8 | Confirmed: each performer profile includes **2 photos**; verified industry users get directory access **without a directory-access fee**. | NJEN instruction, 22-09-2026 |
| 1.1-C | §6 Membership | New rule: **verified SAG-AFTRA members receive a 40% discount** from the comparable regular/non-union membership price. Eligibility must be verified. | NJEN instruction, 22-09-2026 |
| 1.1-D | §6, §7, §13 | Prices, discounts and eligibility rules must be **Admin-configurable**. Future payment for additional photos should be **automated**. | NJEN instruction, 22-09-2026 |
| 1.1-E | §3, §9–§13 | Future requirements confirmed on the roadmap, including the new **Studio Teachers / Set Teachers** category and **Unions & Guilds / Career Pathways** (section 4 below). | NJEN instruction, 22-09-2026 |

---

## 1. Background Performer Directory (POST-LAUNCH)

1. **Included photos:** each performer profile includes **2 photos**.
2. **Additional photos:** performers may add more photos for a fee.
   - **Additional photo price is Admin-configurable; $25 per photo is the current configured/business value.**
   - The value must never be hard-coded in application logic, templates or payment code.
   - v1.0's $20 is obsolete (change 1.1-A).
3. **Automated payment:** paying for additional photos should be automated through the future payment system — checkout, confirmation and unlocking the extra photo slot without manual staff steps.
4. **Ownership:** performers can create and manage **only their own** profile. Staff may assist under audited, role-based access.
5. **No public or performer browsing:** public users **cannot** browse or search the complete performer database. Performers **cannot** browse or search it either.
6. **Private, protected directory:** the full searchable directory is private. It is available **only** to verified/approved industry users through the protected Industry/Production Portal.
7. **Free access for qualified industry users:** qualified studios, production companies, casting professionals and approved industry users receive directory access **without a directory-access fee**. Access is still subject to verification, terms and role permissions.
8. **Controls required:** verification, moderation (including photo review), privacy, consent and security controls must be supported. Minors require the approved guardian/consent model before activation (v1.0 §7, §10).

**Still OPEN (owner/legal decisions, needed before this phase is built):**
- Base performer registration/membership price.
- Maximum number of additional photos.
- Whether the $25 is one-time per photo or recurring.
- Whether replacing a photo is free.
- Refund rules.
- Searchable profile fields.
- Minimum age and guardian workflow.
- Industry contact rule (direct contact vs controlled request)..

## 2. Membership pricing (POST-LAUNCH)

1. **SAG-AFTRA discount:** **verified SAG-AFTRA members receive a 40% discount from the comparable regular/non-union membership price.**
2. **Configurable:** **membership price, discount percentage and eligibility rules are Admin-configurable.** None may be hard-coded; 40% is the current configured/business value.
3. **Verification required:** **SAG-AFTRA eligibility must be verified rather than relying solely on user-selected discount claims.** A checkbox or self-declaration is not sufficient proof.
4. **Record the outcome:** the future membership system must record each eligibility check — status, method, reviewer or source, date, expiry/re-check date — and apply the discount only while eligibility is verified and current.
5. **Billing uses configuration:** future billing must calculate prices from the configured plan price, discount and eligibility rules at the time of purchase, and keep a record of the amounts charged.

**Still OPEN (owner/legal decisions):**
- Membership tier names and base prices; billing interval.
- Cancellation and refund rules.
- **How SAG-AFTRA eligibility is verified** — for example, staff review of membership evidence, or another method NJEN approves.
- How often eligibility is re-checked, and what happens when it lapses.
- What evidence is retained, and for how long.
- Whether the discount combines with other offers.
- Rounding and tax treatment.

Union-membership information is personal data that should be handled as sensitive; retention and access rules need counsel review.

## 3. Unchanged v1.0 rules that these build on

- NJEN is not a talent agency and is separate from Media Artists Group (v1.0 §1).
- NJEN is not a public people-search site (v1.0 §1).
- Protected data is enforced at the server/API/database layer, never by hiding UI (v1.0 §2).
- Membership architecture must not hard-code one price or plan (v1.0 §6).
- Shortcuts to Hollywood is an NJEN membership benefit with a separate purchase path, and is never at a public URL (v1.0 §13; register R4).

## 4. Future NJEN requirements (POST-LAUNCH roadmap)

These remain on the roadmap and are **POST-LAUNCH — NOT PART OF THE 30-DAY PUBLIC LAUNCH** in their full/expanded form. See `POST_LAUNCH_DEVELOPMENT_ASSESSMENT.md`.

- Production Crew & Crafts Directory (union and non-union)
- **Studio Teachers / Set Teachers** category (new)
- **Unions & Guilds / Career Pathways** (new as a named area)
- Internships / Career Launch (Internship Exchange, education partners)
- Children & Parents / child-performer resources
- Housing / Practical Resources
- Mental Health for Artists
- Social-media safety / **consumer protection**
- Production Services resources (including catering)
- Private Industry/Production Portal
- Community events / future mixers
- Shortcuts to Hollywood as a membership benefit **and** a separate purchase option

Previously documented future systems also remain: member accounts, performer profiles, industry verification, CRM/admin, payments, secure storage, email systems, security/backups/maintenance, and further platform modules.

## 5. Launch-scope clarification required (conflict X3)

The latest instruction describes the section 4 list as post-launch. Several of those areas are **already in the approved 30-day launch as public information pages**:

| Area | Current approved launch scope | Source |
|---|---|---|
| Children & Parents | Public information page | v1.0 §3 |
| Social Media Safety | Public information page | v1.0 §3 |
| Housing / Practical Resources | Public information page | Register R1 (17-09-2026) |
| Mental Health for Artists | Public information page | Register R2 (17-09-2026) |
| Career Center / Career Launch, Internship Exchange | Content structure | v1.0 §3 |
| Events / Community | Public events content | v1.0 §3 |
| Shortcuts to Hollywood | Architecture and controlled-delivery approach only; no file, price or checkout | v1.0 §3, R4 |

**Recommended interpretation (not yet confirmed):** the approved *public information pages* stay in the launch. The *expanded/interactive functionality* listed in section 4 — directories, registrations, mixers, partner workflows, purchases and so on — is post-launch.

This needs no code change either way. Those launch pages are already built but hidden (404) until NJEN supplies content, so confirming either interpretation does not delay the launch. Recorded as register item **X3**.
