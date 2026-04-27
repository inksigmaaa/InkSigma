import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCustomDomainSetupPlan,
  validateCustomDomainInput,
} from "../services/customDomainPlanner.ts";
import {
  CUSTOM_DOMAIN_STATUS,
  verifyCustomDomainLifecycle,
} from "../services/customDomainService.ts";

const withEnv = async (
  values: Record<string, string | undefined>,
  fn: () => Promise<void> | void,
) => {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(values)) {
    previous.set(key, process.env[key]);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    await fn();
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
};

test("validateCustomDomainInput rejects protocol and path values", () => {
  const result = validateCustomDomainInput("https://Example.com/blog");
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.match(result.error, /valid hostname/i);
  }
});

test("buildCustomDomainSetupPlan returns DNS-only records for apex domains", async () => {
  await withEnv(
    {
      NODE_ENV: "production",
      CUSTOM_DOMAIN_IP_TARGETS: "76.76.21.21",
      CUSTOM_DOMAIN_CNAME_TARGETS: "cname.inksigma.com",
    },
    () => {
      const plan = buildCustomDomainSetupPlan("example.com");

      assert.equal(plan.domain, "example.com");
      assert.equal(plan.domainType, "apex");
      assert.deepEqual(plan.records, [
        {
          type: "A",
          name: "@",
          value: "76.76.21.21",
          ttl: "Auto",
          role: "required",
        },
        {
          type: "CNAME",
          name: "www",
          value: "cname.inksigma.com",
          ttl: "Auto",
          role: "recommended",
        },
      ]);
    },
  );
});

test("verifyCustomDomainLifecycle stays pending when DNS is not ready", async () => {
  await withEnv(
    {
      NODE_ENV: "production",
    },
    async () => {
      const result = await verifyCustomDomainLifecycle(
        {
          customDomain: "www.example.com",
        },
        {
          dnsInspector: async () => ({
            ready: false,
            status: "pending",
            message: "Waiting for CNAME propagation.",
          }),
        },
      );

      assert.equal(
        result.customDomainStatus,
        CUSTOM_DOMAIN_STATUS.PENDING_VERIFICATION,
      );
      assert.equal(
        result.customDomainVerificationError,
        "Waiting for CNAME propagation.",
      );
      assert.equal(result.customDomainVerifiedAt, null);
    },
  );
});

test("verifyCustomDomainLifecycle stays provider-pending when DNS is ready but hosting is not attached", async () => {
  await withEnv(
    {
      NODE_ENV: "production",
    },
    async () => {
      const result = await verifyCustomDomainLifecycle(
        {
          customDomain: "www.example.com",
        },
        {
          dnsInspector: async () => ({
            ready: true,
            status: "ready",
            message: null,
          }),
          reachabilityInspector: async () => ({
            ready: false,
            status: "provider_pending",
            message:
              "DNS is verified, but the custom domain is not attached to the frontend hosting project yet.",
          }),
        },
      );

      assert.equal(result.customDomainStatus, CUSTOM_DOMAIN_STATUS.VERIFIED);
      assert.match(
        result.customDomainVerificationError || "",
        /not attached to the frontend hosting project/i,
      );
      assert.ok(result.customDomainVerifiedAt instanceof Date);
    },
  );
});

test("verifyCustomDomainLifecycle stays ssl-pending when DNS is ready but HTTPS is not ready", async () => {
  await withEnv(
    {
      NODE_ENV: "production",
    },
    async () => {
      const result = await verifyCustomDomainLifecycle(
        {
          customDomain: "www.example.com",
        },
        {
          dnsInspector: async () => ({
            ready: true,
            status: "ready",
            message: null,
          }),
          reachabilityInspector: async () => ({
            ready: false,
            status: "ssl_pending",
            message: "DNS is verified, but HTTPS is not ready yet.",
          }),
        },
      );

      assert.equal(result.customDomainStatus, CUSTOM_DOMAIN_STATUS.SSL_PENDING);
      assert.equal(
        result.customDomainVerificationError,
        "DNS is verified, but HTTPS is not ready yet.",
      );
      assert.ok(result.customDomainVerifiedAt instanceof Date);
    },
  );
});

test("verifyCustomDomainLifecycle activates only after DNS and HTTPS are ready", async () => {
  await withEnv(
    {
      NODE_ENV: "production",
    },
    async () => {
      const result = await verifyCustomDomainLifecycle(
        {
          customDomain: "www.example.com",
        },
        {
          dnsInspector: async () => ({
            ready: true,
            status: "ready",
            message: null,
          }),
          reachabilityInspector: async () => ({
            ready: true,
            status: "ready",
            message: null,
          }),
        },
      );

      assert.equal(result.customDomainStatus, CUSTOM_DOMAIN_STATUS.ACTIVE);
      assert.equal(result.customDomainVerificationError, null);
      assert.ok(result.customDomainVerifiedAt instanceof Date);
    },
  );
});
