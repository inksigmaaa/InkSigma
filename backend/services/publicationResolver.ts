import { db } from "../config/database.js";
import { publication, publicationHostname } from "../models/schema.js";
import { and, eq, sql } from "drizzle-orm";
import {
  getRedisClient,
  isRedisAvailable,
  reportRedisFailure,
} from "../config/redis.js";
import logger from "../utils/logger.js";
import {
  getLocalCustomDomainAlias,
  getPublicationCanonicalHost,
  PUBLICATION_HOSTNAME_KIND,
  PUBLICATION_HOSTNAME_STATUS,
  normalizePublicationHostnameValue,
} from "./publicationHostnameService.js";
import {
  CUSTOM_DOMAIN_STATUS,
  isCustomDomainActive,
} from "./customDomainService.js";
import {
  classifyHostForRouting,
  normalizeHost,
} from "../utils/hostnameRouting.js";

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
  return getLocalCustomDomainAlias(domain) || null;
};

const resolvePublicationByHistoricalHostname = async (kind, value) => {
  const normalized = normalizePublicationHostnameValue(kind, value);
  if (!normalized) return null;

  const [match] = await db
    .select()
    .from(publicationHostname)
    .innerJoin(
      publication,
      eq(publicationHostname.publicationId, publication.id),
    )
    .where(
      and(
        eq(publicationHostname.kind, kind),
        eq(publicationHostname.value, normalized),
      ),
    )
    .limit(1);

  return match?.publication || null;
};

const resolveHostnameRecord = async (kind, value) => {
  const normalized = normalizePublicationHostnameValue(kind, value);
  if (!normalized) return null;

  const [match] = await db
    .select({
      hostname: {
        id: publicationHostname.id,
        kind: publicationHostname.kind,
        value: publicationHostname.value,
        status: publicationHostname.status,
      },
      publication,
    })
    .from(publicationHostname)
    .innerJoin(
      publication,
      eq(publicationHostname.publicationId, publication.id),
    )
    .where(
      and(
        eq(publicationHostname.kind, kind),
        eq(publicationHostname.value, normalized),
      ),
    )
    .limit(1);

  return match || null;
};

const resolveLocalAliasHostnameRecord = async (host) => {
  const normalizedHost = normalizeHost(host);
  if (!isLocalCustomDomainAlias(normalizedHost)) return null;

  const label = normalizedHost.split(".")[0];
  const matches = await db
    .select({
      hostname: {
        id: publicationHostname.id,
        kind: publicationHostname.kind,
        value: publicationHostname.value,
        status: publicationHostname.status,
      },
      publication,
    })
    .from(publicationHostname)
    .innerJoin(
      publication,
      eq(publicationHostname.publicationId, publication.id),
    )
    .where(
      and(
        eq(publicationHostname.kind, PUBLICATION_HOSTNAME_KIND.CUSTOM_DOMAIN),
        sql`split_part(${publicationHostname.value}, '.', 1) = ${label}`,
      ),
    )
    .limit(10);

  if (matches.length === 0) return null;

  const publicationIds = new Set(matches.map((match) => match.publication.id));
  if (publicationIds.size > 1) {
    return null;
  }

  return (
    matches.find(
      (match) =>
        match.hostname.status === PUBLICATION_HOSTNAME_STATUS.ACTIVE &&
        getLocalCustomDomainAlias(match.hostname.value) === normalizedHost,
    ) ||
    matches.find(
      (match) => getLocalCustomDomainAlias(match.hostname.value) === normalizedHost,
    ) ||
    null
  );
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
    reportRedisFailure(error, "publicationResolver.cache.get");
    logger.debug(error, "[PublicationResolver] Cache get failed");
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
    reportRedisFailure(error, "publicationResolver.cache.set");
    logger.debug(error, "[PublicationResolver] Cache set failed");
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
    reportRedisFailure(error, "publicationResolver.cache.delete");
    logger.debug(error, "[PublicationResolver] Cache delete failed");
    return false;
  }
};

export const resolvePublicationBySubdomain = async (subdomain) => {
  if (!subdomain) return null;
  const normalized = normalizePublicationHostnameValue(
    PUBLICATION_HOSTNAME_KIND.SUBDOMAIN,
    subdomain,
  );
  const cacheKey = cacheKeyForSubdomain(normalized);

  const cached = await getCachedPublication(cacheKey);
  if (cached) return cached;

  const [record] = await db
    .select()
    .from(publication)
    .where(eq(publication.subdomain, normalized))
    .limit(1);

  const resolvedRecord =
    record ||
    (await resolvePublicationByHistoricalHostname(
      PUBLICATION_HOSTNAME_KIND.SUBDOMAIN,
      normalized,
    ));

  if (!resolvedRecord) return null;

  await setCachedPublication(cacheKey, resolvedRecord);
  if (isCustomDomainActive(resolvedRecord)) {
    await setCachedPublication(
      cacheKeyForCustomDomain(resolvedRecord.customDomain.toLowerCase()),
      resolvedRecord,
    );
    const localAlias = toLocalAlias(resolvedRecord.customDomain);
    if (localAlias) {
      await setCachedPublication(
        cacheKeyForCustomDomain(localAlias),
        resolvedRecord,
      );
    }
  }

  return resolvedRecord;
};

export const resolvePublicationByCustomDomain = async (customDomain) => {
  if (!customDomain) return null;
  const normalized = normalizePublicationHostnameValue(
    PUBLICATION_HOSTNAME_KIND.CUSTOM_DOMAIN,
    customDomain,
  );
  const cacheKey = cacheKeyForCustomDomain(normalized);

  const cached = await getCachedPublication(cacheKey);
  if (cached) return cached;

  const [record] = await db
    .select()
    .from(publication)
    .where(
      and(
        eq(publication.customDomain, normalized),
        eq(publication.customDomainStatus, CUSTOM_DOMAIN_STATUS.ACTIVE),
      ),
    )
    .limit(1);

  let resolvedRecord =
    record ||
    (await resolvePublicationByHistoricalHostname(
      PUBLICATION_HOSTNAME_KIND.CUSTOM_DOMAIN,
      normalized,
    ));

  if (!resolvedRecord && isLocalCustomDomainAlias(normalized)) {
    const label = normalized.split(".")[0];
    const directMatches = await db
      .select()
      .from(publication)
      .where(
        and(
          sql`split_part(${publication.customDomain}, '.', 1) = ${label}`,
          eq(publication.customDomainStatus, CUSTOM_DOMAIN_STATUS.ACTIVE),
        ),
      )
      .limit(2);

    if (directMatches.length === 1) {
      resolvedRecord = directMatches[0];
    } else if (directMatches.length === 0) {
      const historicalMatches = await db
        .select()
        .from(publicationHostname)
        .innerJoin(
          publication,
          eq(publicationHostname.publicationId, publication.id),
        )
        .where(
          and(
            eq(
              publicationHostname.kind,
              PUBLICATION_HOSTNAME_KIND.CUSTOM_DOMAIN,
            ),
            sql`split_part(${publicationHostname.value}, '.', 1) = ${label}`,
          ),
        )
        .limit(2);

      if (historicalMatches.length === 1) {
        resolvedRecord = historicalMatches[0].publication;
      }
    }
  }

  if (!resolvedRecord) return null;

  await setCachedPublication(cacheKey, resolvedRecord);
  await setCachedPublication(
    cacheKeyForSubdomain(resolvedRecord.subdomain),
    resolvedRecord,
  );
  if (isCustomDomainActive(resolvedRecord)) {
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

export const resolvePublicationRoutingByHost = async (host) => {
  const parsed = classifyHostForRouting(host);

  if (
    !parsed.host ||
    parsed.isRootDomain ||
    parsed.isDashboard ||
    parsed.isReservedSubdomain ||
    !parsed.kind
  ) {
    return {
      host: parsed.host,
      publication: null,
      matchedHostname: null,
      canonicalHost: null,
      shouldRedirect: false,
      type: parsed.isCustomDomain ? "custom-domain" : "root",
    };
  }

  let match = await resolveHostnameRecord(parsed.kind, parsed.value);

  if (!match && parsed.isCustomDomain) {
    match = await resolveLocalAliasHostnameRecord(parsed.host);
  }

  const matchedPublication =
    match?.publication ||
    (parsed.kind === PUBLICATION_HOSTNAME_KIND.SUBDOMAIN
      ? await resolvePublicationBySubdomain(parsed.value)
      : await resolvePublicationByCustomDomain(parsed.value));

  const canonicalHost = getPublicationCanonicalHost(matchedPublication) || null;
  const shouldRedirect = Boolean(
    match &&
      match.hostname.status === PUBLICATION_HOSTNAME_STATUS.REDIRECT &&
      canonicalHost &&
      canonicalHost !== parsed.host,
  );

  return {
    host: parsed.host,
    publication: matchedPublication || null,
    matchedHostname: match?.hostname || null,
    canonicalHost,
    shouldRedirect,
    type: parsed.isCustomDomain ? "custom-domain" : "subdomain",
  };
};
