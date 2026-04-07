import test from "node:test";
import assert from "node:assert/strict";
import {
  getPublicationCacheInvalidationKeys,
  invalidatePublicationCacheWithDelete,
} from "../services/publicationResolver.ts";

test("getPublicationCacheInvalidationKeys includes subdomain and custom domain keys", () => {
  const keys = getPublicationCacheInvalidationKeys({
    subdomain: "tennyson",
    customDomain: "tennyson.com",
  });

  assert.deepEqual(keys, [
    "publication:subdomain:tennyson",
    "publication:custom-domain:tennyson.com",
    "publication:custom-domain:tennyson.local",
  ]);
});

test("getPublicationCacheInvalidationKeys omits local alias for local custom domains", () => {
  const keys = getPublicationCacheInvalidationKeys({
    customDomain: "tennyson.local",
  });

  assert.deepEqual(keys, ["publication:custom-domain:tennyson.local"]);
});

test("invalidatePublicationCacheWithDelete deletes all resolved keys", async () => {
  const deleted: string[] = [];

  const didInvalidate = await invalidatePublicationCacheWithDelete(
    {
      subdomain: "tennyson",
      customDomain: "tennyson.com",
    },
    async (key) => {
      deleted.push(key);
      return true;
    },
  );

  assert.equal(didInvalidate, true);
  assert.deepEqual(deleted, [
    "publication:subdomain:tennyson",
    "publication:custom-domain:tennyson.com",
    "publication:custom-domain:tennyson.local",
  ]);
});

test("invalidatePublicationCacheWithDelete returns false without cache keys", async () => {
  let calls = 0;

  const didInvalidate = await invalidatePublicationCacheWithDelete(
    {},
    async () => {
      calls += 1;
      return true;
    },
  );

  assert.equal(didInvalidate, false);
  assert.equal(calls, 0);
});
