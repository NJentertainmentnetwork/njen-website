// Tests for POST /api/early-access and its Supabase adapter, with the network
// replaced by a stub. Nothing here contacts Supabase or any other service, and
// no real key is used: the "keys" below are fixed fake strings.
//
// What a stub cannot prove: that a real Supabase project accepts the request.
// That was verified separately against a developer-owned test project
// (DAY22_IMPLEMENTATION_REPORT.md §3.3), and on NJEN's project not yet.
//
// Run with `npm test`.
import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

import { POST } from "@/app/api/early-access/route";
import { isSignupStorageConfigured } from "@/lib/early-access-store";
import { interpretSignupResponse } from "@/lib/early-access";

const URL_ = "https://abcdefghijklmnopqrst.supabase.co";
const SECRET = "sb_secret_FAKE_TEST_VALUE_not_a_real_key";
const jwt = (role) => `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ role })).replace(/=+$/, "")}.fakesignature`;

const NAME = "Zelda Testperson";
const EMAIL = "zelda.unique-marker@example.com";
const valid = { name: NAME, email: EMAIL, company: "", elapsedMs: 5000, source: "facebook", consent: false };

// --- Environment, network and console are swapped per test and restored. ---
const realFetch = globalThis.fetch;
const realConsole = { error: console.error, warn: console.warn, log: console.log, info: console.info };
const savedEnv = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY };

let calls;
let logs;
let provider; // (url, init) => Response | Promise<Response>; throws to simulate network failure
let ipCounter = 0;

function configure(url, key) {
  if (url === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = url;
  if (key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = key;
}

beforeEach(() => {
  calls = [];
  logs = [];
  provider = () => new Response(null, { status: 204 });
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return provider(String(url), init);
  };
  for (const level of Object.keys(realConsole)) {
    console[level] = (...args) => logs.push(args.map(String).join(" "));
  }
  configure(URL_, SECRET);
});

afterEach(() => {
  globalThis.fetch = realFetch;
  Object.assign(console, realConsole);
  configure(savedEnv.url, savedEnv.key);

  // Whatever happened in the test, nothing personal or secret reached a log.
  const joined = logs.join("\n");
  for (const forbidden of [NAME, EMAIL, "unique-marker", SECRET, "sb_secret_", "203.0.113.", "198.51.100."]) {
    assert.ok(!joined.includes(forbidden), `log output contained ${JSON.stringify(forbidden)}`);
  }
});

/** A fresh client IP per request, so the rate limiter only fires where tested. */
function nextIp() {
  ipCounter += 1;
  return `203.0.113.${ipCounter % 250}, 10.0.0.${ipCounter}`;
}

function post(body, { ip = nextIp(), headers = {}, raw } = {}) {
  return POST(
    new Request("http://localhost/api/early-access", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip, ...headers },
      body: raw ?? JSON.stringify(body),
    }),
  );
}

/** A body sent as a stream: no Content-Length header, like a chunked request. */
function postChunked(text, ip = nextIp()) {
  const bytes = new TextEncoder().encode(text);
  const stream = new ReadableStream({
    start(controller) {
      for (let at = 0; at < bytes.length; at += 1000) controller.enqueue(bytes.slice(at, at + 1000));
      controller.close();
    },
  });
  return POST(
    new Request("http://localhost/api/early-access", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: stream,
      duplex: "half",
    }),
  );
}

async function read(response) {
  return { status: response.status, body: await response.json(), type: response.headers.get("content-type") };
}

describe("storage configuration", () => {
  const cases = [
    ["both unset", undefined, undefined, false],
    ["URL only", URL_, undefined, false],
    ["key only", undefined, SECRET, false],
    ["empty strings", "", "", false],
    ["whitespace only", "  ", "  ", false],
    ["not a URL", "abcdefghijklmnopqrst.supabase.co", SECRET, false],
    ["plain http to a remote host", "http://abcdefghijklmnopqrst.supabase.co", SECRET, false],
    ["publishable key in the server variable", URL_, "sb_publishable_FAKE", false],
    ["legacy anon JWT in the server variable", URL_, jwt("anon"), false],
    ["legacy authenticated JWT", URL_, jwt("authenticated"), false],
    ["secret key", URL_, SECRET, true],
    ["legacy service_role JWT", URL_, jwt("service_role"), true],
    ["values with stray whitespace and newline", ` ${URL_}/ \n`, `${SECRET}\n`, true],
    ["http to localhost (local mock testing)", "http://127.0.0.1:54321", SECRET, true],
  ];

  for (const [label, url, key, expected] of cases) {
    it(`${label} -> ${expected ? "configured" : "not configured"}`, async () => {
      configure(url, key);
      assert.equal(isSignupStorageConfigured(), expected);

      const { status, body } = await read(await post(valid));
      if (expected) {
        assert.equal(status, 201);
        assert.equal(calls.length, 1);
      } else {
        assert.equal(status, 503);
        assert.deepEqual(body, { status: "not-configured" });
        assert.equal(calls.length, 0, "no request may be attempted without usable settings");
      }
    });
  }
});

describe("a valid signup", () => {
  it("is stored through the RPC and answered 201 'stored'", async () => {
    const { status, body, type } = await read(await post(valid));
    assert.equal(status, 201);
    assert.deepEqual(body, { status: "stored" });
    assert.match(type, /application\/json/);

    assert.equal(calls.length, 1);
    const [{ url, init }] = calls;
    assert.equal(url, `${URL_}/rest/v1/rpc/record_early_access_signup`);
    assert.equal(init.method, "POST");
    assert.equal(init.cache, "no-store");
    assert.ok(init.signal instanceof AbortSignal, "the request must carry a timeout signal");
  });

  it("sends exactly the five parameters the database function takes", async () => {
    const before = Date.now();
    await post({ ...valid, name: "  Zelda Testperson  ", email: ` ${EMAIL} ` });
    const sent = JSON.parse(calls[0].init.body);

    assert.deepEqual(Object.keys(sent).sort(), ["p_consent_text", "p_email", "p_name", "p_signed_up_at", "p_source"]);
    assert.equal(sent.p_name, NAME);
    assert.equal(sent.p_email, EMAIL);
    assert.equal(sent.p_source, "facebook");
    assert.equal(sent.p_consent_text, null);
    const at = Date.parse(sent.p_signed_up_at);
    assert.ok(at >= before - 1000 && at <= Date.now() + 1000, "timestamp comes from the server clock");
  });

  it("ignores a timestamp, IP or extra field the browser tries to send", async () => {
    await post({ ...valid, signedUpAt: "2000-01-01T00:00:00Z", p_signed_up_at: "2000-01-01", ip: "1.2.3.4", admin: true });
    const sent = JSON.parse(calls[0].init.body);
    assert.ok(!sent.p_signed_up_at.startsWith("2000"));
    assert.equal(Object.keys(sent).length, 5);
  });

  it("sends a secret key on apikey only, never as a Bearer token", async () => {
    await post(valid);
    const headers = calls[0].init.headers;
    assert.equal(headers.apikey, SECRET);
    assert.equal(headers.Authorization, undefined);
  });

  it("sends a legacy service_role JWT on both apikey and Authorization", async () => {
    const key = jwt("service_role");
    configure(URL_, key);
    await post(valid);
    assert.equal(calls[0].init.headers.apikey, key);
    assert.equal(calls[0].init.headers.Authorization, `Bearer ${key}`);
  });

  it("trims a pasted key and a trailing slash on the URL", async () => {
    configure(`${URL_}///`, `  ${SECRET}\r\n`);
    await post(valid);
    assert.equal(calls[0].url, `${URL_}/rest/v1/rpc/record_early_access_signup`);
    assert.equal(calls[0].init.headers.apikey, SECRET);
  });

  it("answers 'stored' for a repeat signup too (the database keeps one row)", async () => {
    assert.equal((await post(valid)).status, 201);
    assert.equal((await post({ ...valid, email: EMAIL.toUpperCase() })).status, 201);
    assert.equal(calls.length, 2);
  });
});

describe("campaign source", () => {
  const sourceSent = async (source) => {
    await post({ ...valid, source });
    return JSON.parse(calls[0].init.body).p_source;
  };

  it("keeps a Facebook utm_source label", async () => assert.equal(await sourceSent("facebook"), "facebook"));
  it("keeps a referrer host", async () => assert.equal(await sourceSent("l.facebook.com"), "l.facebook.com"));
  it("stores null when there is none", async () => assert.equal(await sourceSent(null), null));
  it("drops a spreadsheet formula", async () => assert.equal(await sourceSent("=HYPERLINK(\"x\")"), null));
  it("drops a label over 64 characters", async () => assert.equal(await sourceSent("a".repeat(65)), null));
  it("drops a non-string", async () => assert.equal(await sourceSent({ evil: true }), null));
  it("still stores the signup when the source is dropped", async () => {
    assert.equal((await post({ ...valid, source: "<script>" })).status, 201);
  });
});

describe("consent", () => {
  it("records no consent text while NJEN has approved no wording, even if the browser claims consent", async () => {
    await post({ ...valid, consent: true, consentText: "I agree to anything" });
    assert.equal(JSON.parse(calls[0].init.body).p_consent_text, null);
  });
});

describe("invalid input is rejected before any storage call", () => {
  const cases = [
    ["missing name", { ...valid, name: "" }, [{ field: "name", message: "Your name is required." }]],
    ["missing email", { ...valid, email: undefined }, [{ field: "email", message: "Email address is required." }]],
    ["invalid email", { ...valid, email: "not-an-email" }, [{ field: "email", message: "Enter a valid email address." }]],
    ["name too long", { ...valid, name: "a".repeat(121) }, [{ field: "name", message: "Your name must be 120 characters or fewer." }]],
    ["honeypot filled", { ...valid, company: "Acme" }, [{ field: "form", message: "This submission could not be accepted." }]],
    ["submitted too fast", { ...valid, elapsedMs: 10 }, [{ field: "form", message: "This submission could not be accepted." }]],
    // The real form always sends a number. A script that leaves the timing
    // signal out, or sends something else, must not skip the check.
    ["timing signal missing", { ...valid, elapsedMs: undefined }, [{ field: "form", message: "This submission could not be accepted." }]],
    ["timing signal not a number", { ...valid, elapsedMs: "5000" }, [{ field: "form", message: "This submission could not be accepted." }]],
    ["timing signal negative", { ...valid, elapsedMs: -5000 }, [{ field: "form", message: "This submission could not be accepted." }]],
  ];

  for (const [label, payload, errors] of cases) {
    it(label, async () => {
      const { status, body } = await read(await post(payload));
      assert.equal(status, 400);
      assert.deepEqual(body, { status: "invalid", errors });
      assert.equal(calls.length, 0);
    });
  }

  for (const [label, raw] of [
    ["malformed JSON", "{not json"],
    ["empty body", ""],
    ["JSON null", "null"],
    ["JSON string", "\"hello\""],
    ["JSON number", "42"],
  ]) {
    it(`${label} -> 400 'Invalid request.'`, async () => {
      const { status, body } = await read(await post(null, { raw }));
      assert.equal(status, 400);
      assert.deepEqual(body, { status: "invalid", errors: [{ field: "form", message: "Invalid request." }] });
      assert.equal(calls.length, 0);
    });
  }

  // A cross-site page can send text/plain or form bodies without a CORS
  // preflight, using its visitors' browsers (and IP addresses) to post signups.
  // Requiring JSON forces a preflight, which this route never approves.
  for (const type of ["text/plain", "text/plain;charset=UTF-8", "application/x-www-form-urlencoded", "multipart/form-data; boundary=x"]) {
    it(`Content-Type ${type} -> 415, nothing stored`, async () => {
      const { status, body } = await read(await post(valid, { headers: { "content-type": type } }));
      assert.equal(status, 415);
      assert.deepEqual(body, { status: "invalid", errors: [{ field: "form", message: "Invalid request." }] });
      assert.equal(calls.length, 0);
    });
  }

  it("accepts application/json with a charset", async () => {
    const { status } = await read(await post(valid, { headers: { "content-type": "application/json; charset=utf-8" } }));
    assert.equal(status, 201);
  });

  it("a JSON array gets field errors, not a crash", async () => {
    const { status, body } = await read(await post(null, { raw: "[1,2]" }));
    assert.equal(status, 400);
    assert.equal(body.status, "invalid");
    assert.equal(calls.length, 0);
  });

  // The form shows only errors that name one of its own fields (or "form"), so
  // every rejection this route can produce must survive that filter. A new
  // server-side field error that the form does not know would otherwise reach
  // the visitor as a generic "not saved" instead of the real reason.
  it("every rejection reaches the visitor as the same field or form message", async () => {
    const rejections = [
      ...cases.map(([, payload]) => post(payload)),
      post(null, { raw: "{not json" }),
      post(null, { raw: "[1,2]" }),
      post(null, { raw: "x".repeat(5000) }),
      post(valid, { headers: { "content-type": "text/plain" } }),
    ];
    for (const response of await Promise.all(rejections)) {
      const { body } = await read(response);
      assert.deepEqual(interpretSignupResponse(body), { kind: "invalid", errors: body.errors });
    }
  });
});

describe("request size limit (4,096 bytes)", () => {
  const padded = (bytes) => {
    const base = JSON.stringify(valid);
    return base.slice(0, -1) + " ".repeat(bytes - Buffer.byteLength(base)) + "}";
  };

  it("rejects a declared Content-Length over the limit without reading the body", async () => {
    const raw = padded(5000);
    const { status, body } = await read(await post(null, { raw, headers: { "content-length": String(raw.length) } }));
    assert.equal(status, 413);
    assert.deepEqual(body, { status: "invalid", errors: [{ field: "form", message: "Request too large." }] });
    assert.equal(calls.length, 0);
  });

  it("rejects a streamed body with no Content-Length once it passes 4,096 bytes", async () => {
    const { status } = await read(await postChunked(padded(4097)));
    assert.equal(status, 413);
    assert.equal(calls.length, 0);
  });

  it("rejects a large streamed body (1 MB)", async () => {
    assert.equal((await postChunked(padded(1024 * 1024))).status, 413);
  });

  it("accepts a streamed body of exactly 4,096 bytes", async () => {
    assert.equal((await postChunked(padded(4096))).status, 201);
  });

  it("counts bytes, not characters", async () => {
    // 1,400 three-byte characters is 4,200 bytes but only 1,400 characters.
    const text = JSON.stringify({ ...valid, name: "€".repeat(1400) });
    assert.equal((await postChunked(text)).status, 413);
  });

});

describe("storage failures never look like success", () => {
  for (const code of [400, 401, 403, 404, 409, 500, 503]) {
    it(`provider HTTP ${code} -> 502 'error', status-only log`, async () => {
      provider = () =>
        new Response(JSON.stringify({ message: `duplicate ${EMAIL} for key ${SECRET}`, hint: NAME }), { status: code });
      const { status, body } = await read(await post(valid));
      assert.equal(status, 502);
      assert.deepEqual(body, { status: "error" }, "no provider detail may reach the visitor");
      assert.deepEqual(logs, [`[early-access] signup store failed: HTTP ${code}`]);
    });
  }

  it("network failure -> 502, and the error object is not logged", async () => {
    provider = () => {
      throw new TypeError(`fetch failed for ${EMAIL} using ${SECRET}`);
    };
    const { status, body } = await read(await post(valid));
    assert.equal(status, 502);
    assert.deepEqual(body, { status: "error" });
    assert.deepEqual(logs, ["[early-access] signup store failed: network or timeout"]);
  });

  it("an aborted (timed-out) request -> 502", async () => {
    provider = () => {
      throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
    };
    assert.equal((await post(valid)).status, 502);
  });

  it("a provider that never answers is abandoned after about 8 seconds", { timeout: 15000 }, async () => {
    provider = (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => reject(init.signal.reason));
      });
    const started = Date.now();
    const { status } = await read(await post(valid));
    const took = Date.now() - started;
    assert.equal(status, 502);
    assert.ok(took >= 7500 && took < 12000, `gave up after ${took} ms`);
  });
});

describe("rate limit (5 per IP per 10 minutes, per server instance)", () => {
  it("answers 429 to the sixth request from one IP and stores nothing for it", async () => {
    const ip = "198.51.100.7";
    for (let i = 0; i < 5; i += 1) assert.equal((await post(valid, { ip })).status, 201);
    const { status, body } = await read(await post(valid, { ip }));
    assert.equal(status, 429);
    assert.deepEqual(body, { status: "rate-limited" });
    assert.equal(calls.length, 5);
  });

  it("counts invalid attempts too, so a script cannot probe without limit", async () => {
    const ip = "198.51.100.8";
    for (let i = 0; i < 5; i += 1) await post({ ...valid, email: "bad" }, { ip });
    assert.equal((await post(valid, { ip })).status, 429);
  });

  it("keys on the first X-Forwarded-For entry, so other visitors are unaffected", async () => {
    for (let i = 0; i < 5; i += 1) await post(valid, { ip: `198.51.100.9, 10.0.0.${i}` });
    assert.equal((await post(valid, { ip: "198.51.100.9, 10.9.9.9" })).status, 429);
    assert.equal((await post(valid, { ip: "198.51.100.10" })).status, 201);
  });
});
