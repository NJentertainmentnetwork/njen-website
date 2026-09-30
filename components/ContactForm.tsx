"use client";

import { useRef, useState, type FormEvent } from "react";
import { contactFields, validateSubmission, type FieldError } from "@/lib/forms";

/**
 * PREVIEW ONLY. This form never sends, emails, stores or transmits anything:
 * there is no route handler, server action, email provider or database behind
 * it. Validation runs locally so the fields and messages can be reviewed.
 *
 * Before it can accept real enquiries it needs: approved recipients (register
 * C8), approved consent/legal wording (B6), server-side validation, spam and
 * rate limiting, and Resend access (D5/T5).
 */
export function ContactForm() {
  const startedAt = useRef(Date.now());
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  function errorFor(name: string) {
    return errors.find((error) => error.field === name)?.message;
  }

  // A plain submit handler is used instead of a form `action`: React resets the
  // form after an action runs, which wiped everything the visitor had typed —
  // including a long message — even when validation failed.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const honeypot = String(formData.get("website") ?? "");
    const input = Object.fromEntries(formData.entries());
    const result = validateSubmission("contact", input, { honeypot, elapsedMs: Date.now() - startedAt.current });

    if (!result.ok) {
      setErrors(result.errors);
      setMessage("Please correct the highlighted fields.");
      // Move focus to the first field with an error so keyboard and screen
      // reader users are taken straight to what needs fixing.
      const firstField = result.errors.find((error) => error.field !== "form")?.field;
      if (firstField) {
        document.getElementById(firstField)?.focus();
      }
      return;
    }

    setErrors([]);
    setMessage("Checked locally. Nothing was sent or stored: contact delivery is not set up yet.");
  }

  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <p className="notice" role="note">
        <strong>Preview only.</strong> This form cannot send messages yet. Nothing you enter is sent, emailed or
        stored. It is here so the fields and wording can be reviewed before contact delivery is set up.
      </p>
      <p className="text-muted">Fields marked required are needed to prepare your message.</p>
      {contactFields.map((field) => {
        const error = errorFor(field.name);
        // Both are announced when both exist: an error must not silence the
        // field's guidance, which is often what explains how to fix it.
        const describedBy =
          [field.help ? `${field.name}-help` : null, error ? `${field.name}-error` : null]
            .filter(Boolean)
            .join(" ") || undefined;

        return (
          <div className="form-field" key={field.name}>
            <label htmlFor={field.name}>
              {field.label} {field.required ? <span aria-hidden="true">*</span> : null}
            </label>
            {field.kind === "textarea" ? (
              <textarea
                id={field.name}
                name={field.name}
                required={field.required}
                maxLength={field.maxLength}
                aria-invalid={Boolean(error)}
                aria-describedby={describedBy}
                rows={6}
              />
            ) : field.kind === "select" ? (
              <select
                id={field.name}
                name={field.name}
                required={field.required}
                aria-invalid={Boolean(error)}
                aria-describedby={describedBy}
                defaultValue=""
              >
                <option value="" disabled>
                  Choose a topic
                </option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={field.name}
                name={field.name}
                type={field.kind}
                required={field.required}
                maxLength={field.maxLength}
                aria-invalid={Boolean(error)}
                aria-describedby={describedBy}
              />
            )}
            {field.help ? <small id={`${field.name}-help`}>{field.help}</small> : null}
            {error ? (
              <p className="form-error" id={`${field.name}-error`}>
                {error}
              </p>
            ) : null}
          </div>
        );
      })}
      {/* Bot trap: hidden from people and from assistive technology, and not focusable. */}
      <div className="form-honeypot" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {message ? (
        <p className="form-status" role="status">
          {message}
        </p>
      ) : null}
      <button className="button button-primary" type="submit">
        Check message
      </button>
    </form>
  );
}
