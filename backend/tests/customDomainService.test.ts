import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCustomDomainLifecycleFields,
  buildCustomDomainSetupPlanWithProvider,
  CUSTOM_DOMAIN_STATUS,
  isCustomDomainActive,
  verifyCustomDomainLifecycle,
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

test("buildCustomDomainLifecycleFields issues a verification token for a new pending domain", () => {
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "test";
  try {
    const fields = buildCustomDomainLifecycleFields({
      nextCustomDomain: "shop.example.com",
    });

    assert.equal(
      fields.customDomainStatus,
      CUSTOM_DOMAIN_STATUS.PENDING_VERIFICATION,
    );
    assert.match(fields.customDomainVerificationToken ?? "", /^[a-f0-9]{32}$/);
  } finally {
    process.env.NODE_ENV = previousEnv;
  }
});

test("buildCustomDomainLifecycleFields keeps the existing token on no-op updates", () => {
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "test";
  try {
    const fields = buildCustomDomainLifecycleFields({
      currentPublication: {
        customDomain: "shop.example.com",
        customDomainStatus: CUSTOM_DOMAIN_STATUS.PENDING_VERIFICATION,
        customDomainVerificationToken: "existing-token",
      },
      nextCustomDomain: "shop.example.com",
    });

    assert.equal(fields.customDomainVerificationToken, "existing-token");
  } finally {
    process.env.NODE_ENV = previousEnv;
  }
});

test("buildCustomDomainSetupPlanWithProvider surfaces a self-owned TXT ownership record", async () => {
  const plan = await buildCustomDomainSetupPlanWithProvider("shop.example.com", {
    verificationToken: "abc123",
  });

  const txtRecord = plan.records.find((record) => record.type === "TXT");
  assert.ok(txtRecord, "expected a TXT ownership record in the plan");
  assert.equal(txtRecord?.name, "_inksigma-verify.shop");
  assert.equal(txtRecord?.value, "inksigma-verify=abc123");
  assert.equal(txtRecord?.role, "required");
});

test("buildCustomDomainSetupPlanWithProvider omits the TXT record without a token", async () => {
  const plan = await buildCustomDomainSetupPlanWithProvider("shop.example.com");
  assert.equal(
    plan.records.some((record) => record.type === "TXT"),
    false,
  );
});

test("verifyCustomDomainLifecycle blocks activation until the ownership TXT is present", async () => {
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "test";
  try {
    const fields = await verifyCustomDomainLifecycle(
      {
        customDomain: "shop.example.com",
        customDomainStatus: CUSTOM_DOMAIN_STATUS.PENDING_VERIFICATION,
        customDomainVerificationToken: "tok",
      },
      {
        ownershipInspector: async () => ({
          ready: false,
          status: "pending",
          message: "Ownership TXT not found",
        }),
        dnsInspector: async () => ({ ready: true, status: "ready", message: null }),
        reachabilityInspector: async () => ({
          ready: true,
          status: "ready",
          message: null,
        }),
      },
    );

    assert.equal(
      fields.customDomainStatus,
      CUSTOM_DOMAIN_STATUS.PENDING_VERIFICATION,
    );
    assert.equal(fields.customDomainVerifiedAt, null);
  } finally {
    process.env.NODE_ENV = previousEnv;
  }
});

test("verifyCustomDomainLifecycle activates once ownership, DNS, and reachability pass", async () => {
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "test";
  try {
    const fields = await verifyCustomDomainLifecycle(
      {
        customDomain: "shop.example.com",
        customDomainStatus: CUSTOM_DOMAIN_STATUS.PENDING_VERIFICATION,
        customDomainVerificationToken: "tok",
      },
      {
        ownershipInspector: async () => ({
          ready: true,
          status: "ready",
          message: null,
        }),
        dnsInspector: async () => ({ ready: true, status: "ready", message: null }),
        reachabilityInspector: async () => ({
          ready: true,
          status: "ready",
          message: null,
        }),
      },
    );

    assert.equal(fields.customDomainStatus, CUSTOM_DOMAIN_STATUS.ACTIVE);
  } finally {
    process.env.NODE_ENV = previousEnv;
  }
});

test("verifyCustomDomainLifecycle does not regress an already-active domain when the TXT is missing", async () => {
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "test";
  try {
    const fields = await verifyCustomDomainLifecycle(
      {
        customDomain: "shop.example.com",
        customDomainStatus: CUSTOM_DOMAIN_STATUS.ACTIVE,
        customDomainVerificationToken: "tok",
      },
      {
        ownershipInspector: async () => ({
          ready: false,
          status: "pending",
          message: "Ownership TXT not found",
        }),
        dnsInspector: async () => ({ ready: true, status: "ready", message: null }),
        reachabilityInspector: async () => ({
          ready: true,
          status: "ready",
          message: null,
        }),
      },
    );

    assert.equal(fields.customDomainStatus, CUSTOM_DOMAIN_STATUS.ACTIVE);
  } finally {
    process.env.NODE_ENV = previousEnv;
  }
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
