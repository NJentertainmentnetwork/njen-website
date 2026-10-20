# NJEN — Security Patch Recommendation (for approval)

**Updated 16-10-2026 (Day 25); isolated re-test added 19-10-2026 (Day 26, §3).**

**Status 20-10-2026 (Day 28): APPLIED in the development codebase, not yet committed or deployed.** Approval of decision (1) was relayed by the developer on 20-10-2026, "subject to compatibility verification"; the written approval itself is not stored in this repository. Installed now: `next@15.5.28`, `sharp@0.35.5`, `source-map-js@1.2.2`. All checks in §3 passed (`DAY28_IMPLEMENTATION_REPORT.md` §2). Decisions (2) and (3) are not recorded as answered.

**Supersedes the Day 21 version, which proposed `next@15.5.27`: 15.5.27 is itself affected by the 14 October advisories below.**

This patch is meant to go in as **its own commit**, separate from the Early Access work, so it can be reviewed and reverted on its own.

---

## 1. Evidence (16-10-2026)

- **Installed tree** (`npm ls`): `next@15.5.25` → nested `postcss@8.4.31` and `sharp@0.35.4`; root `postcss@8.5.28`; `source-map-js@1.2.1` under both PostCSS copies. The lockfile matches.
- **`npm audit`:** 4 vulnerable packages (1 moderate, 3 high), 8 advisories. npm offers `next@15.5.28`. **Note:** the npm advisory database does not yet list the 14 October Next.js advisories against `next`. They are confirmed from the official sources below.
- **Registry:** `next@15.5.28` (`backport` tag) and `16.4.1` published 14-10-2026; latest is `16.4.2`. `sharp@0.35.5`, `source-map-js@1.2.2` are current.
- **Official sources, read 16-10-2026:** the Next.js blog post "Next.js Security Update for Upstream Vulnerabilities" (14-10-2026); GitHub advisories GHSA-2464-fhr4-w9xw, GHSA-p3m5-59mp-jv5r, GHSA-673q-mjm6-r5xr; the Next.js support policy.

---

## 2. The 14 October 2026 Next.js security update

| Advisory | Severity | Affected | Fixed | Condition | This site (15.5.25) |
|---|---|---|---|---|---|
| **GHSA-2464-fhr4-w9xw / CVE-2026-96889**: unauthenticated RCE in the Image Optimization API when SVG files are used | **Critical**, CVSS v4 9.5 | `>=10.0.0 <=15.5.27`, `>16.0.0 <=16.4.0` | **15.5.28**, 16.4.1; or `sharp` ≥ 0.35.5 | Upstream librsvg flaw in `sharp`; "when Next.js runs on glibc-based Linux" (Vercel's build and function runtime is Linux) | **Affected version.** The site uses the optimizer (`/_next/image`) for its own local PNG/JPG files; no SVG is served; `dangerouslyAllowSVG` is off (default); no remote image sources. The advisory doesn't fully describe the exploit conditions, so **this is not assessed as low risk.** Treat as Critical until patched |
| **GHSA-p3m5-59mp-jv5r**: DoS in App Router using Server Actions | **High**, CVSS v4 8.2 | `>=13.0.0 <=15.5.27`, `>=16.0.0 <=16.4.0` | **15.5.28**, 16.4.1 | App Router with **at least one Server Action**. "Applications … not using Server Actions are not vulnerable" | **Affected version, condition not met today:** no `"use server"` anywhere in the code (checked 16-10-2026). Would become exploitable the moment a Server Action is added |
| GHSA-673q-mjm6-r5xr: RCE in `use cache` returning typed arrays | Critical, CVSS v4 9.5 | `>=16.0.0 <=16.4.0` only | 16.4.1 | Cache Components | **Not affected** (15.x) |

Earlier open advisories, still present in `npm audit`:

| Package | Advisory | Severity | Fixed in | This site |
|---|---|---|---|---|
| `next` | GHSA-4jqv-mc3x-m676, GHSA-mcj8-r9mp-w47p (SSG/ISR cache poisoning) | Moderate 6.3 | 15.5.27 | Conditions not met (no Pages Router, no catch-all; Vercel-hosted not affected) |
| `sharp` (nested in `next`) | GHSA-wq5f-xc86-pv6w (librsvg, CVE-2026-96889) | High 8.9 | 0.35.5 | Same root cause as the Critical Next.js advisory above |
| `source-map-js` | GHSA-68fv-2mgg-jv7q (event-loop DoS) | High 8.7 | 1.2.2 | Build-time, own files only |
| `postcss` 8.4.31 (nested in `next`) | 4 advisories (2 High, 2 Moderate) | — | 8.5.23 | **Not fixable on Next.js 15**: `next@15.5.28` still pins `postcss@8.4.31`. Needs attacker-controlled CSS; the site only builds its own stylesheet |

---

## 3. Proposed change

| | Installed | Proposed | How |
|---|---|---|---|
| `next` (direct) | 15.5.25 | **15.5.28** (exact) | `package.json` + lockfile |
| `sharp` (transitive) | 0.35.4 | **0.35.5** | lockfile. `next@15.5.28` accepts `^0.34.3 \|\| ^0.35.5`. 0.34.x is also vulnerable, so the installed version **must be checked**, not assumed |
| `source-map-js` (transitive) | 1.2.1 | **1.2.2** | lockfile |

**Commands, only after written approval:**
```
npm install next@15.5.28 --save-exact
npm update sharp source-map-js
npm ls next sharp source-map-js     # must show 15.5.28, 0.35.5, 1.2.2
npm audit                           # expected: only the nested postcss advisories remain
```

**A major upgrade is avoidable for this patch:** 15.5.28 is a patch within the current 15.5 line, with the same React 19.1 and Node requirements. **It is not avoidable for long.** Next.js 15.x is in Maintenance LTS, which lasts two years from its 21-10-2024 release, so security fixes for 15.x are expected to stop around **21-10-2026**. Any advisory published after that date may get no 15.x fix. **Recommendation:** apply 15.5.28 now, and plan a separately scoped and approved upgrade to Next.js 16 (Active LTS) soon after, ideally before or shortly after launch. That upgrade also clears the PostCSS advisories.

**Compatibility risks:**
- Low: same minor line.
- `sharp@0.35.5` needs Node ≥ 20.9.0. Vercel's current default meets this; confirm the Vercel project's Node version isn't pinned lower.
- Release notes for 15.5.26–15.5.28 have not been reviewed line by line.

**Re-tested at 15.5.28 in an isolated copy, 19-10-2026 (Day 26).** This was a scratch folder outside the repository, with no `.env` files; the repository itself is unchanged.
- **Commands:** `npm ci`, then exactly the commands above.
- **`npm ls`:** `next@15.5.28`, `sharp@0.35.5`, `source-map-js@1.2.2`.
- **What changed:** in `package.json`, only the `next` line. In the lockfile: `next` and its `@next/*` platform binaries, `sharp` and its `@img/*` binaries (libvips 1.3.3 → 1.3.4), and `source-map-js`.
- **`npm audit`:** 2 left (nested `postcss`, plus `next` flagged only because it bundles that `postcss`).
- **Checks:** typecheck pass; `npm test` 140/140; build pass (23 routes); `.next/static` secret scan 0 matches.
- **Local `next start`:** health OK; security headers present; `/_next/image` returns 200 WebP for both hero images; live check (unconfigured) 11/11; browser check 41/41.

**Tests after applying:**
1. `npm ci`, `npx tsc --noEmit`, `npm run build` (23 routes).
2. `npm test` (currently 140/140).
3. Local `next start` with storage blanked: `node scripts/early-access-live-check.mjs --mode unconfigured` (11/11) and `node scripts/early-access-browser-check.mjs` (41/41).
4. `/_next/image?url=/images/early-access/NJEN_Early_Access_Mobile_Hero.png&w=828&q=72` returns 200 WebP/AVIF. This exercises the new `sharp`.
5. Secret scan of `.next/static` (0 matches).
6. On the Vercel Preview: `/early-access` loads, hero images render, 0 CSP errors in the console, and `LAUNCH_QA_CHECKLIST.md` §6 tests 12–15 and 20.

**Rollback:** revert the one commit (`package.json` + `package-lock.json`) and redeploy, or promote the previous deployment in Vercel.

**Cost:** none.

---

## 4. Decision requested

1. **Approve** `next@15.5.28` + `sharp@0.35.5` + `source-map-js@1.2.2`, as a separate commit, with the tests in §3: **yes / no**.
2. **Accept** the nested PostCSS advisories as a documented build-time risk until a separately approved Next.js 16 upgrade: **yes / no**.
3. **Agree** to scope the Next.js 16 upgrade as its own piece of work, given 15.x security support ends around 21-10-2026: **yes / no**.

Nothing will be changed until (1) is approved in writing.
