import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCustomDomainLifecycleFields,
  CUSTOM_DOMAIN_STATUS,
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
