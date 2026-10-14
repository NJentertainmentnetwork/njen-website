# NJEN Vercel Preview Readiness (Day 23)

**Prepared 14-10-2026.** Nothing was changed on Vercel or GitHub. The developer has no access to NJEN's Vercel account; everything about the projects there comes from NJEN's screenshots or from public URLs checked read-only.

**Bottom line:** the code is ready to deploy as it is. No build setting, file or variable needs to change first. What is missing is a Vercel project connected to the official repository. Only NJEN can create it.

---

## 1. Verified on Day 23

| Check | Result | How |
|---|---|---|
| Local Git remote | `https://github.com/NJentertainmentnetwork/njen-website.git`, branch `main` | `git remote -v`, `git branch --show-current` |
| Official `main` on GitHub | `9ed6930` ("Complete Day 22 Early Access and Phase 1 review") | `git ls-remote origin refs/heads/main` (read-only) |
| Day 23 changes | **Not committed or pushed.** A preview made now would deploy `9ed6930`, without Day 23's fixes. The developer pushes them; once pushed, any connected project builds them automatically | `git status --short` |
| `vercel.json` | `{"framework": "nextjs"}` only. No custom build command, regions, crons or rewrites | File read |
| Build | `npm run build` succeeds with storage variables **unset** (23 routes; `/early-access` static, `/api/early-access` and `/api/health` dynamic) | Day 23 local build |
| Variables needed to build | **None.** The site builds and runs with no variables; Early Access then honestly shows "Preview only" | Build above |
| Secrets in browser files | None found in `.next/static` | Search for key prefixes |
| `.env.local` | Ignored by `.gitignore` (rule `.env.*`) and **not tracked** | `git check-ignore -v`, `git ls-files --error-unmatch` (contents not read) |
| Public URL `njen-website.vercel.app` | Still the **old build**: `/early-access` and `/api/health` return 404; homepage served from cache, `Age: 1310933` s (about 15 days) | Plain GET requests, 14-10-2026 |

Not verified, and not assumed: which repository each of NJEN's three Vercel projects is connected to today, their production branches, domains and variable names. The Day 22 screenshots showed all three connected to the old repository `NJEnetwork/njen-website`. That may have changed since; nobody has reported it.

---

## 2. What is missing for a preview

| # | Prerequisite | Who | Status |
|---|---|---|---|
| 1 | A Vercel project connected to `NJentertainmentnetwork/njen-website` | NJEN (account owner) | **Missing, the blocker** |
| 2 | Vercel's GitHub app allowed to read that repository (granted during import if needed) | NJEN (GitHub organisation owner) | Unknown; handled inside step 1 |
| 3 | Deployment Protection set so the preview is **not public** | NJEN | To set in step 1 |
| 4 | A way for the developer to open the protected preview: a Vercel **share link**, or a team seat | NJEN | Share link recommended (free; can be revoked) |
| 5 | Day 23 changes pushed to `main` | Developer | Pending; does not block step 1 |
| — | Supabase variables | NJEN, **later** | **Deliberately not now.** A preview with no variables is right for layout, iPhone and accessibility testing, and can't collect anyone's details |

---

## 3. The safe path

**Create one new project, separate from the three existing ones.**
- It changes nothing that exists today: no domain, production deployment, variable or Git connection is touched.
- The old projects can be cleaned up later, as a separate decision.
- Reconnecting an existing project would instead change what its domains serve. That needs written approval and is not proposed now.

**Protection (Vercel docs, read 14-10-2026):**
- "Standard Protection" (the usual default) protects previews but **not** the project's production address.
- **"All Deployments" protects every address, including production, and is available on all plans without a paid add-on** when used with Vercel Authentication. Password Protection is a paid extra ($20/month per project on Pro) and is **not** needed.
- Vercel says it overwrites `X-Forwarded-For` with the real client address, which the signup rate limit relies on.

**One short exposure window to be aware of:** a new project's first deployment starts as soon as it's imported, before protection can be switched on. For those few minutes its address is reachable if someone guesses it. Even then:
- the page says "Preview only";
- it collects and stores nothing (no variables);
- search engines are blocked (`robots.txt` disallows all, and the page is `noindex`).

To avoid the window entirely, NJEN can first set the **team default** (Team Settings → Deployment Protection → All Deployments). That applies only to projects created afterwards.

The step-by-step for NJEN is in `docs/NJEN_DAY23_NEXT_CLIENT_ACTION.md`.

---

## 4. What the developer checks once the URL arrives

From the share link, without needing account access:

| Check | Pass |
|---|---|
| Deployment shows repository `NJentertainmentnetwork/njen-website` and the expected commit | Matches `main` |
| `/api/health` | `{"status":"ok"}` |
| `/early-access` | "Preview only" notice; artwork loads; `noindex, nofollow` |
| Headers | `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`; no `X-Powered-By` |
| Opening the URL in a private window without the share link | Vercel login page (proves it isn't public) |
| Real iPhone (Safari, and the Facebook in-app browser via a private test post or Messenger link) | Layout, keyboard (no zoom on focus), form errors, "not saved" result |

Then, separately and later: the Supabase decision (`docs/NJEN_DAY23_EARLY_ACCESS_COMPATIBILITY.md`), the variables, a controlled test signup, and only then any production or launch step.

---

## 5. Not done, by design

- No Vercel project, setting, domain, variable or deployment was created or changed.
- No `vercel` CLI command was run, and no deployment was triggered.
- Nothing was pushed to GitHub.
