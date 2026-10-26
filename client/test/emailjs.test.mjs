import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { sendContactMessage } from "../lib/emailjs.ts";

const originalFetch = globalThis.fetch;
const keys = ["NEXT_PUBLIC_EMAILJS_SERVICE_ID", "NEXT_PUBLIC_EMAILJS_TEMPLATE_ID", "NEXT_PUBLIC_EMAILJS_PUBLIC_KEY"];
const originalEnv = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
const message = { name: "Test Learner", email: "learner@example.com", subject: "Course question", message: "How can I get started?" };

beforeEach(() => {
  process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID = "test-service";
  process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID = "test-template";
  process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY = "test-public-key";
  globalThis.fetch = async () => { throw new Error("Unexpected network access in test"); };
});

after(() => {
  globalThis.fetch = originalFetch;
  for (const key of keys) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

test("sends the contact fields and reply address without private credentials", async () => {
  let requests = 0;
  globalThis.fetch = async (url, options) => {
    requests += 1;
    assert.equal(url, "https://api.emailjs.com/api/v1.0/email/send");
    assert.equal(options.method, "POST");
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.ok(options.signal instanceof AbortSignal);
    const body = JSON.parse(options.body);
    assert.equal(body.service_id, "test-service");
    assert.equal(body.template_id, "test-template");
    assert.equal(body.user_id, "test-public-key");
    for (const [key, value] of Object.entries(message)) assert.equal(body.template_params[key], value);
    assert.equal(body.template_params.reply_to, message.email);
    assert.equal(body.template_params.title, message.subject);
    assert.equal("accessToken" in body, false);
    assert.equal("privateKey" in body, false);
    return new Response("OK");
  };
  await sendContactMessage(message);
  assert.equal(requests, 1);
});

test("missing configuration prevents a send", async () => {
  delete process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  await assert.rejects(sendContactMessage(message), /temporarily unavailable/);
});

test("provider rejection does not count as success or expose response contents", async () => {
  globalThis.fetch = async () => new Response("Sensitive provider details", { status: 422 });
  await assert.rejects(sendContactMessage(message), /Your message couldn’t be sent/);
});

test("rate limits ask the user to wait", async () => {
  globalThis.fetch = async () => new Response("Rate limited", { status: 429 });
  await assert.rejects(sendContactMessage(message), /wait a moment/);
});

test("connection failures and timeouts do not count as success", async () => {
  for (const failure of [new TypeError("Failed to fetch"), new DOMException("Timed out", "TimeoutError")]) {
    globalThis.fetch = async () => { throw failure; };
    await assert.rejects(sendContactMessage(message), /couldn’t confirm/);
  }
});
