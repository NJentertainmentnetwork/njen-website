/**
 * Email service contract — provider independent.
 *
 * TYPES ONLY. No provider SDK, no API key, no sending, and nothing imports this
 * yet. Resend is the approved transactional provider (register D5/T5) but is not
 * connected. Newsletter/publication content is CMS-managed and no mass-email
 * provider is approved or needed for this launch.
 *
 * `FUTURE_PROOF_ARCHITECTURE.md` requires a small server-only email module so the
 * provider can change without touching application code. This is that boundary:
 * the application sends application-level messages, not provider payloads.
 *
 * Rules:
 * - Server-only. An API key must never reach the browser.
 * - Recipients come from configuration (register C8), never from user input.
 * - Never email private data that the recipient is not entitled to see.
 * - Sending failures must not expose provider errors to visitors; the form shows
 *   a generic message and the error goes to monitoring (Sentry, Week 3/4).
 */

/** Application-level messages the launch site needs to send. */
export type EmailMessageKind =
  | "contact-enquiry"
  | "job-submission-received";

export type EmailAddress = {
  email: string;
  name?: string;
};

export type EmailMessage = {
  kind: EmailMessageKind;
  to: EmailAddress[];
  /** Where replies should go, e.g. the person who used the contact form. */
  replyTo?: EmailAddress;
  subject: string;
  /** Plain-text body. HTML templates are added with the provider in Week 3. */
  text: string;
};

export type EmailSendResult =
  | { ok: true; id?: string }
  | { ok: false; reason: "invalid" | "rate-limited" | "provider-error" };

/**
 * Implemented once per provider, server-side only. The application depends on
 * this type, never on a provider SDK.
 */
export type EmailSender = {
  send: (message: EmailMessage) => Promise<EmailSendResult>;
};
