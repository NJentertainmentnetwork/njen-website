"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { validateSubmission } from "@/lib/forms";
import {
  EARLY_ACCESS_SIGNUPS_ENABLED,
  readSignupSource,
  type EarlyAccessSignup,
} from "@/lib/early-access";

/**
 * Email capture for the Early Access page.
 *
 * Validation reuses the shared `newsletter` rules in `lib/forms.ts` rather than
 * duplicating an email check. The honeypot and the submission-timing guard are
 * the same anti-abuse pattern used by the contact form.
 *
 * NOTHING IS SENT OR STORED while `EARLY_ACCESS_SIGNUPS_ENABLED` is false: see
 * `lib/early-access.ts`. The page says so before anyone types, and again after
 * they submit, so no address is ever collected under a false impression.
 */
export function EarlyAccessForm() {
  const startedAt = useRef(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [signup, setSignup] = useState<EarlyAccessSignup | null>(null);
  const [source, setSource] = useState<string | null>(null);

  // Read once on mount: the campaign source is only knowable in the browser.
  useEffect(() => {
    setSource(readSignupSource(window.location.search, document.referrer));
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = validateSubmission(
      "newsletter",
      { email: data.get("email") },
      { honeypot: String(data.get("company") ?? ""), elapsedMs: Date.now() - startedAt.current },
    );

    if (!result.ok) {
      setError(result.errors.find((e) => e.field === "email")?.message ?? "Enter a valid email address.");
      document.getElementById("email")?.focus();
      return;
    }

    setError(null);
    setSignup({ email: result.value.email, signedUpAt: new Date().toISOString(), source });
  }

  if (signup) {
    return (
      <div className="ea-success" role="status">
        <h2 className="ea-success-title">You&apos;re in. Welcome to NJEN.</h2>
        <p>
          Watch your email for NJEN Insider updates, directories, opportunities, special offers, event
          announcements and information about our official launch.
        </p>
        {EARLY_ACCESS_SIGNUPS_ENABLED ? null : (
          <p className="ea-notice ea-notice-inline">
            <strong>Preview only.</strong> The early access list is not connected yet, so{" "}
            <strong>{signup.email} was not saved or sent anywhere</strong>. This screen is here so the wording
            and design can be approved before the page goes live.
          </p>
        )}
      </div>
    );
  }

  return (
    <form className="ea-form" onSubmit={onSubmit} noValidate>
      {EARLY_ACCESS_SIGNUPS_ENABLED ? null : (
        <p className="ea-notice">
          <strong>Preview only.</strong> This page cannot collect signups yet. Nothing you enter is sent or
          stored.
        </p>
      )}
      <div className="ea-field">
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          enterKeyHint="go"
          placeholder="you@example.com"
          maxLength={254}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "email-error" : undefined}
        />
        {error ? (
          <p className="ea-error" id="email-error">
            {error}
          </p>
        ) : null}
      </div>
      {/* Bot trap: off-screen, hidden from assistive technology, not focusable. */}
      <div className="form-honeypot" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>
      <button className="ea-submit" type="submit">
        Yes - I want early access
      </button>
      <p className="ea-consent">Free to join. No spam. Unsubscribe anytime.</p>
    </form>
  );
}
