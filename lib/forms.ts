/**
 * Launch form definitions and validation — provider independent.
 *
 * The contact UI may use these definitions for local preview validation, but
 * no route handler, storage, email send, or newsletter integration exists.
 * A real submission path needs server validation, rate limiting, C8 recipient
 * addresses, Resend access, and B6 consent/legal wording.
 *
 * Why this exists now: the field rules, validation and server-side boundary are
 * the same whichever provider is chosen, so they can be agreed and reviewed
 * before any vendor is connected.
 *
 * Rules these encode (Business Rules §5 "Input/API protection", 30-Day Plan):
 * - Validation always runs on the SERVER. Browser validation is convenience only.
 * - Values are trimmed and length-capped before use, to limit abuse.
 * - Every public submission is rate-limited and spam-checked (see SpamSignals).
 * - No legal, consent or marketing wording is invented here; NJEN supplies it.
 */

/** The launch forms. */
export type FormKind = "contact" | "newsletter" | "job-submission" | "early-access";

export type FieldKind = "text" | "email" | "url" | "textarea" | "select" | "checkbox";

export type FieldDefinition = {
  name: string;
  label: string;
  kind: FieldKind;
  required: boolean;
  /** Maximum accepted length, enforced server-side. */
  maxLength?: number;
  /** Allowed values for a select. */
  options?: string[];
  /** Short guidance shown with the field. */
  help?: string;
};

/**
 * Contact form. Recipient address and routing are a client dependency (C8).
 */
export const contactFields: FieldDefinition[] = [
  { name: "name", label: "Your name", kind: "text", required: true, maxLength: 120 },
  { name: "email", label: "Email address", kind: "email", required: true, maxLength: 254 },
  { name: "organization", label: "Organization", kind: "text", required: false, maxLength: 160 },
  {
    name: "topic",
    label: "What is your enquiry about?",
    kind: "select",
    required: true,
    // Routing categories, not business claims. Confirm with NJEN alongside C8.
    options: ["General", "Jobs", "Employer or production", "Press", "Accessibility"],
  },
  { name: "message", label: "Message", kind: "textarea", required: true, maxLength: 4000 },
];

/**
 * Newsletter / waitlist. There is no external newsletter platform or email
 * subscription workflow at launch. Consent wording (B6) remains deliberately
 * absent; future handling must use this one publication architecture.
 */
export const newsletterFields: FieldDefinition[] = [
  { name: "email", label: "Email address", kind: "email", required: true, maxLength: 254 },
  { name: "name", label: "Your name", kind: "text", required: false, maxLength: 120 },
];

/**
 * Moderated job submission (Business Rules §4). Nothing published by this form
 * goes live automatically: submissions enter the CMS as drafts for staff review.
 */
export const jobSubmissionFields: FieldDefinition[] = [
  { name: "organization", label: "Organization", kind: "text", required: true, maxLength: 160 },
  { name: "contactName", label: "Contact name", kind: "text", required: true, maxLength: 120 },
  { name: "contactEmail", label: "Contact email", kind: "email", required: true, maxLength: 254 },
  { name: "title", label: "Job title", kind: "text", required: true, maxLength: 160 },
  { name: "location", label: "Location", kind: "text", required: true, maxLength: 160 },
  { name: "employmentType", label: "Employment type", kind: "text", required: false, maxLength: 80 },
  { name: "compensation", label: "Compensation", kind: "text", required: false, maxLength: 160, help: "Display rules pending (register B3)." },
  { name: "description", label: "Job description", kind: "textarea", required: true, maxLength: 8000 },
  {
    name: "applicationMethod",
    label: "How should applicants apply?",
    kind: "textarea",
    required: true,
    maxLength: 1000,
    help: "NJEN does not receive applications; applicants are sent to you.",
  },
  { name: "applicationUrl", label: "Application link", kind: "url", required: false, maxLength: 2000 },
  { name: "closingDate", label: "Closing date", kind: "text", required: false, maxLength: 40 },
];

/**
 * Early Access signup (Day 15). Deliberately two fields: this is a conversion
 * page for inbound social traffic, and every extra field costs signups.
 *
 * Separate from `newsletter` because the name IS required here - NJEN asked to
 * capture it so Insider mail can be addressed properly - while the generic
 * newsletter definition keeps it optional. `signedUpAt` and `source` are not
 * listed: neither is typed by the visitor, and both are recorded server-side
 * where they cannot be forged.
 */
export const earlyAccessFields: FieldDefinition[] = [
  { name: "name", label: "Your name", kind: "text", required: true, maxLength: 120 },
  { name: "email", label: "Email address", kind: "email", required: true, maxLength: 254 },
];

export const formFields: Record<FormKind, FieldDefinition[]> = {
  contact: contactFields,
  newsletter: newsletterFields,
  "job-submission": jobSubmissionFields,
  "early-access": earlyAccessFields,
};

/**
 * Anti-abuse inputs collected alongside a submission. The checks run on the
 * server; any additional provider (for example a challenge service) is decided
 * when forms are built.
 */
export type SpamSignals = {
  /** Hidden field that real people leave empty. */
  honeypot?: string;
  /** Milliseconds between form render and submit; near-zero implies a bot. */
  elapsedMs?: number;
};

/**
 * Minimum plausible time to complete a form. Nobody fills in several fields,
 * including a message, in under a second.
 *
 * Deliberately low: this is a floor for obvious automation, not a speed limit on
 * people. Rate limiting (Days 18-23) is the separate control for volume, and it
 * belongs on the server route, not here.
 */
export const MIN_SUBMISSION_MS = 900;

export type FieldError = { field: string; message: string };

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: FieldError[] };

/** Submission outcome returned to the UI. Never includes internal error detail. */
export type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; errors?: FieldError[] };

// Deliberately simple and permissive: it rejects obvious mistakes without
// blocking valid, unusual addresses. Deliverability is the email provider's job.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validates and normalises a submission against a form definition.
 * Server-side use: never trust a browser-validated payload.
 */
export function validateSubmission(
  kind: FormKind,
  input: Record<string, unknown>,
  spam: SpamSignals = {},
): ValidationResult<Record<string, string>> {
  const errors: FieldError[] = [];

  // Bot signals are reported as a generic failure, never as a hint about which
  // check was tripped.
  const rejected: ValidationResult<Record<string, string>> = {
    ok: false,
    errors: [{ field: "form", message: "This submission could not be accepted." }],
  };

  if (spam.honeypot && spam.honeypot.trim() !== "") {
    return rejected;
  }

  const value: Record<string, string> = {};

  for (const field of formFields[kind]) {
    const raw = input[field.name];
    const text = typeof raw === "string" ? raw.trim() : raw == null ? "" : String(raw).trim();

    if (!text) {
      if (field.required) errors.push({ field: field.name, message: `${field.label} is required.` });
      continue;
    }
    if (field.maxLength && text.length > field.maxLength) {
      errors.push({ field: field.name, message: `${field.label} must be ${field.maxLength} characters or fewer.` });
      continue;
    }
    if (field.kind === "email" && !EMAIL_PATTERN.test(text)) {
      errors.push({ field: field.name, message: "Enter a valid email address." });
      continue;
    }
    if (field.kind === "url" && !isHttpUrl(text)) {
      errors.push({ field: field.name, message: "Enter a valid link starting with http:// or https://." });
      continue;
    }
    if (field.kind === "select" && field.options && !field.options.includes(text)) {
      errors.push({ field: field.name, message: `Choose one of the listed options for ${field.label}.` });
      continue;
    }

    value[field.name] = text;
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // Timing is checked last, and only on an otherwise complete submission. A
  // complete payload filled implausibly fast is the automated case worth
  // stopping; an incomplete one is a person who needs field errors, not a
  // generic rejection that tells them nothing.
  if (typeof spam.elapsedMs === "number" && Number.isFinite(spam.elapsedMs) && spam.elapsedMs < MIN_SUBMISSION_MS) {
    return rejected;
  }

  return { ok: true, value };
}
