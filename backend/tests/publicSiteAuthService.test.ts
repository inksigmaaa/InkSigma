import test from "node:test";
import assert from "node:assert/strict";
import {
  createPublicSiteAuthToken,
  readPublicSiteAuthTokenFromHeaders,
  verifyPublicSiteAuthToken,
} from "../services/publicSiteAuthService.ts";

process.env.PUBLIC_SITE_AUTH_SECRET = "test-public-site-secret";

test("public-site auth tokens round-trip user identity", () => {
  const token = createPublicSiteAuthToken({
    id: "user_123",
    email: "reader@example.com",
    name: "Reader",
    image: "https://cdn.example.com/avatar.png",
    username: "reader",
  });

  assert.ok(token);

  const payload = verifyPublicSiteAuthToken(token);
  assert.ok(payload);
  assert.equal(payload?.sub, "user_123");
  assert.equal(payload?.email, "reader@example.com");
  assert.equal(payload?.name, "Reader");
  assert.equal(payload?.username, "reader");
});

test("public-site auth tokens reject tampering", () => {
  const token = createPublicSiteAuthToken({
    id: "user_456",
    email: "tamper@example.com",
  });

  assert.ok(token);
  const tampered = `${token.split(".")[0]}.invalid-signature`;

  assert.equal(verifyPublicSiteAuthToken(tampered), null);
});

test("public-site auth token reader extracts bearer and custom headers", () => {
  assert.equal(
    readPublicSiteAuthTokenFromHeaders({
      authorization: "Bearer token-from-bearer",
    }),
    "token-from-bearer",
  );

  assert.equal(
    readPublicSiteAuthTokenFromHeaders({
      "x-public-site-auth": "token-from-header",
    }),
    "token-from-header",
  );
});
