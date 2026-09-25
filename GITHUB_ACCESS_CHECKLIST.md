# NJEN GitHub Setup — Client Checklist

**Goal:** NJEN owns the code repository permanently. The developer works in it
with limited access and never becomes its owner.

**Status:** waiting on NJEN. No GitHub accounts, organizations or repositories
have been created, and no GitHub commands have been run. The NJEN code currently
exists only on the developer's local machine.

## How ownership works

```
NJEN GitHub Organization          ← owned by NJEN
   │
   └── NJEN repository             ← NJEN = Owner / Admin
          │
          └── Developer            ← invited collaborator, "Write" access only
```

- NJEN's own people are **Owners** of the organization.
- The developer is **invited** with limited access and can be removed at any time.
- If the developer relationship ends, NJEN removes that access. The code, history and settings stay with NJEN.

## What NJEN should do

### Step 1 — Create a GitHub Organization (recommended)

An **Organization** is better than a personal account for a business:

- It belongs to NJEN, not to any one person.
- Several NJEN people can be Owners, so access isn't lost if one person leaves.
- Access can be granted and removed per person without sharing passwords.

**How:** sign in to GitHub with an NJEN-controlled account → profile picture → **Your organizations** → **New organization**.

- Suggested name: `njen` or similar, if available.
- Use an **NJEN company email address** for the owner account, not a personal one.
- Add **at least two NJEN Owners**, so NJEN is never locked out.
- Turn on **two-factor authentication** for every Owner account.
- Recommended: require two-factor authentication for all organization members (**Settings → Authentication security**).

### Step 2 — Choose a plan

| Plan | Approx. cost | What it means for NJEN |
|---|---|---|
| **Free** | $0 | Unlimited private repositories and collaborators. Cannot protect the main branch in a private repository. |
| **Team** | about $4 per user/month | Adds **protected branches, required reviews and code owners** in private repositories. |

*Prices from GitHub's pricing page, 17-09-2026; GitHub listed the Team price as
"for the first 12 months". Approximate and subject to change.*

**Recommendation:** the **Team** plan. Protected branches stop unreviewed or
accidental changes from reaching the production branch. With one NJEN Owner and
one developer, that's roughly $8/month. **Free** works if NJEN prefers to start
at no cost; branch protection can be added later.

### Step 3 — Create one private repository

Inside the NJEN organization → **New repository**.

- Name, for example: `njen-website`
- Visibility: **Private**
- **Leave it completely empty** — no README, no .gitignore, no licence. The developer will upload the existing Release 1.3 code into it, and an empty repository avoids conflicts.

### Step 4 — Invite the developer

Repository → **Settings → Collaborators and teams → Add people**.

- **Invite:** the developer's GitHub username. *The developer will send this to NJEN separately; it is not recorded in this document.*
- **Role:** **Write**

## What the "Write" role allows

**The developer can:**
- Upload code and create branches.
- Open and merge pull requests.
- Run automated checks.

**The developer cannot:**
- Delete the repository.
- Transfer it to another account.
- Change it from private to public.
- Add or remove people.
- Change branch-protection rules.
- Change repository settings.

*(Source: GitHub documentation on repository roles.)*

If the developer later needs to configure repository settings, NJEN can
temporarily raise access to **Maintain** or **Admin** and lower it afterwards.

## What the developer does NOT need

- ❌ NJEN's GitHub password — **never share it**
- ❌ Organization Owner access
- ❌ Repository Admin access, by default
- ❌ Billing access
- ❌ Personal access tokens or API keys from NJEN
- ❌ Access to any other NJEN repositories

## What will never go into the repository

Passwords, API keys, tokens, `.env` secret files, production or database
credentials, and private member or performer data. Secrets are stored in the
hosting provider's encrypted environment settings, never in code.

## After NJEN completes the steps above

The developer will, once NJEN confirms access:

1. Accept the invitation.
2. Upload the current local Release 1.3 work to the empty NJEN repository.
3. Confirm the repository contains no secrets.
4. Propose branch protection and a simple branch workflow for NJEN to approve. Requires Team for the private repository.
5. Connect the repository to staging hosting once the hosting decision is made (see `TECHNICAL_RECOMMENDATIONS.md`).

## Summary — what NJEN needs to send back

| # | Item |
|---|---|
| 1 | Confirmation the NJEN GitHub Organization exists, and its name |
| 2 | Chosen plan: Free or Team |
| 3 | Repository name, created private and empty |
| 4 | Confirmation the developer's GitHub username was invited with **Write** access |
| 5 | Names of the NJEN Owners, with two-factor authentication enabled |
