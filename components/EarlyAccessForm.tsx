"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { earlyAccessFields, validateSubmission, type FieldError } from "@/lib/forms";
import {
  EARLY_ACCESS_CONSENT,
  interpretSignupResponse,
  readSignupSource,
  SIGNUP_FAILURE_MESSAGES,
} from "@/lib/early-access";

/**
 * The Early Access signup form.
 *
 * Two fields and one button. This page exists to convert inbound social
 * traffic, and every extra field costs signups, so name and email are the whole
 * form; the timestamp and the campaign source are recorded server-side.
 *
 * Validation reuses the shared rules in `lib/forms.ts` rather than duplicating
 * an email check, and the honeypot plus submission-timing guard are the same
 * anti-abuse pattern as the contact form. Both run again on the server, which
 * is the check that actually protects the table.
 *
 * HONESTY RULE: the success screen is shown only when the server confirms a row
 * was stored. `storageEnabled` is resolved on the server and passed in, so the
 * page knows before anyone types whether a signup can be kept, and says so.
 */

type Props = {
  /** True when the server has a configured, writable signup destination. */
  storageEnabled: boolean;
};

export function EarlyAccessForm({ storageEnabled }: Props) {
  const startedAt = useRef(Date.now());
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [status, setStatus] = useState<"idle" | "submitting" | "stored" | "preview">("idle");
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const submitButton = useRef<HTMLButtonElement>(null);
  /** Where keyboard focus goes once the next render has committed. */
  const focusAfterRender = useRef<string | null>(null);

  // Read once on mount: the campaign source is only knowable in the browser.
  useEffect(() => {
    setSource(readSignupSource(window.location.search, document.referrer));
  }, []);

  // The result screens replace the form, taking the focused control with it.
  // Moving focus to the result heading keeps keyboard users in place and has a
  // screen reader read the outcome, which a status region inserted together
  // with its text does not reliably do.
  useEffect(() => {
    if (status === "stored" || status === "preview") resultHeading.current?.focus();
  }, [status]);

  // Deferred until after the render because the fields and the button are
  // disabled while a request is in flight, and focusing a disabled control does
  // nothing. Focusing straight from the response handler left focus on the
  // page body, even when the server had flagged a field.
  useEffect(() => {
    const target = focusAfterRender.current;
    if (!target) return;
    focusAfterRender.current = null;
    if (target === "submit") {
      // Only when focus was lost with the disabled button; never steal it.
      if (!document.activeElement || document.activeElement === document.body) submitButton.current?.focus();
      return;
    }
    document.getElementById(target)?.focus();
  });

  function errorFor(name: string) {
    return errors.find((error) => error.field === name)?.message;
  }

  function fail(fieldErrors: FieldError[], message: string) {
    // A rejection carrying only a "form" error is the anti-abuse guard firing -
    // a filled honeypot, or a submit faster than a person can type. Autofill
    // can trip the timing guard on a real visitor, so its message is shown as
    // the form-level message. Saying "correct the highlighted fields" when
    // nothing is highlighted leaves them with no way forward.
    const formLevel = fieldErrors.find((error) => error.field === "form");
    const fieldLevel = fieldErrors.filter((error) => error.field !== "form");

    setErrors(fieldLevel);
    setFormMessage(fieldLevel.length > 0 ? message : (formLevel?.message ?? message));
    setStatus("idle");

    // Take keyboard and screen reader users straight to what needs fixing, or
    // back to the button when there is nothing to fix; the message itself is
    // announced by the alert region.
    focusAfterRender.current = fieldLevel[0]?.field ?? "submit";
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const data = new FormData(event.currentTarget);
    const input = { name: data.get("name"), email: data.get("email") };
    const elapsedMs = Date.now() - startedAt.current;
    const result = validateSubmission("early-access", input, {
      honeypot: String(data.get("company") ?? ""),
      elapsedMs,
    });

    if (!result.ok) {
      fail(result.errors, "Please correct the highlighted fields.");
      return;
    }

    if (EARLY_ACCESS_CONSENT?.required && !consent) {
      fail([{ field: "consent", message: "Please tick the box to continue." }], "Please correct the highlighted fields.");
      return;
    }

    setErrors([]);
    setFormMessage(null);
    setStatus("submitting");

    try {
      const response = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.value.name,
          email: result.value.email,
          source,
          company: String(data.get("company") ?? ""),
          elapsedMs,
          consent,
        }),
      });

      // A reply that is not JSON (a platform error page, a proxy timeout) is a
      // server-side failure, not a connection problem; it maps to "not saved".
      const body: unknown = await response.json().catch(() => null);
      const outcome = interpretSignupResponse(body);

      if (outcome.kind === "stored") {
        setStatus("stored");
        return;
      }
      if (outcome.kind === "preview") {
        // Deliberately NOT presented as success: nothing was saved.
        setStatus("preview");
        return;
      }
      if (outcome.kind === "invalid") {
        fail(outcome.errors, "Please correct the highlighted fields.");
        return;
      }
      fail([], outcome.message);
    } catch {
      fail([], SIGNUP_FAILURE_MESSAGES.network);
    }
  }

  // --- Confirmed: a row exists. This is the only screen that claims a signup.
  if (status === "stored") {
    return (
      <div className="ea-success" role="status">
        <h3 className="ea-success-title" ref={resultHeading} tabIndex={-1}>
          You&apos;re in. Welcome to NJEN.
        </h3>
        <p>
          Watch your email for NJEN Insider updates, directories, opportunities, special offers, event
          announcements and information about our official launch.
        </p>
      </div>
    );
  }

  // --- Valid, but there was nowhere to store it. Say exactly that.
  if (status === "preview") {
    return (
      <div className="ea-success" role="status">
        <h3 className="ea-success-title" ref={resultHeading} tabIndex={-1}>
          Checked - but not saved
        </h3>
        <p className="ea-notice ea-notice-inline">
          <strong>Preview only.</strong> The early access list is not connected yet, so{" "}
          <strong>your details were not saved or sent anywhere</strong>. This screen is here so the wording and
          design can be approved before the page goes live.
        </p>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form className="ea-form" onSubmit={onSubmit} noValidate>
      {storageEnabled ? null : (
        <p className="ea-notice">
          <strong>Preview only.</strong> This page cannot collect signups yet. Nothing you enter is sent or
          stored.
        </p>
      )}

      {earlyAccessFields.map((field) => {
        const error = errorFor(field.name);
        const isEmail = field.kind === "email";
        return (
          <div className="ea-field" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            <input
              id={field.name}
              name={field.name}
              type={isEmail ? "email" : "text"}
              inputMode={isEmail ? "email" : undefined}
              autoComplete={isEmail ? "email" : "name"}
              enterKeyHint={isEmail ? "go" : "next"}
              placeholder={isEmail ? "you@example.com" : "First and last name"}
              maxLength={field.maxLength}
              required={field.required}
              disabled={submitting}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${field.name}-error` : undefined}
            />
            {error ? (
              <p className="ea-error" id={`${field.name}-error`}>
                {error}
              </p>
            ) : null}
          </div>
        );
      })}

      {/* Bot trap: off-screen, hidden from assistive technology, not focusable. */}
      <div className="form-honeypot" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      {/*
        Consent control. Rendered only when NJEN has supplied approved wording
        (see EARLY_ACCESS_CONSENT). No legal text is written here.
      */}
      {EARLY_ACCESS_CONSENT ? (
        <div className="ea-consent-field">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            checked={consent}
            disabled={submitting}
            onChange={(event) => setConsent(event.target.checked)}
            aria-invalid={Boolean(errorFor("consent"))}
            aria-describedby={errorFor("consent") ? "consent-error" : undefined}
          />
          <label htmlFor="consent">
            {EARLY_ACCESS_CONSENT.text}{" "}
            <a href={EARLY_ACCESS_CONSENT.privacyPolicyUrl}>Privacy Policy</a>
          </label>
          {errorFor("consent") ? (
            <p className="ea-error" id="consent-error">
              {errorFor("consent")}
            </p>
          ) : null}
        </div>
      ) : null}

      <button className="ea-submit" type="submit" disabled={submitting} ref={submitButton}>
        {submitting ? "Sending…" : "Get early access"}
      </button>

      {/*
        Form-level messages (network failure, rate limit, "fix the fields").
        role="alert" so they are announced the moment they appear, and the live
        region is always in the DOM so it is not missed on first render.
      */}
      <p className="ea-form-message" role="alert">
        {formMessage}
      </p>

      <p className="ea-consent">Free to join. No spam. Unsubscribe anytime.</p>
    </form>
  );
}
