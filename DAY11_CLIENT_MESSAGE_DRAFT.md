# Day 11 — Client Message Draft (NOT SENT)

> **Draft for your review.** Nothing has been sent. This covers only what is *new* since the Day 10 message — it deliberately does not repeat the Supabase, domain, legal-wording or repository questions already asked there.

---

Hi,

Good news first: **the site is live and behaving correctly.** I checked `https://njen-website.vercel.app` from the outside today. The published pages load, the unfinished sections correctly return "not found", search engines are still blocked as intended before launch, and all the security headers are in place. The Vercel 404 problem is resolved.

Two new things I need from you, both on Vercel.

## 1. Which of the three Vercel projects is the official one?

There are currently three projects connected to the same GitHub repository:

- `njen-website`
- `njen-website-live`
- `njen-website-production`

All three build the same code, so you get three copies of the same site. That is harmless right now, but it becomes a real problem the moment we attach the domain and set the launch settings: if those are added to the wrong project, nothing appears to happen and it is genuinely tedious to track down.

**Please confirm which one is official**, and pause or delete the other two. I won't touch any of them — that is your call and your account.

## 2. Please turn on Vercel Authentication for Preview deployments

This keeps the staging/preview versions of the site off the public internet, so only people you invite can see work in progress. It is included at no extra cost. I cannot check or change this without dashboard access.

## What I built today

The jobs board now has **filters for category, location and employment type** — the three the plan calls for, kept deliberately small. They work without JavaScript, each filtered view has its own shareable link, and the filtering happens on the server so it can only ever narrow what is already approved for publication.

It is tested: type checking and the build pass, 28 behaviour and security checks pass, the accessibility scan found zero issues across the filtered and unfiltered views, and there is no layout breakage from 320 px up to 1440 px. I have not tested on a real iPhone or with a screen reader — that needs physical devices and is scheduled for the QA week.

The listings behind the filters are still the labelled example jobs, and they stay hidden from search engines until real listings replace them.

## What is still waiting on you

The big one remains the **Supabase project**. That single item unblocks three of this week's five planned tasks: putting real jobs into the board, connecting the Career Center / Events / What's Filming sections to a content system, and building the employer job-posting workflow. Until it exists, those cannot start — the CMS cannot run without a database.

Everything else I flagged in the Day 10 message still stands.

Happy to jump on a call if that is easier.

Best regards,
Viral
