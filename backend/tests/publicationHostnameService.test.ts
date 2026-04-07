import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPublicationHostnamePlan,
  getLocalCustomDomainAlias,
  getPublicationCanonicalHost,
  normalizePublicationHostnameValue,
} from "../services/publicationHostnameService.ts";
import { CUSTOM_DOMAIN_STATUS } from "../services/customDomainService.ts";

process.env.NODE_ENV = "development";

test("normalizePublicationHostnameValue normalizes subdomains and custom domains", () => {
  assert.equal(
    normalizePublicationHostnameValue("subdomain", "  Tennyson-Weekly "),
    "tennyson-weekly",
  );
  assert.equal(
    normalizePublicationHostnameValue(
      "custom_domain",
      "https://Tennyson.com/articles?id=1",
    ),
    "tennyson.com",
  );
});

test("getLocalCustomDomainAlias maps custom domains to local preview aliases", () => {
  assert.equal(getLocalCustomDomainAlias("tennyson.com"), "tennyson.local");
  assert.equal(
    getLocalCustomDomainAlias("tennysonwriting.dev"),
    "tennysonwriting.local",
  );
});

test("getPublicationCanonicalHost prefers custom domain aliases in development", () => {
  assert.equal(
    getPublicationCanonicalHost({
      id: 1,
      subdomain: "tennyson",
      customDomain: "tennyson.com",
      customDomainStatus: CUSTOM_DOMAIN_STATUS.ACTIVE,
    }),
    "tennyson.local",
  );

  assert.equal(
    getPublicationCanonicalHost({
      id: 1,
      subdomain: "tennyson",
      customDomain: null,
      customDomainStatus: null,
    }),
    "tennyson.inksigma.local",
  );
});

test("getPublicationCanonicalHost ignores pending custom domains", () => {
  assert.equal(
    getPublicationCanonicalHost({
      id: 1,
      subdomain: "tennyson",
      customDomain: "tennyson.com",
      customDomainStatus: CUSTOM_DOMAIN_STATUS.PENDING_VERIFICATION,
    }),
    "tennyson.inksigma.local",
  );
});

test("buildPublicationHostnamePlan keeps old hosts as redirects after a custom-domain change", () => {
  const plan = buildPublicationHostnamePlan(
    {
      id: 7,
      subdomain: "tennyson",
      customDomain: "tennyson.com",
      customDomainStatus: CUSTOM_DOMAIN_STATUS.ACTIVE,
    },
    {
      id: 7,
      subdomain: "tennyson",
      customDomain: "tennysontesting.com",
      customDomainStatus: CUSTOM_DOMAIN_STATUS.ACTIVE,
    },
  );

  assert.deepEqual(plan, [
    {
      publicationId: 7,
      kind: "subdomain",
      value: "tennyson",
      status: "redirect",
    },
    {
      publicationId: 7,
      kind: "custom_domain",
      value: "tennyson.com",
      status: "redirect",
    },
    {
      publicationId: 7,
      kind: "custom_domain",
      value: "tennysontesting.com",
      status: "active",
    },
  ]);
});

test("buildPublicationHostnamePlan reactivates the platform subdomain when a custom domain is removed", () => {
  const plan = buildPublicationHostnamePlan(
    {
      id: 7,
      subdomain: "tennyson",
      customDomain: "tennyson.com",
      customDomainStatus: CUSTOM_DOMAIN_STATUS.ACTIVE,
    },
    {
      id: 7,
      subdomain: "tennyson",
      customDomain: null,
      customDomainStatus: null,
    },
  );

  assert.deepEqual(plan, [
    {
      publicationId: 7,
      kind: "subdomain",
      value: "tennyson",
      status: "active",
    },
    {
      publicationId: 7,
      kind: "custom_domain",
      value: "tennyson.com",
      status: "redirect",
    },
  ]);
});

test("buildPublicationHostnamePlan keeps subdomain active while a new custom domain is pending", () => {
  const plan = buildPublicationHostnamePlan(
    {
      id: 7,
      subdomain: "tennyson",
      customDomain: "tennyson.com",
      customDomainStatus: CUSTOM_DOMAIN_STATUS.ACTIVE,
    },
    {
      id: 7,
      subdomain: "tennyson",
      customDomain: "tennysontesting.com",
      customDomainStatus: CUSTOM_DOMAIN_STATUS.PENDING_VERIFICATION,
    },
  );

  assert.deepEqual(plan, [
    {
      publicationId: 7,
      kind: "subdomain",
      value: "tennyson",
      status: "active",
    },
    {
      publicationId: 7,
      kind: "custom_domain",
      value: "tennyson.com",
      status: "redirect",
    },
  ]);
});
