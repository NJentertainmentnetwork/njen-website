# NJEN Supabase — Data Protection, Plan and Access

**Prepared 12-10-2026 (Day 21).** General guidance plus the facts known so far. **No backup has been made or seen, and no restore has been tested.** Nothing was changed on any account.

Plan and pricing facts come from Supabase's and Vercel's official pages as read on the dates shown. Providers change their plans, so re-check the live pages before deciding.

---

## 1. Known project facts

| Fact | Status |
|---|---|
| A Supabase project exists | Reported by NJEN, not verified |
| It was paused; a restore was attempted | Reported; **outcome unknown** |
| Plan (Free / Pro / …) | **Unknown.** Guide check D1 |
| Any backup or export exists | **Unknown.** None seen |
| A restore has ever been tested | **No evidence** |

---

## 2. Is the project active, paused or restored?

1. Dashboard → organization → project. The status shows on the project card or home page.
2. In the SQL Editor, run query 0 of `docs/NJEN_SUPABASE_READ_ONLY_INSPECTION_GUIDE.md`. A returned row means the database is answering.
3. Run query 4 of the guide. Record counts of the tables show whether the data came back.

"Restored" means: status active, query 0 answers, **and** the expected tables are present with plausible record counts. Only NJEN can judge the last point.

---

## 3. Free plan: what to weigh

Facts as read on Supabase's official pages on 09-10-2026 (details and links in `DAY20_IMPLEMENTATION_REPORT.md` §4):
- **Pausing.** Free projects can be paused after about a week of low activity. Supabase emails a warning first. Paid-plan projects are not paused for inactivity.
- **Restore window.** A paused project can be restored from the dashboard within a limited window. Supabase's page was inconsistent between 90 days and 1 year, so assume the shorter.
- **No automatic backups on Free.** Daily backups (7 days) start at Pro, from $25/month. Supabase advises Free users to export their data regularly.
- **Limits.** 2 active Free projects per organization; 500 MB database.

What this means for NJEN:
- **Development and the authorized test signup:** Free is adequate.
- **Live collection:** while paused, every signup fails and the lead is lost. The visitor is told "not saved", so nothing is falsely confirmed, but the lead is still gone. Without backups, deleted data cannot be recovered from Supabase.
- **Lowest-risk path:** stay on Free until the test signup passes, then decide before sending real traffic. Pro removes pausing and adds daily backups; staying on Free means accepting the pause risk and doing manual exports. **This is NJEN's decision. Nothing has been upgraded.**
- **Keep-alive jobs are not recommended.** Automated pings hide the pause limit, do nothing for backups, and add a job someone must own. None has been set up.

---

## 4. Export, backup and restore are not the same thing

| Term | What it is | Protects against | Proves recovery? |
|---|---|---|---|
| **Export** | A copy taken by hand: a CSV of one table, or a `supabase db dump` / `pg_dump` file | Losing that data, as of that moment | No |
| **Backup** | Copies taken automatically on a schedule by the provider (Pro and above) | Mistakes and failures, back to the last backup | No |
| **Tested restore** | Actually restoring a backup or export into a **separate** database and checking it | Discovering the backup does not work when it is needed | **Yes**: the only thing that does |

The launch plan requires "backup configuration **and a documented restore test**". Configuration alone does not count (`LAUNCH_QA_CHECKLIST.md` §5).

---

## 5. Preserving what exists, before any change

Before any database change is approved, if `early_access_leads` holds real records:

1. **NJEN exports the table.** SQL Editor → `select * from <schema>.early_access_leads;` → Export → CSV. This file **contains personal data**: store it in NJEN's own secure storage, not in email or chat, and do not send it to the developer. The developer needs counts, not contents.
2. **For a full copy** (structure plus all data), an NJEN owner can run the Supabase CLI command `supabase db dump`. It needs the database password, so NJEN runs it, not the developer.
3. **Record the counts** from query 4 of the guide beside the export. After any change, the same query must show at least those counts.

---

## 6. A restore test worth the name

Run it only when NJEN approves. The usual home for it is a **separate test project**; on Free that uses the second of the two project slots.

1. Take the backup or export.
2. Restore it into the **separate** project, never over the live one.
3. Compare: table list (guide query 2), columns (query 3), record counts (query 4), security settings (queries 7–9), and that the signup function exists (query 10).
4. Write down the date, who did it, how long it took, and any differences.
5. Delete the test project when done (an NJEN action).

On Pro, restoring a daily backup **in place** makes the live project unavailable while it runs. That is not a test to run casually on the live project.

---

## 7. Giving the developer access without sharing passwords or keys

### Supabase (roles as documented on 12-10-2026)

| Role | Plans | Can | Note |
|---|---|---|---|
| Owner / Administrator | All | Everything (Administrator: almost) | For NJEN staff |
| **Developer** | All | Run any SQL, change data, **read the API keys including the service-role key** | Effectively full data access |
| **Read-only** | **Team and Enterprise only** | Run SELECT queries only; **cannot see API keys** | Ideal for inspection, but not on Free or Pro |

On Free or Pro there is no read-only member role. So the options are:
1. **NJEN runs the read-only guide itself** and sends the results. No access granted. *(Recommended now.)*
2. NJEN invites the developer as **Developer**, knowing that this role can read the service key. If done, rotate the key when the engagement ends.

Either way, **no one shares an account password**. Invitations go to the person's own Supabase login, from Organization → Team.

### Vercel (roles as documented on 12-10-2026)

- **Hobby** is for personal, non-commercial use and has **no team roles**. A developer cannot be added to a Hobby account at all.
- **Pro:** **$20/month per developer seat** (Owner, Member, Developer). The **Pro Viewer** role is **free**, but cannot see logs or team settings. The **Developer** role can deploy but **cannot change Production environment variables**.
- The cheapest access that is still useful:
  - the developer as **Pro Viewer** (free) to see projects and deployments;
  - NJEN keeps setting Production variables itself;
  - if log access is needed for testing, a **Developer** seat ($20/month) is the step up.

  **Any seat charge is NJEN's decision.**

---

## 8. Why the service-role key never leaves the server

The service-role key, or a secret key, **bypasses every row-security rule**: whoever holds it can read and change every record. Therefore:
- it lives only in Vercel's encrypted Environment Variables, under a name without `NEXT_PUBLIC_`;
- the website reads it only inside the server route. It is never sent to browsers (a Day 19/20 scan of the browser bundle found no Supabase names or key patterns);
- Supabase itself refuses secret keys sent from a browser;
- if it is ever exposed (pasted in a message, committed, screenshotted), **rotate it immediately** in Supabase → Settings → API Keys, then update Vercel and redeploy.
