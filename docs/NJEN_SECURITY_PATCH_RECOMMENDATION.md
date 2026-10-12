# NJEN — Security Patch Recommendation (for approval)

**Prepared 12-10-2026 (Day 21). Nothing has been upgraded.** `package.json`, `package-lock.json` and installed packages are unchanged. **Next.js 16 is on hold** and is not part of this recommendation.

This patch is meant to go in as **its own commit**, separate from the Early Access work, so it can be reviewed and reverted on its own.

---

## 1. Evidence

- **Installed tree:** `npm ls` on 12-10-2026: `next@15.5.25` → nested `postcss@8.4.31` and `sharp@0.35.4`; root `postcss@8.5.28`; `source-map-js@1.2.1` under both PostCSS copies.
- **`npm audit`, 12-10-2026:** **4 vulnerable packages** (1 moderate, 3 high) carrying **8 advisories**. Unchanged since 09-10-2026.
- **Registry, 12-10-2026:** the newest Next.js 15.5 release is still **15.5.27** (`backport` tag); the newest `sharp` is **0.35.5**; the newest `source-map-js` is **1.2.2**. The candidate versions are still current.
- **Advisory pages:** GitHub Security Advisories, read 09-10-2026 (`next`, `sharp`, `source-map-js`) and 12-10-2026 (all four PostCSS advisories). CVE-2026-96889 was checked in the CVE Program's record service on 12-10-2026.

---

## 2. Candidates

| | `next` | `sharp` | `source-map-js` |
|---|---|---|---|
| Installed | 15.5.25 | 0.35.4 | 1.2.1 |
| Proposed | **15.5.27** | **0.35.5** | **1.2.2** |
| Relationship | **Direct** dependency | Transitive (optional dependency of `next`) | Transitive (via both `postcss` copies) |
| Advisories | GHSA-4jqv-mc3x-m676 / CVE-2026-94543: SSG/ISR cache poisoning, self-hosted. GHSA-mcj8-r9mp-w47p / CVE-2026-94484: SSG/ISR cache poisoning, cross-user content substitution and DoS | GHSA-wq5f-xc86-pv6w: bundled librsvg use-after-free. Upstream CVE-2026-96889 (published 23-09-2026; affects librsvg). sharp has no separate CVE, which explains "No known CVE" on the advisory page | GHSA-68fv-2mgg-jv7q / CVE-2026-93749: event-loop DoS from crafted indexed source maps |
| Severity (CVSS v4, GHSA) | Moderate, 6.3 each | High, 8.9 | High, 8.7 |
| Affected range | ≥15.0.0 <15.5.27 (and ≥16.0.0 <16.3.8) | <0.35.5 | ≥1.0.0 <1.2.2 |
| Stated conditions | Pages Router + SSG/ISR + self-hosted ("Applications deployed on Vercel are not affected"); root catch-all page + SSG/ISR | Decoding SVG through librsvg | Parsing an attacker-supplied indexed source map |
| This site | App Router only, no `pages/`, no catch-all route → **conditions not met** | Image optimizer handles 2 local PNGs; no SVGs; SVG optimization off by default → **low** | Build-time, own files only → **low** |
| Change type | Patch, within 15.5 (`package.json` + lockfile) | Patch, within `next`'s allowed range (lockfile only) | Patch, in range (lockfile only) |
| Compatibility risk | Low: same minor line, same Node and React requirements. Release notes for 15.5.26/15.5.27 **not reviewed** | Low: **needs Node ≥ 20.9.0** (Vercel's current defaults meet this; confirm the project isn't pinned lower) | Very low |
| Testable without Next.js 16? | **Yes** | **Yes** | **Yes** |

**Already tested, in an isolated copy only** (09-10-2026, a scratch folder built from the committed code; never the real repository):
- `npm ci`, `npm run typecheck` and `npm run build` passed (23 routes);
- the 90-check regression suite passed;
- the hero image served through the optimizer (200, WebP), which exercises the new `sharp`;
- `npm audit` dropped from 4 vulnerable packages to 2.

**Commands, to be run only after approval:**
```
npm install next@15.5.27 --save-exact
npm update sharp source-map-js
```
**Result:** clears **4 of the 8 advisories**. Not resolved until the installed tree confirms it (`npm ls`, `npm audit`) in the real repository.

**Regression tests after applying:**
- `npm ci`, `npm run typecheck` and `npm run build`
- the regression suite: routes, 404s, headers/CSP, noindex, Early Access validation, body cap, rate limit
- `/_next/image` returns the Early Access hero
- on a Vercel Preview: browser console free of CSP errors, plus `LAUNCH_QA_CHECKLIST.md` §6 tests 12–15 and 20

**Rollback:** revert that one commit (`package.json` + `package-lock.json`) and redeploy. On Vercel, NJEN can also promote the previous deployment.

---

## 3. PostCSS: separate, and not fixable on Next.js 15

The vulnerable copy is `postcss@8.4.31`, **nested inside `next`**. Next.js uses it to process this site's own stylesheet at build time. The project's own direct `postcss@8.5.28` is not affected.

| Advisory | CVE | Severity | Affected | Fixed in | Needs |
|---|---|---|---|---|---|
| GHSA-qx2v-qp2m-jg93 | CVE-2026-41305 | Moderate (CVSS 3.1: 6.1) | <8.5.10 | 8.5.10 | User-submitted CSS re-stringified into a `<style>` tag |
| GHSA-6g55-p6wh-862q | CVE-2026-45623 | High (CVSS 3.1: 7.5) | ≤8.5.11 | 8.5.12 | Attacker-controlled CSS processed with source maps on; error text surfaced |
| GHSA-r28c-9q8g-f849 | CVE-2026-73646 | High (CVSS 3.1: 7.5) | ≤8.5.17 | 8.5.18 | Attacker-controlled CSS with a `sourceMappingURL` to a `.map` file; `result.map` exposed |
| GHSA-fxqj-rqcc-2cmp | CVE-2026-69153 | Moderate (CVSS 4.0: 6.3) | ≤8.5.22 | 8.5.23 | As above, with `from` unset |

All four require **attacker-controlled CSS**. This site has none; it only builds its own stylesheet. **Exposure is assessed as low.** That is a judgement from the stated conditions, not a test against an exploit, and the advisories remain open.

**Why it can't be patched now:**
- `next@15.5.27` still pins `postcss@8.4.31` (registry metadata), and no Next.js 15 release ships a fixed copy.
- Next.js 16.3.6–16.4.0 ship `postcss@8.5.23`, but **Next.js 16 is on hold**: it is a major version whose upgrade guide has not been reviewed.
- Forcing the nested version with an npm `overrides` entry was tried in the isolated copy (09-10-2026) and **did not apply cleanly** (`ELSPROBLEMS`). Making it work means regenerating the lockfile, so it is not recommended.

**Recommendation:** accept and record this low build-time risk for launch, and plan the Next.js 16 upgrade as its own scoped piece of work after launch.

---

## 4. Decision requested

1. **Approve** the three patch updates above, as a separate commit, with the listed tests: **yes / no**.
2. **Accept** the PostCSS advisories as a documented, low, build-time risk until a separately approved Next.js 16 upgrade: **yes / no**.

Cost: none (open-source packages). Nothing will be changed until (1) is approved in writing.
