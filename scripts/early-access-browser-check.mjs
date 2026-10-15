// Early Access browser check - LOCAL DEVELOPMENT ONLY.
//
// Drives a real browser (Microsoft Edge or Google Chrome, already installed on
// the machine; nothing is downloaded) over the DevTools protocol against a
// running local build, and checks what a visitor actually experiences: layout
// at phone-to-desktop widths, keyboard focus, and what the form shows and
// where focus goes for every kind of server answer.
//
// SAFETY
// - Refuses any base URL that is not localhost.
// - Every signup request is answered INSIDE THE BROWSER by a mock (DevTools
//   Fetch interception) and never reaches the server, let alone a database.
//   The one exception is the last check, "real route, storage unconfigured",
//   which needs the server started WITHOUT SUPABASE_URL and
//   SUPABASE_SERVICE_ROLE_KEY; it is skipped unless the page shows its
//   "Preview only" notice, so it cannot store anything.
// - Uses a throwaway browser profile in the system temp folder.
//
// USAGE
//   npm run build && npm run start          (in another terminal)
//   node scripts/early-access-browser-check.mjs
//   Optional: --base http://localhost:3000 (the default)
//             --browser "C:/path/to/msedge.exe"   (or set NJEN_BROWSER)
//
// WHAT IT CANNOT TELL YOU
// Headless Chromium is not Safari, not the Facebook in-app browser and not a
// screen reader. It checks focus and ARIA state, not what VoiceOver says.
//
// Exit code 0 when every check passes, 1 otherwise.

import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i].replace(/^--/, ""), process.argv[i + 1]);

const base = (args.get("base") ?? "http://localhost:3000").replace(/\/+$/, "");
let host;
try {
  host = new URL(base).hostname;
} catch {
  console.error(`--base is not a URL: ${base}`);
  process.exit(2);
}
if (!["localhost", "127.0.0.1", "[::1]"].includes(host)) {
  console.error(`Refusing to run against ${host}: this script only talks to a local server.`);
  process.exit(2);
}

const candidates = [
  args.get("browser"),
  process.env.NJEN_BROWSER,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/microsoft-edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const browserPath = candidates.find((candidate) => existsSync(candidate));
if (!browserPath) {
  console.error("No Edge or Chrome found. Pass --browser <path> or set NJEN_BROWSER.");
  process.exit(2);
}

// --- Browser and DevTools plumbing ------------------------------------------

const PORT = 9400 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(path.join(tmpdir(), "njen-browser-check-"));
const browser = spawn(
  browserPath,
  ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--disable-extensions", "--disable-sync", "about:blank"],
  { stdio: "ignore" },
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function finish(code) {
  try {
    browser.kill();
  } catch {}
  // The browser may hold the profile briefly after exit.
  setTimeout(() => {
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {}
    process.exit(code);
  }, 500);
}

let socketUrl;
for (let attempt = 0; attempt < 50 && !socketUrl; attempt++) {
  try {
    const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    socketUrl = targets.find((target) => target.type === "page")?.webSocketDebuggerUrl;
  } catch {}
  if (!socketUrl) await sleep(200);
}
if (!socketUrl) {
  console.error("Could not connect to the browser.");
  finish(2);
}

const socket = new WebSocket(socketUrl);
await new Promise((resolve) => socket.addEventListener("open", resolve));
let nextId = 0;
const waiting = new Map();
let onRequest = null;
socket.addEventListener("message", (message) => {
  const data = JSON.parse(message.data);
  if (data.id && waiting.has(data.id)) {
    waiting.get(data.id)(data);
    waiting.delete(data.id);
  } else if (data.method === "Fetch.requestPaused") {
    onRequest?.(data.params);
  }
});

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    waiting.set(id, (data) => (data.error ? reject(new Error(`${method}: ${data.error.message}`)) : resolve(data.result)));
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? "evaluation failed");
  return result.result.value;
}

async function waitFor(expression, ms = 8000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await evaluate(`!!(${expression})`)) return true;
    await sleep(50);
  }
  return false;
}

async function open(pathname) {
  await send("Page.navigate", { url: base + pathname });
  await waitFor("document.readyState === 'complete'");
  // Hydration: the form only handles submit once React has attached.
  await sleep(400);
}

async function press(key) {
  const codes = { Tab: 9, Enter: 13 };
  const event = { key, code: key, windowsVirtualKeyCode: codes[key] };
  await send("Input.dispatchKeyEvent", { type: "rawKeyDown", ...event });
  if (key === "Enter") await send("Input.dispatchKeyEvent", { type: "char", text: "\r" });
  await send("Input.dispatchKeyEvent", { type: "keyUp", ...event });
}

async function type(text) {
  for (const character of text) await send("Input.dispatchKeyEvent", { type: "char", text: character });
}

// --- Checks ------------------------------------------------------------------

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? `  (${detail})` : ""}`);
}

await send("Page.enable");
await send("Runtime.enable");

// 1. Layout at the widths in docs/NJEN_DAY24_PREVIEW_QA_CHECKLIST.md.
for (const width of [320, 375, 390, 768, 1024, 1440]) {
  const mobile = width < 768;
  await send("Emulation.setDeviceMetricsOverride", { width, height: mobile ? 800 : 900, deviceScaleFactor: 1, mobile });
  await open("/early-access");
  const layout = await evaluate(`({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    h1: document.querySelectorAll('h1').length,
    inputsReadable: [...document.querySelectorAll('#name, #email')].every((input) => parseFloat(getComputedStyle(input).fontSize) >= 16),
    labelled: [...document.querySelectorAll('#name, #email')].every((input) => input.labels.length === 1),
    tapTargets: [...document.querySelectorAll('#name, #email, .ea-submit')].every((el) => el.getBoundingClientRect().height >= 44),
  })`);
  check(`${width}px: no horizontal scroll`, layout.overflow === 0, `${layout.overflow}px`);
  check(`${width}px: one h1, labelled 16px inputs, 44px+ tap targets`, layout.h1 === 1 && layout.inputsReadable && layout.labelled && layout.tapTargets);
}

// 2. The form, with every kind of server answer mocked in the browser.
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });

let mock = null;
let requests = 0;
onRequest = async (request) => {
  requests += 1;
  if (mock.delay) await sleep(mock.delay);
  if (mock.fail) {
    await send("Fetch.failRequest", { requestId: request.requestId, errorReason: mock.fail });
    return;
  }
  await send("Fetch.fulfillRequest", {
    requestId: request.requestId,
    responseCode: mock.status,
    responseHeaders: [{ name: "Content-Type", value: mock.type ?? "application/json" }],
    body: Buffer.from(mock.body).toString("base64"),
  });
};
await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/early-access*", requestStage: "Request" }] });

const STATE = `(() => {
  const active = document.activeElement;
  return {
    screen: document.querySelector('.ea-success-title')?.textContent ?? null,
    message: document.querySelector('.ea-form-message')?.textContent || null,
    focus: !active || active === document.body ? 'body' : active.id || active.className,
    emailError: document.getElementById('email-error')?.textContent ?? null,
    emailDescribedBy: document.getElementById('email')?.getAttribute('aria-describedby') ?? null,
    emailInvalid: document.getElementById('email')?.getAttribute('aria-invalid') ?? null,
    titleRing: (() => { const t = document.querySelector('.ea-success-title'); return t ? getComputedStyle(t).outlineStyle !== 'none' : null; })(),
    youreIn: /you're in/i.test(document.body.innerText),
  };
})()`;

/** Fills the form by keyboard and submits with Enter, as a phone user would. */
async function submit({ name = "Browser Check", email = "browser-check@example.com", during } = {}) {
  await open("/early-access");
  await evaluate("document.getElementById('name').focus()");
  await type(name);
  await press("Tab");
  await type(email);
  await sleep(1000); // past the 900 ms timing guard
  requests = 0;
  await press("Enter");
  if (during) await during();
  await waitFor(
    "document.querySelector('.ea-success') || document.querySelector('.ea-form-message')?.textContent || document.querySelector('.ea-error')",
    (mock?.delay ?? 0) + 6000,
  );
  await sleep(250);
  return evaluate(STATE);
}

const NOT_SAVED = "Something went wrong at our end and your signup was not saved. Please try again shortly.";

mock = { status: 201, body: '{"status":"stored"}' };
let state = await submit();
check("stored: success screen shown", state.screen === "You're in. Welcome to NJEN.");
check("stored: focus moves to the result heading, with no focus ring", state.focus === "ea-success-title" && state.titleRing === false, state.focus);

mock = { status: 201, body: '{"status":"stored"}', delay: 1500 };
let busy = null;
state = await submit({
  during: async () => {
    await press("Enter");
    await evaluate("document.querySelector('.ea-submit')?.click()");
    busy = await evaluate("({ text: document.querySelector('.ea-submit')?.textContent, disabled: document.querySelector('.ea-submit')?.disabled })");
  },
});
check("slow reply: button says Sending… and is disabled", busy?.text === "Sending…" && busy?.disabled === true);
check("slow reply: repeated Enter and click send one request", requests === 1, `${requests} requests`);

mock = { status: 503, body: '{"status":"not-configured"}' };
state = await submit();
check("not-configured: 'not saved' screen, never success", state.screen === "Checked - but not saved" && !state.youreIn);
check("not-configured: focus moves to the result heading", state.focus === "ea-success-title", state.focus);

const failures = [
  ["rate limited (429)", { status: 429, body: '{"status":"rate-limited"}' }, "Too many attempts. Please wait a few minutes and try again."],
  ["storage error (502)", { status: 502, body: '{"status":"error"}' }, NOT_SAVED],
  ["non-JSON error page (504)", { status: 504, type: "text/html", body: "<html>Gateway Timeout</html>" }, NOT_SAVED],
  ["truncated JSON", { status: 201, body: '{"status":"stor' }, NOT_SAVED],
  ["empty 200", { status: 200, body: "" }, NOT_SAVED],
  ["unknown status", { status: 200, body: '{"status":"ok"}' }, NOT_SAVED],
  ["unknown error field", { status: 400, body: '{"status":"invalid","errors":[{"field":"company","message":"x"}]}' }, NOT_SAVED],
  ["network failure", { fail: "InternetDisconnected" }, "We could not reach the server, so your signup was not saved. Please check your connection and try again."],
  ["anti-abuse rejection", { status: 400, body: '{"status":"invalid","errors":[{"field":"form","message":"This submission could not be accepted."}]}' }, "This submission could not be accepted."],
];
for (const [label, answer, message] of failures) {
  mock = answer;
  state = await submit();
  check(`${label}: correct message, no success`, state.message === message && !state.screen && !state.youreIn, state.message ?? "no message");
  check(`${label}: focus returns to the submit button`, state.focus === "ea-submit", state.focus);
}

mock = { status: 400, body: '{"status":"invalid","errors":[{"field":"email","message":"Enter a valid email address."}]}' };
state = await submit();
check(
  "server field error: email flagged, described and focused",
  state.emailError === "Enter a valid email address." && state.emailInvalid === "true" && state.emailDescribedBy === "email-error" && state.focus === "email",
  `focus ${state.focus}`,
);

state = await submit({ name: "", email: "" });
check("empty submit: no request, focus on name", requests === 0 && state.focus === "name", `${requests} requests, focus ${state.focus}`);

state = await submit({ email: "nope" });
check("bad email: no request, focus on email", requests === 0 && state.focus === "email", `${requests} requests, focus ${state.focus}`);

// Recovery: a failed attempt can be retried from the keyboard.
mock = { status: 502, body: '{"status":"error"}' };
await submit();
mock = { status: 201, body: '{"status":"stored"}' };
await press("Enter");
await waitFor("document.querySelector('.ea-success')");
state = await evaluate(STATE);
check("retry after a failure: Enter on the focused button succeeds", state.screen === "You're in. Welcome to NJEN.");

// 3. The real local route, only if the server has no storage configured.
await send("Fetch.disable");
await open("/early-access");
if (await evaluate("!!document.querySelector('.ea-notice')")) {
  mock = null;
  state = await submit();
  check("real route, storage unconfigured: 'not saved', never success", state.screen === "Checked - but not saved" && !state.youreIn);
} else {
  console.log("SKIP  real route check: storage is configured on this server, so no unmocked signup is sent");
}

const failed = results.filter((result) => !result.ok).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
finish(failed === 0 ? 0 : 1);
