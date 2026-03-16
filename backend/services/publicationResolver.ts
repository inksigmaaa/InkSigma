import { db } from "../config/database.js";
import { publication } from "../models/schema.js";
import { eq, sql } from "drizzle-orm";
import { getRedisClient, isRedisAvailable } from "../config/redis.js";
import logger from "../utils/logger.js";

const CACHE_TTL_SECONDS = Number(
  process.env.PUBLICATION_CACHE_TTL_SECONDS || 3600,
);

const cacheKeyForSubdomain = (subdomain) =>
  `publication:subdomain:${subdomain}`;
const cacheKeyForCustomDomain = (domain) =>
  `publication:custom-domain:${domain}`;

const isLocalCustomDomainAlias = (domain) =>
  typeof domain === "string" &&
  (domain.endsWith(".local") || domain.endsWith(".localhost"));

const toLocalAlias = (domain) => {
  if (!domain) return null;
  const normalized = String(domain).trim().toLowerCase();
  const label = normalized.split(".")[0];
  return label ? `${label}.local` : null;
};

const getCachedPublication = async (key) => {
  if (!isRedisAvailable()) return null;
  try {
    const client = getRedisClient();
    if (!client) return null;
    const data = await client.get(key);
    if (!data) return null;
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch (error) {
    logger.error(error.message, "[PublicationResolver] Cache get failed:");
    return null;
  }
};

const setCachedPublication = async (key, value) => {
  if (!isRedisAvailable()) return false;
  try {
    const client = getRedisClient();
    if (!client) return false;
    await client.setex(key, CACHE_TTL_SECONDS, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error(error.message, "[PublicationResolver] Cache set failed:");
    return false;
  }
};

const deleteCachedPublication = async (key) => {
  if (!isRedisAvailable()) return false;
  try {
    const client = getRedisClient();
    if (!client) return false;
    await client.del(key);
    return true;
  } catch (error) {
    logger.error(error.message, "[PublicationResolver] Cache delete failed:");
    return false;
  }
};

export const resolvePublicationBySubdomain = async (subdomain) => {
  if (!subdomain) return null;
  const normalized = String(subdomain).trim().toLowerCase();
  const cacheKey = cacheKeyForSubdomain(normalized);

  const cached = await getCachedPublication(cacheKey);
  if (cached) return cached;

  const [record] = await db
    .select()
    .from(publication)
    .where(eq(publication.subdomain, normalized))
    .limit(1);

  if (!record) return null;

  await setCachedPublication(cacheKey, record);
  if (record.customDomain) {
    await setCachedPublication(
      cacheKeyForCustomDomain(record.customDomain.toLowerCase()),
      record,
    );
    const localAlias = toLocalAlias(record.customDomain);
    if (localAlias) {
      await setCachedPublication(cacheKeyForCustomDomain(localAlias), record);
    }
  }

  return record;
};

export const resolvePublicationByCustomDomain = async (customDomain) => {
  if (!customDomain) return null;
  const normalized = String(customDomain).trim().toLowerCase();
  const cacheKey = cacheKeyForCustomDomain(normalized);

  const cached = await getCachedPublication(cacheKey);
  if (cached) return cached;

  const [record] = await db
    .select()
    .from(publication)
    .where(eq(publication.customDomain, normalized))
    .limit(1);

  let resolvedRecord = record;

  if (!resolvedRecord && isLocalCustomDomainAlias(normalized)) {
    const label = normalized.split(".")[0];
    const matches = await db
      .select()
      .from(publication)
      .where(sql`split_part(${publication.customDomain}, '.', 1) = ${label}`)
      .limit(2);

    if (matches.length === 1) {
      resolvedRecord = matches[0];
    }
  }

  if (!resolvedRecord) return null;

  await setCachedPublication(cacheKey, resolvedRecord);
  await setCachedPublication(
    cacheKeyForSubdomain(resolvedRecord.subdomain),
    resolvedRecord,
  );
  if (resolvedRecord.customDomain) {
    await setCachedPublication(
      cacheKeyForCustomDomain(resolvedRecord.customDomain.toLowerCase()),
      resolvedRecord,
    );
  }

  return resolvedRecord;
};

export const invalidatePublicationCache = async ({
  subdomain,
  customDomain,
}) => {
  const tasks = [];
  if (subdomain) {
    tasks.push(deleteCachedPublication(cacheKeyForSubdomain(subdomain)));
  }
  if (customDomain) {
    tasks.push(deleteCachedPublication(cacheKeyForCustomDomain(customDomain)));
    const localAlias = toLocalAlias(customDomain);
    if (localAlias) {
      tasks.push(deleteCachedPublication(cacheKeyForCustomDomain(localAlias)));
    }
  }
  if (tasks.length === 0) return false;
  await Promise.all(tasks);
  return true;
};
