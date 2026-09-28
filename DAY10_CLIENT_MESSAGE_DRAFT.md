# Day 10 — Client Message Draft (NOT SENT)

> **This is a draft for your review.** Nothing has been sent. Edit freely, then send it yourself.

---

Hi,

Here is the Day 10 status on the GitHub repository, the Vercel deployment, and what is needed to move into the database and CMS work.

## 1. GitHub — the push worked

Your push on 25 September succeeded. The code is in **`NJEnetwork/njen-website`** on branch `main`, commit `8bffc97`. Local and remote point at the same commit, so nothing is left unpushed. That repository is **private**, which is correct.

I also checked the new repository I was invited to, **`NJentertainmentnetwork/njen-website`**. It exists but is **completely empty** — no commits — and it is currently **public**.

**Two things I need from you before anything moves:**

1. **Which repository is the official one?** I have not moved anything, and I won't until you confirm.
2. **If you want to use the new one, please make it private first** (Settings → General → Change visibility). The project folder contains internal material — business rules, cost and infrastructure assessments, the post-launch roadmap, the client input register, and the documents you supplied. Pushing to a public repository would publish all of that, and Git history keeps it recoverable even if it is deleted afterwards. Alternatively we can decide to keep only the application code in a public repository and the documentation elsewhere.

## 2. Vercel — I do not have access, so I have not inspected it

I have **not** been given Vercel access, so I have not opened the dashboard and have not read any build logs. I won't report a deployment as working or failing without seeing it.

What I can tell you is what I ruled out by testing locally. I took a clean copy of the code, installed it from scratch the way Vercel does, and built it **with no environment variables set at all**. It built successfully — 24 pages. I also checked that every import matches its filename exactly, since Vercel builds on Linux where capitalisation matters.

**So if a Vercel build is failing, the cause is not in the code.** It is in the Vercel project settings or the repository connection.

**My best guess — and it is only a guess until I can see it:** the Vercel project may be connected to the **new, empty** repository rather than to the one that actually has the code. A project pointed at an empty repository has nothing to build. You can check this in about a minute: open the Vercel project → **Settings → Git** → read which repository and branch are connected.

**What I need to diagnose it properly:**

- The Vercel project name and which team it is under
- Which repository and branch it is connected to
- **Viewer access** for me to the Vercel team (free), or the build log of the last deployment exported and sent over
- The current deployment URL, so I can verify the live pages, security headers and search-engine settings
- Which plan the account is on — note that Vercel's free Hobby plan is licensed for **non-commercial use only**, so a commercial site needs Pro (about $20/month per seat)
- Please also switch on **Vercel Authentication** for Preview deployments. It is free and it stops the staging site being publicly visible or indexed.

## 3. Environment variables — the short answer is you need none right now

I went through the code line by line rather than guessing from the example file. The current website reads exactly **three** environment variables, and **all three are optional**. The site builds and runs with none of them set — I proved that in the clean test above.

| Variable | What it does | Needed now? | Where |
|---|---|---|---|
| `NJEN_SITE_URL` | Turns on canonical URLs and the sitemap. Needs your confirmed production domain | Not yet — **needed at launch** | Production |
| `NJEN_ALLOW_INDEXING` | Google and other search engines are **blocked by default**. Set to `true` only at go-live | Not yet — **at launch only** | Production only |
| `NJEN_PREVIEW_UNPUBLISHED` | Lets us preview pages that are not published yet, for internal review | Optional | Never in production |

Everything else in the configuration file — Supabase, Payload, Resend, Sentry, Plausible — is a **placeholder for later**. None of those services is installed, so setting those values now would have no effect. There are 14 of them, all documented and ready so setup is quick when each account exists.

The full matrix, including which are sensitive and which Vercel environment each belongs to, is in **`ENVIRONMENT_VARIABLES.md`** in the project.

**On credentials:** when the time comes, please send connection strings and keys through a secure channel — not email, chat or a screenshot — and they will be entered only in Vercel's encrypted settings, never into the repository. Nothing sensitive will ever go behind a `NEXT_PUBLIC_` name, because that would compile it into the browser.

## 4. Database and CMS — ready to start, waiting on you

The groundwork is done: the data and role model, the CMS plan, the content mapping, the initial database migration script, and typed contracts in the code so that published and members-only content cannot be mixed up by accident. The pages already read content through a service layer designed to be swapped from sample data to the real CMS.

What is not done — deliberately — is installing anything. Payload CMS needs a live database connection to start up, so installing it before the database exists would break the build.

**To unblock this I need one thing: an NJEN-owned Supabase project**, with the connection details sent securely.

One technical point worth flagging now, because it is much easier to get right at the start than to fix later: Supabase publishes its `public` database schema over the internet by default, and Payload also puts its tables in `public` by default. Left alone, those two defaults would make the CMS tables reachable through the Supabase API. It is straightforward to prevent — but it has to be configured when the project is created, before any content is entered. I have this documented and will handle it as the first step once the project exists.

## 5. What I need from you, in priority order

1. **Confirm which GitHub repository is official.** If it is the new one, make it private first.
2. **Send the Vercel details** — project name, team, connected repository and branch — and add me as a viewer, or send the last build log.
3. **Confirm the Vercel plan**, given the non-commercial restriction on the free tier.
4. **Turn on Vercel Authentication for Preview.**
5. **Create the Supabase project** and send the credentials securely.

Then, still outstanding from earlier and needed before launch: the production domain, the Privacy / Terms / Accessibility wording, the contact email destination, real job listings (or your approval to launch with an empty job board), and the names of the staff who need CMS admin accounts.

## 6. Where the code stands

No application code changed today — this was verification and documentation. For the record, the current build passes cleanly: type checking passes, all 24 pages build with no warnings, all 8 published pages load, the 10 unpublished sections correctly return "not found", all security headers are in place, search engines are blocked by default, and a scan of the browser bundle found no secrets or internal data.

Happy to walk through any of this on a call if that is quicker.

Best regards,
Viral
