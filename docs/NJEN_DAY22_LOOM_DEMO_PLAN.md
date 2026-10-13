# NJEN Early Access: Loom Demonstration Plan

**Prepared 13-10-2026 (Day 22). Status: NOT RECORDED. Prerequisites MET on 13-10-2026:** setup guide Steps 6 and 7 passed off camera against the developer-owned test project. The live check passed 12/12 and the count query returned 1/1. Until the developer records, checks and shares the video, no report should say it exists.

**What the video is:** a demonstration against a **developer-owned local/test Supabase project**.

**What it is not:** proof that NJEN's Supabase, Vercel or the live site is connected. Say this out loud at the start and the end.

Target length: 3 to 4 minutes.

---

## 1. Before pressing record

- [x] Steps 6 and 7 of the setup guide passed off camera (13-10-2026).
- [ ] **Clear the off-camera test row** with the cleanup SQL in §1a below, so shot 2 can truthfully say the table has zero rows.
- [ ] Rebuilt and started: `npm run build`, then `npm run start`. The build output's "Environments: .env.local" line names the file only, but **start recording after the build anyway**.
- [ ] **Restart `npm run start` just before recording.** The form allows 5 submissions per 10 minutes from one connection, and rehearsals count. Restarting resets the counter.
- [ ] **Record one browser window only, not the full screen.** That keeps terminals, the editor and other tabs out of the frame.
- [ ] `.env.local` is closed in the editor, and no terminal shows `cat`/`type`/`Get-Content` of it.
- [ ] Supabase is open in that window on **SQL Editor**, in the **test** project, with Step 7's count query already pasted, ready to run. **Don't** open Project Settings → API Keys, Database → Connection string, Logs, Auth users or Table Editor.
- [ ] Notifications muted, so no email previews pop up.
- [ ] Browser autofill is off for the form, or you type the address manually. Autofill dropdowns can show other saved addresses.
- [ ] **On camera, use a non-personal demo identity:** name `NJEN Test`, and an address such as `njen-demo@example.com` (`example.com` is reserved and nobody receives mail there). No email is sent at signup, so the address doesn't need to receive anything. The off-camera test used a different reserved address and source (`dev-test-day22`), so the demo starts clean. The count query on screen must be the demo query in §1a.
- [ ] No NJEN client dashboards, client credentials or client records are open anywhere in the window.

## 1a. SQL for the demo (developer-owned test project only)

Run these only in the SQL Editor of **your test project**. Check the project name at the top of the dashboard first, and never run them in NJEN's project.

**Before recording: clear the off-camera test row.** First, confirm exactly what will be removed. Expect `1`:
```sql
select count(*) as rows_to_delete
from app.early_access_signups
where lower(email) = lower('njen-dev-test@example.com')
  and source = 'dev-test-day22';
```
Then delete exactly that row:
```sql
delete from app.early_access_signups
where lower(email) = lower('njen-dev-test@example.com')
  and source = 'dev-test-day22';
```
The editor should report 1 row affected. Re-run the first query and expect `0`.

The two conditions limit the delete to that one test address *and* its test source label. It can't match any other row.

**During recording, the demo count query (shots 3, 7 and 8):**
```sql
select count(*) as rows_for_demo_address,
       count(*) filter (where source = 'loom-demo') as with_demo_source
from app.early_access_signups
where lower(email) = lower('njen-demo@example.com');
```
Expected: shot 3 → `0` and `0`; shots 7 and 8 → `1` and `1`.

---

## 2. Script (shots and talking points)

| # | Show | Say |
|---|---|---|
| 1 | Supabase SQL Editor, project name visible | "This is my own Supabase test project, not NJEN's. I applied the repository's two migrations here: 0001 and 0002. Nothing in this video touches NJEN's database or the live site." |
| 2 | Run the Step 4 verification query | "The signups table exists with row-level security forced and no policies. Only the server's service role can call the signup function; anonymous and signed-in browser roles can't. The table has zero rows." |
| 3 | Run the demo count query (§1a) | "Zero rows for the demo address before we start." |
| 4 | `http://localhost:3000/early-access?utm_source=loom-demo` | "This is the local NJEN Early Access page, running the current code. There's no 'Preview only' warning, which means this build has storage switched on." |
| 5 | Fill in `NJEN Test` and the demo address, submit | "The browser checks the fields, but the server re-checks everything: required fields, email format, a hidden anti-bot field, a timing check, a 4 KB size limit and a rate limit." |
| 6 | The "You're in. Welcome to NJEN." confirmation | "This message only appears after the database confirms the write. If the write fails, the visitor is told it wasn't saved." |
| 7 | Re-run the demo count query | "One row for the demo address, and its source is recorded as `loom-demo`." Expect `1` and `1`. |
| 8 | Reload the page; submit the same address again, in capitals | "Submitting twice doesn't create a duplicate." Re-run the count: still **1**. |
| 9 | *(Optional)* Reload; submit `nope` as the email | "Invalid input is rejected with a clear field message, and nothing is stored." |
| 10 | Close | "To be clear: this proves the code works against a real Supabase project that I own. It doesn't yet prove NJEN's own database, the Vercel deployment or the live site. Those need NJEN's inspection results, an approved database change, and a Vercel project connected to the official repository." |

The site runs on `http://localhost:3000`, which is plain HTTP. **That's normal locally.** Just don't present the address bar as the production domain.

**Optional failure demo (only if it fits):**
- Showing "not saved" needs a restart with a wrong key (setup guide §8). The restart happens in a terminal, so **pause the recording** while you do it.
- Resume on the browser and submit: the page says the signup was not saved.
- Pause again to restart normally.

---

## 3. Never visible in the recording

- Supabase secret, service-role, publishable or anon keys; the API Keys settings page.
- `.env.local` or any environment variable **value**.
- Database connection strings, the database password, Project Settings → Database.
- Passwords, 2FA codes, account recovery details, billing pages.
- Supabase Logs detail views (request headers).
- Any real name or email address, including your own; Table Editor or `select *` on any table.
- Anything from NJEN's Supabase or Vercel accounts.

---

## 4. After recording, before sharing

- [ ] Watch the whole video once at normal speed, looking only for keys, values, other tabs and notifications.
- [ ] If anything secret appears: **delete the video, then rotate that key** in the test project. Don't just trim the clip; trimmed sections can sometimes be restored.
- [ ] Set Loom sharing to "anyone with the link" or a named viewer list, not public discovery.
- [ ] Give the title the context, e.g. **"NJEN Early Access, developer-owned test Supabase demo (not production)"**.
- [ ] Optionally delete the test row afterwards (setup guide §9).

Only after these checks should the Day 22/23 notes say "Loom recorded and shared", with the link.
