// Unit tests for the Early Access rules shared by the browser and the server:
// field validation, anti-abuse signals, campaign-source handling and the
// mapping from API answer to what the visitor is told.
//
// Run with `npm test`. No network, no database, no environment variables.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { validateSubmission, MIN_SUBMISSION_MS } from "@/lib/forms";
import {
  interpretSignupResponse,
  normaliseSignupSource,
  readSignupSource,
  SIGNUP_FAILURE_MESSAGES,
} from "@/lib/early-access";

const valid = { name: "NJEN Test", email: "test@example.com" };
const human = { honeypot: "", elapsedMs: 5000 };

describe("validateSubmission('early-access')", () => {
  it("accepts a valid name and email, trimmed", () => {
    const result = validateSubmission("early-access", { name: "  NJEN Test ", email: " test@example.com " }, human);
    assert.deepEqual(result, { ok: true, value: { name: "NJEN Test", email: "test@example.com" } });
  });

  it("requires a name", () => {
    const result = validateSubmission("early-access", { ...valid, name: "   " }, human);
    assert.equal(result.ok, false);
    assert.deepEqual(result.errors, [{ field: "name", message: "Your name is required." }]);
  });

  it("requires an email", () => {
    const result = validateSubmission("early-access", { ...valid, email: undefined }, human);
    assert.deepEqual(result.errors, [{ field: "email", message: "Email address is required." }]);
  });

  it("reports both missing fields at once", () => {
    const result = validateSubmission("early-access", {}, human);
    assert.deepEqual(
      result.errors.map((error) => error.field),
      ["name", "email"],
    );
  });

  for (const email of ["no-at-sign", "a@b", "a@b.c", "two@@example.com", "spa ce@example.com", "@example.com"]) {
    it(`rejects the malformed email ${JSON.stringify(email)}`, () => {
      const result = validateSubmission("early-access", { ...valid, email }, human);
      assert.deepEqual(result.errors, [{ field: "email", message: "Enter a valid email address." }]);
    });
  }

  for (const email of ["first.last+tag@example.co.uk", "o'neil@example.com", "x@sub.example.org"]) {
    it(`accepts the unusual but valid email ${JSON.stringify(email)}`, () => {
      assert.equal(validateSubmission("early-access", { ...valid, email }, human).ok, true);
    });
  }

  it("caps the name at 120 characters", () => {
    assert.equal(validateSubmission("early-access", { ...valid, name: "a".repeat(120) }, human).ok, true);
    const result = validateSubmission("early-access", { ...valid, name: "a".repeat(121) }, human);
    assert.deepEqual(result.errors, [{ field: "name", message: "Your name must be 120 characters or fewer." }]);
  });

  it("caps the email at 254 characters", () => {
    const local = "a".repeat(254 - "@example.com".length);
    assert.equal(validateSubmission("early-access", { ...valid, email: `${local}@example.com` }, human).ok, true);
    const result = validateSubmission("early-access", { ...valid, email: `a${local}@example.com` }, human);
    assert.equal(result.errors[0].field, "email");
  });

  it("turns non-string values into text rather than crashing", () => {
    const result = validateSubmission("early-access", { name: 12345, email: ["x"] }, human);
    assert.equal(result.ok, false);
    assert.deepEqual(result.errors, [{ field: "email", message: "Enter a valid email address." }]);
  });

  it("rejects a filled honeypot with a generic message that names no check", () => {
    const result = validateSubmission("early-access", valid, { honeypot: "Acme", elapsedMs: 5000 });
    assert.deepEqual(result.errors, [{ field: "form", message: "This submission could not be accepted." }]);
  });

  it(`rejects a complete submission made faster than ${MIN_SUBMISSION_MS} ms`, () => {
    const result = validateSubmission("early-access", valid, { honeypot: "", elapsedMs: MIN_SUBMISSION_MS - 1 });
    assert.deepEqual(result.errors, [{ field: "form", message: "This submission could not be accepted." }]);
    assert.equal(validateSubmission("early-access", valid, { honeypot: "", elapsedMs: MIN_SUBMISSION_MS }).ok, true);
  });

  it("gives field errors, not the generic rejection, to a fast but incomplete submission", () => {
    const result = validateSubmission("early-access", { ...valid, name: "" }, { honeypot: "", elapsedMs: 10 });
    assert.equal(result.errors[0].field, "name");
  });
});

describe("normaliseSignupSource", () => {
  for (const source of ["facebook", "fb_ads", "l.facebook.com", "spring-2027", "Facebook Ads", "ig:story", "loom-demo"]) {
    it(`keeps the campaign label ${JSON.stringify(source)}`, () => {
      assert.equal(normaliseSignupSource(source), source);
    });
  }

  it("trims surrounding space", () => {
    assert.equal(normaliseSignupSource("  facebook  "), "facebook");
  });

  // A spreadsheet treats a cell starting with = + - @ as a formula.
  for (const source of ["=HYPERLINK(\"http://x\")", "+1", "-2", "@SUM(A1)", " =1+1"]) {
    it(`drops the formula-like label ${JSON.stringify(source)}`, () => {
      assert.equal(normaliseSignupSource(source), null);
    });
  }

  for (const source of ["fb<script>", "a\nb", "a\tb", "x;y", "a,b", "\"quoted\""]) {
    it(`drops the label with unsafe characters ${JSON.stringify(source)}`, () => {
      assert.equal(normaliseSignupSource(source), null);
    });
  }

  it("keeps 64 characters and drops 65", () => {
    assert.equal(normaliseSignupSource("a".repeat(64)), "a".repeat(64));
    assert.equal(normaliseSignupSource("a".repeat(65)), null);
  });

  for (const value of [undefined, null, 42, {}, ["facebook"], "", "   "]) {
    it(`returns null for ${JSON.stringify(value) ?? "undefined"}`, () => {
      assert.equal(normaliseSignupSource(value), null);
    });
  }
});

describe("readSignupSource (browser side)", () => {
  it("prefers ?source=, then ?utm_source=, then ?ref=", () => {
    assert.equal(readSignupSource("?ref=c&utm_source=b&source=a", ""), "a");
    assert.equal(readSignupSource("?ref=c&utm_source=b", ""), "b");
    assert.equal(readSignupSource("?ref=c", ""), "c");
  });

  it("reads a Facebook campaign link", () => {
    assert.equal(
      readSignupSource("?utm_source=facebook&utm_medium=paid&utm_campaign=launch&fbclid=abc", ""),
      "facebook",
    );
  });

  it("falls back to the referring host only, never its path or query", () => {
    assert.equal(readSignupSource("", "https://l.facebook.com/l.php?u=https%3A%2F%2Fexample.org&h=secret"), "l.facebook.com");
  });

  it("skips an unsafe parameter and uses the next one", () => {
    assert.equal(readSignupSource("?source=%3D1%2B1&utm_source=facebook", ""), "facebook");
  });

  it("truncates an over-long parameter to 64 characters", () => {
    assert.equal(readSignupSource(`?utm_source=${"a".repeat(80)}`, ""), "a".repeat(64));
  });

  it("returns null for a direct visit or an unparseable referrer", () => {
    assert.equal(readSignupSource("", ""), null);
    assert.equal(readSignupSource("", "not a url"), null);
  });
});

describe("interpretSignupResponse (what the visitor is told)", () => {
  it("claims success only for status 'stored'", () => {
    assert.deepEqual(interpretSignupResponse({ status: "stored" }), { kind: "stored" });
  });

  it("shows the not-saved preview screen for 'not-configured'", () => {
    assert.deepEqual(interpretSignupResponse({ status: "not-configured" }), { kind: "preview" });
  });

  it("passes field errors through for 'invalid'", () => {
    const errors = [{ field: "email", message: "Enter a valid email address." }];
    assert.deepEqual(interpretSignupResponse({ status: "invalid", errors }), { kind: "invalid", errors });
  });

  it("passes a form-level rejection through, so the guard's message is shown", () => {
    const errors = [{ field: "form", message: "This submission could not be accepted." }];
    assert.deepEqual(interpretSignupResponse({ status: "invalid", errors }), { kind: "invalid", errors });
  });

  it("drops errors naming a field the form does not have, keeping the rest", () => {
    const email = { field: "email", message: "Enter a valid email address." };
    const body = { status: "invalid", errors: [{ field: "company", message: "x" }, email] };
    assert.deepEqual(interpretSignupResponse(body), { kind: "invalid", errors: [email] });
  });

  it("drops a consent error while no consent box exists", () => {
    const body = { status: "invalid", errors: [{ field: "consent", message: "Please tick the box to continue." }] };
    assert.deepEqual(interpretSignupResponse(body), { kind: "failed", message: SIGNUP_FAILURE_MESSAGES.serverError });
  });

  it("tells a rate-limited visitor to wait", () => {
    assert.deepEqual(interpretSignupResponse({ status: "rate-limited" }), {
      kind: "failed",
      message: SIGNUP_FAILURE_MESSAGES.rateLimited,
    });
  });

  const notSaved = { kind: "failed", message: SIGNUP_FAILURE_MESSAGES.serverError };
  for (const body of [
    { status: "error" },
    null, // the reply was not JSON: a platform error page or proxy timeout
    undefined,
    "stored",
    { status: "STORED" },
    { status: "invalid" },
    { status: "invalid", errors: "bad" },
    { status: "invalid", errors: [{ nope: 1 }] },
    // An unknown field would have the form focus the hidden honeypot (#company)
    // or some unrelated element, under "correct the highlighted fields".
    { status: "invalid", errors: [{ field: "company", message: "Company is required." }] },
    { status: "invalid", errors: [{ field: "main", message: "x" }] },
    { ok: true },
    [],
  ]) {
    it(`says "not saved" for ${JSON.stringify(body) ?? "undefined"}`, () => {
      assert.deepEqual(interpretSignupResponse(body), notSaved);
    });
  }

  it("never words a failure as a success", () => {
    for (const message of Object.values(SIGNUP_FAILURE_MESSAGES)) {
      assert.doesNotMatch(message, /you're in|welcome/i);
    }
    assert.match(SIGNUP_FAILURE_MESSAGES.serverError, /not saved/);
    assert.match(SIGNUP_FAILURE_MESSAGES.network, /not saved/);
  });
});
