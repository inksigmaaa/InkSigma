import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCustomDomainLifecycleFields,
  CUSTOM_DOMAIN_STATUS,
  getCustomDomainConfiguration,
  getCustomDomainVerificationHostname,
  getCustomDomainVerificationRecordValue,
  isCustomDomainActive,
} from "../services/customDomainService.ts";

process.env.NODE_ENV = "development";

test("buildCustomDomainLifecycleFields auto-activates local development domains", () => {
  const fields = buildCustomDomainLifecycleFields({
    nextCustomDomain: "tennyson.com",
  });

  assert.equal(fields.customDomain, "tennyson.com");
  assert.equal(fields.customDomainStatus, CUSTOM_DOMAIN_STATUS.ACTIVE);
  assert.equal(fields.customDomainVerificationToken, null);
  assert.ok(fields.customDomainVerifiedAt instanceof Date);
});

test("buildCustomDomainLifecycleFields preserves active domains on no-op updates", () => {
  const fields = buildCustomDomainLifecycleFields({
    currentPublication: {
      customDomain: "tennyson.com",
      customDomainStatus: CUSTOM_DOMAIN_STATUS.ACTIVE,
      customDomainVerifiedAt: new Date("2025-01-01T00:00:00.000Z"),
    },
    nextCustomDomain: "tennyson.com",
  });

  assert.equal(fields.customDomainStatus, CUSTOM_DOMAIN_STATUS.ACTIVE);
  assert.equal(
    fields.customDomainVerifiedAt?.toISOString(),
    "2025-01-01T00:00:00.000Z",
  );
});

test("verification record helpers build deterministic values", () => {
  assert.equal(
    getCustomDomainVerificationHostname("tennyson.com"),
    "_inksigma.tennyson.com",
  );
  assert.equal(
    getCustomDomainVerificationRecordValue("abc123"),
    "inksigma-verification=abc123",
  );
});

test("getCustomDomainConfiguration returns verification and routing targets", () => {
  process.env.CUSTOM_DOMAIN_CNAME_TARGET = "proxy.inksigma.xyz";
  process.env.CUSTOM_DOMAIN_IP_TARGETS = "203.0.113.10,2001:db8::10";

  const configuration = getCustomDomainConfiguration({
    domain: "tennyson.com",
    token: "abc123",
  });

  assert.deepEqual(configuration, {
    verificationRecord: {
      type: "TXT",
      host: "_inksigma.tennyson.com",
      value: "inksigma-verification=abc123",
    },
    routingTargets: {
      cname: ["proxy.inksigma.xyz"],
      ip: ["203.0.113.10", "2001:db8::10"],
    },
  });
});

test("isCustomDomainActive only returns true for active domains", () => {
  assert.equal(
    isCustomDomainActive({
      customDomain: "tennyson.com",
      customDomainStatus: CUSTOM_DOMAIN_STATUS.ACTIVE,
    }),
    true,
  );
  assert.equal(
    isCustomDomainActive({
      customDomain: "tennyson.com",
      customDomainStatus: CUSTOM_DOMAIN_STATUS.PENDING_VERIFICATION,
    }),
    false,
  );
});
