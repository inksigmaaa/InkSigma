// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { getPublicationUrl } from "./publicationDomain";

const setLocation = (hostname: string, port = "3000", protocol = "http:") => {
  Object.defineProperty(window, "location", {
    value: { hostname, port, protocol, href: `${protocol}//${hostname}:${port}/` },
    configurable: true,
    writable: true,
  });
};

// Regression: reverting a custom domain back to the subdomain must point
// "View Site" at the subdomain — never at a host derived from the (now
// inactive) custom-domain label. See getPublicationUrl local branch.
describe("getPublicationUrl — view-site host after custom-domain revert (local dev)", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = "inksigma.local";
    process.env.NEXT_PUBLIC_MAIN_DOMAIN = "inksigma.com";
    setLocation("dashboard.inksigma.local");
  });

  it("opens the subdomain after revert (custom domain cleared)", () => {
    expect(
      getPublicationUrl({ subdomain: "tennyson", customDomain: null, customDomainStatus: null }),
    ).toBe("http://tennyson.inksigma.local:3000");
  });

  it("opens the subdomain even if a stale/inactive customDomain lingers on the object", () => {
    expect(
      getPublicationUrl({
        subdomain: "tennyson",
        customDomain: "tennyson.com",
        customDomainStatus: "detached",
      }),
    ).toBe("http://tennyson.inksigma.local:3000");
  });

  it("prefers the real subdomain over the custom-domain label", () => {
    expect(
      getPublicationUrl({
        subdomain: "myblog",
        customDomain: "tennyson.com",
        customDomainStatus: "active",
      }),
    ).toBe("http://myblog.inksigma.local:3000");
  });

  it("never fabricates a subdomain-shaped host from the custom-domain label", () => {
    // Before the fix this returned http://tennyson.inksigma.local:3000,
    // derived from the custom domain "tennyson.com".
    const url = getPublicationUrl({
      subdomain: "",
      customDomain: "tennyson.com",
      customDomainStatus: "detached",
    });
    expect(url).not.toContain("tennyson.inksigma.local");
  });
});
