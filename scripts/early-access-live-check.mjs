// Early Access live check - LOCAL DEVELOPMENT ONLY.
//
// Exercises a running local build of this site (`npm run build && npm run start`)
// over HTTP, exactly as a browser would. It is the API half of the Day 22
// developer-owned Supabase test; the other half is a count-only SQL query in the
// Supabase SQL Editor, which this script prints at the end. A 201 alone is not
// proof that a row exists.
//
// SAFETY
// - Refuses any base URL that is not localhost: it must never send test signups
//   to a deployed site.
// - Never reads .env files and never sees a key. The server under test holds
//   the credentials; this script only sees HTTP status codes.
// - Prints the test address masked. Use an address you control.
// - Each request carries its own X-Forwarded-For so the per-IP rate limit does
//   not interfere. That only works locally: Vercel overwrites the header.
//
// USAGE
//   node scripts/early-access-live-check.mjs --mode configured --email you+njen-test@your-domain
//   node scripts/early-access-live-check.mjs --mode unconfigured
//   node scripts/early-access-live-check.mjs --mode failure --email you+njen-test@your-domain
//   Optional: --base http://localhost:3000 (the default)
//
// MODES
//   configured    Server built and started with SUPABASE_URL and
//                 SUPABASE_SERVICE_ROLE_KEY set. Expects real stores (201).
//   unconfigured  Server built and started with neither set. Expects 503
//                 "not-configured" and never "stored".
//   failure       Server built as for `configured`, then started with a
//                 deliberately wrong key in the shell. Expects 502 "error":
//                 a rejected write must never look like a signup.
//
// Exit code 0 when every check passes, 1 otherwise.

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i].replace(/^--/, ""), process.argv[i + 1]);
}

const MODES = ["configured", "unconfigured", "failure"];
const mode = args.get("mode");
const base = (args.get("base") ?? "http://localhost:3000").replace(/\/+$/, "");
const email = args.get("email");

function usage(message) {
  console.error(`${message}\nSee the header of scripts/early-access-live-check.mjs for usage.`);
  process.exit(2);
}

if (!MODES.includes(mode)) usage(`--mode must be one of: ${MODES.join(", ")}`);

let host;
try {
  host = new URL(base).hostname;
} catch {
  usage(`--base is not a URL: ${base}`);
}
if (!["localhost", "127.0.0.1", "[::1]"].includes(host)) {
  usage(`Refusing to run against ${host}: this script only talks to a local server.`);
}

const needsEmail = mode !== "unconfigured";
if (needsEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? "")) {
  usage("--email is required in this mode: a test address you control.");
}
const testEmail = email ?? "unconfigured-check@example.invalid";

/** a***@domain - enough to recognise, not enough to copy. */
function mask(address) {
  const [local, domain] = address.split("@");
  return `${local.slice(0, 1)}***@${domain}`;
}

let passed = 0;
let failed = 0;
function check(ok, label) {
  ok ? passed++ : failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
}

let ipCounter = 0;
function nextIp() {
  ipCounter += 1;
  return `10.22.${Math.floor(ipCounter / 250)}.${(ipCounter % 250) + 1}`;
}

const SOURCE = "dev-test-day22";
const signup = (overrides = {}) => ({
  name: "NJEN Test Signup",
  email: testEmail,
  source: SOURCE,
  company: "",
  elapsedMs: 5000,
  consent: false,
  ...overrides,
});

async function post(body, { raw, chunked } = {}) {
  const text = raw ?? JSON.stringify(body);
  const init = {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": nextIp() },
    body: text,
  };
  if (chunked) {
    // A stream body has no Content-Length, so the server must count bytes itself.
    const bytes = new TextEncoder().encode(text);
    init.body = new ReadableStream({
      start(controller) {
        for (let at = 0; at < bytes.length; at += 1024) controller.enqueue(bytes.slice(at, at + 1024));
        controller.close();
      },
    });
    init.duplex = "half";
  }
  const response = await fetch(`${base}/api/early-access`, init);
  let status = null;
  try {
    status = (await response.json()).status ?? null;
  } catch {
    // Non-JSON answers are reported by HTTP code alone.
  }
  return { code: response.status, status };
}

/** A valid signup padded with whitespace to exactly `size` bytes. */
function paddedSignup(size) {
  const json = JSON.stringify(signup());
  return json.slice(0, -1) + " ".repeat(size - Buffer.byteLength(json)) + "}";
}

console.log(`Early Access live check: mode=${mode}, base=${base}, email=${needsEmail ? mask(testEmail) : "(none)"}\n`);

try {
  const health = await fetch(`${base}/api/health`);
  check(health.status === 200, `GET /api/health -> 200 (server function runs; says nothing about the database)`);
} catch {
  console.error(`No server answering at ${base}. Start it with: npm run build && npm run start`);
  process.exit(1);
}

const page = await (await fetch(`${base}/early-access`)).text();
const previewNotice = page.includes("Preview only.");
if (mode === "unconfigured") {
  check(previewNotice, `/early-access shows the "Preview only" notice (build saw no storage settings)`);
} else {
  check(!previewNotice, `/early-access has no "Preview only" notice (build saw both storage settings)`);
}

const expectValid =
  mode === "configured"
    ? { code: 201, status: "stored" }
    : mode === "unconfigured"
      ? { code: 503, status: "not-configured" }
      : { code: 502, status: "error" };

let r = await post(signup());
check(r.code === expectValid.code && r.status === expectValid.status, `valid signup -> ${expectValid.code} ${expectValid.status} (got ${r.code} ${r.status})`);

if (mode === "configured") {
  r = await post(signup({ email: testEmail.toUpperCase(), name: "NJEN Test Signup Again" }));
  check(r.code === 201 && r.status === "stored", `same address, different capitals -> 201 stored, no second row (got ${r.code} ${r.status})`);
}

r = await post(signup({ email: "not-an-email" }));
check(r.code === 400 && r.status === "invalid", `invalid email -> 400 invalid (got ${r.code} ${r.status})`);

r = await post(signup({ name: "" }));
check(r.code === 400 && r.status === "invalid", `missing name -> 400 invalid (got ${r.code} ${r.status})`);

r = await post(signup({ company: "bot-filled" }));
check(r.code === 400 && r.status === "invalid", `honeypot filled -> 400 invalid (got ${r.code} ${r.status})`);

r = await post(signup({ elapsedMs: 10 }));
check(r.code === 400 && r.status === "invalid", `submitted too fast -> 400 invalid (got ${r.code} ${r.status})`);

r = await post(null, { raw: "{not json" });
check(r.code === 400 && r.status === "invalid", `malformed JSON -> 400 invalid (got ${r.code} ${r.status})`);

r = await post(null, { raw: paddedSignup(5000) });
check(r.code === 413, `5,000-byte body with Content-Length -> 413 (got ${r.code})`);

r = await post(null, { raw: paddedSignup(4097), chunked: true });
check(r.code === 413, `4,097-byte chunked body -> 413 (got ${r.code})`);

// 4,096 bytes is inside the cap, so this is a real, valid signup for the same
// address: in `configured` mode it is one more idempotent write, not a new row.
r = await post(null, { raw: paddedSignup(4096), chunked: true });
check(r.code === expectValid.code, `4,096-byte chunked body accepted -> ${expectValid.code} (got ${r.code})`);

console.log(`\n${passed} passed, ${failed} failed`);

if (mode === "configured") {
  console.log(`
NEXT: prove the row exists. A 201 is not proof on its own.
Supabase dashboard (your developer-owned TEST project) -> SQL Editor -> run:

  select count(*) as rows_for_test_address,
         count(*) filter (where source = '${SOURCE}') as with_test_source
  from app.early_access_signups
  where lower(email) = lower('<your test address>');

Expected: 1 and 1. It returns counts only, so it is safe to show on screen.`);
}

process.exit(failed === 0 ? 0 : 1);
