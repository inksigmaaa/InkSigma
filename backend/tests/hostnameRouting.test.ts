import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyHostForRouting,
  normalizeHost,
} from "../utils/hostnameRouting.ts";

test("normalizeHost strips protocol, path, port, and lowercases", () => {
  assert.equal(
    normalizeHost("HTTPS://Tennyson.InkSigma.Local:3000/view-site"),
    "tennyson.inksigma.local",
  );
});

test("classifyHostForRouting identifies root and dashboard hosts", () => {
  assert.deepEqual(classifyHostForRouting("inksigma.local"), {
    host: "inksigma.local",
    kind: null,
    value: "",
    isRootDomain: true,
    isDashboard: false,
    isReservedSubdomain: false,
    isCustomDomain: false,
  });

  assert.deepEqual(classifyHostForRouting("dashboard.inksigma.local"), {
    host: "dashboard.inksigma.local",
    kind: "subdomain",
    value: "dashboard",
    isRootDomain: false,
    isDashboard: true,
    isReservedSubdomain: true,
    isCustomDomain: false,
  });
});

test("classifyHostForRouting identifies publication subdomains and custom domains", () => {
  assert.deepEqual(classifyHostForRouting("tennyson.inksigma.local"), {
    host: "tennyson.inksigma.local",
    kind: "subdomain",
    value: "tennyson",
    isRootDomain: false,
    isDashboard: false,
    isReservedSubdomain: false,
    isCustomDomain: false,
  });

  assert.deepEqual(classifyHostForRouting("tennyson.local"), {
    host: "tennyson.local",
    kind: "custom_domain",
    value: "tennyson.local",
    isRootDomain: false,
    isDashboard: false,
    isReservedSubdomain: false,
    isCustomDomain: true,
  });
});
