# NJEN: Next Client Action and Work Update (Day 23)

**Prepared 14-10-2026.** One action only. The other open items in `docs/NJEN_DAY22_CLIENT_ACTIONS.md` still stand, but they can wait until this one is done.

---

## The one action: create a private preview of the website from the official repository

### Why it is needed

The website code lives in GitHub at `NJentertainmentnetwork/njen-website`. The Vercel projects we have seen are connected to an **older** repository, so the public Vercel address is still showing a version from about the end of September. The Early Access page doesn't exist there at all.

Until a Vercel project builds the official repository:
- nobody can see the current Early Access page on a phone;
- we can't test it on a real iPhone or inside Facebook;
- we can't move on to connecting the signup list.

### What it changes, and what it doesn't

- It creates **one new, private project**. Your three existing projects, their addresses and their settings are not touched.
- **No signup can be collected.** No database settings are added, so the page says "Preview only" and saves nothing.
- It stays **private**: only people logged in to your Vercel team, or holding a share link you create, can open it. Search engines are blocked too.
- No new subscription is needed for this. Vercel's documentation says the "All Deployments" protection used below has no extra charge. **Do not** turn on Password Protection, which is a paid extra.

### Steps on iPhone (Safari), about 10 minutes

1. Open **Safari** and go to **vercel.com**. Log in, then check the team name at the top left is NJEN's team.
2. *(Recommended, so the preview is private from its very first minute.)*
   - Tap your team name → **Settings** → **Deployment Protection**.
   - Set the default for new projects to **All Deployments**, method **Vercel Authentication**.
   - Tap **Save**.

   This affects only projects created from now on.
3. Go back to the dashboard. Tap **Add New…** → **Project**.
4. Under **Import Git Repository**, find **`NJentertainmentnetwork/njen-website`** and tap **Import**.
   - **If it isn't listed:** tap **Adjust GitHub App Permissions**. GitHub opens. Choose the **NJentertainmentnetwork** organisation, allow access to **njen-website** only, tap **Save**, then return to Vercel.
5. On the setup screen:
   - **Project Name:** type `njen-website-preview` (a new name, so nothing existing is replaced).
   - **Framework:** leave as **Next.js**. Leave Root Directory and Build settings as they are.
   - **Environment Variables:** **add nothing.**
   - Tap **Deploy** and wait for the success screen (1–3 minutes).
6. Open the new project → **Settings** → **Deployment Protection**. Confirm **Vercel Authentication** is on with **All Deployments** (set it and tap **Save** if step 2 was skipped).
7. Do **not** add a domain.
8. Create the link for the developer:
   - open **Deployments** and tap the latest deployment;
   - tap **Share**, choose **Anyone with the link**, then copy the link.

   You can switch it back to **Only people with access** at any time to revoke it.

### What to send back (no passwords or keys)

1. The project name.
2. The **share link** from step 8.
3. The short commit code shown on the deployment (7 characters, for example `9ed6930`).
4. A screenshot of the **Deployment Protection** setting.

If any screen looks different from these steps, stop and send a screenshot. Don't change an existing project to make it fit.

**Note:** the preview builds whatever is on GitHub `main` at that moment. The developer pushes the Day 23 improvements; if they arrive after the preview, Vercel rebuilds automatically, and the same link keeps working for that deployment only. A new share link may be needed for later deployments.

---

## Client work update (Day 23)

> **Day 23 update: Early Access page**
>
> Today's work focused on getting the Early Access page ready for a private review.
>
> **Done and tested on the developer's machine:**
> - Added an automated test suite for the signup form and its server: 126 checks, all passing. They cover valid signups, missing or invalid details, repeat signups, oversized requests (including ones that hide their size), the anti-spam checks, the rate limit, missing or wrong database settings, and database errors and timeouts.
> - The tests confirm the page **never says "You're in" unless the signup was actually saved**, and that no names, emails, IP addresses or keys are written to the logs.
> - Made three small safety improvements. None of them changes the design or wording:
>   - database settings pasted with stray spaces now still work;
>   - obviously wrong settings now show "Preview only" instead of failing visitor by visitor;
>   - campaign labels from links are now limited to plain text, so a tampered link can't put spreadsheet formulas into the lead list.
> - Checked the page in a phone browser simulator at seven screen sizes, from a small iPhone to a wide desktop. There was no sideways scrolling; buttons and fields are large enough to tap; text is readable and passes contrast checks; and the form works with a keyboard.
>
> **Verified on a separate test database owned by the developer (13-10-2026):** a real signup was saved and confirmed.
>
> **Not yet verified:**
> - **No signup has been saved to NJEN's own database.** It hasn't been inspected or connected.
> - **The page isn't deployed anywhere yet.** The public Vercel address still shows an old version from late September.
> - Real iPhone and Facebook in-app browser testing needs a preview link.
>
> **One thing needed from you:** please create the private preview described in the attached steps. It doesn't touch your existing Vercel projects or collect anyone's details, and it stays private to your team and anyone you send the link to.
>
> The page will not go public until testing is complete and you approve the launch.
