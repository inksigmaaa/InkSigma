import { and, eq, ne } from "drizzle-orm";
import { publicationHostname } from "../models/schema.js";
import { isCustomDomainActive } from "./customDomainService.js";

export const PUBLICATION_HOSTNAME_KIND = {
  SUBDOMAIN: "subdomain",
  CUSTOM_DOMAIN: "custom_domain",
} as const;

export const PUBLICATION_HOSTNAME_STATUS = {
  ACTIVE: "active",
  REDIRECT: "redirect",
} as const;

type HostnameKind =
  (typeof PUBLICATION_HOSTNAME_KIND)[keyof typeof PUBLICATION_HOSTNAME_KIND];

type PublicationLike = {
  id: number;
  subdomain?: string | null;
  customDomain?: string | null;
  customDomainStatus?: string | null;
};

type HostnameEntry = {
  publicationId: number;
  kind: HostnameKind;
  value: string;
  status:
    | (typeof PUBLICATION_HOSTNAME_STATUS)[keyof typeof PUBLICATION_HOSTNAME_STATUS];
};

const normalizeValue = (value: string | null | undefined) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const isLocalLikeDomain = (domain: string) =>
  Boolean(domain) &&
  (domain === "localhost" || domain.endsWith(".local") || domain.endsWith(".localhost"));

export const normalizePublicationHostnameValue = (
  kind: HostnameKind,
  value: string | null | undefined,
) => {
  const normalized = normalizeValue(value);
  if (!normalized) return "";

  if (kind === PUBLICATION_HOSTNAME_KIND.SUBDOMAIN) {
    return normalized;
  }

  return normalized.replace(/^https?:\/\//, "").split("/")[0];
};

const getBaseDomains = () =>
  (
    process.env.BASE_DOMAINS ||
    process.env.BASE_DOMAIN ||
    "localhost,inksigma.local"
  )
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);

const shouldPreferBaseDomain = () => {
  if (process.env.NODE_ENV !== "production") return true;

  const baseDomains = getBaseDomains();
  return baseDomains.some((domain) => isLocalLikeDomain(domain));
};

const getPreferredBaseDomain = () => {
  const baseDomains = getBaseDomains();

  if (shouldPreferBaseDomain()) {
    return (
      baseDomains.find((domain) => domain.includes(".") && domain !== "localhost") ||
      baseDomains[0] ||
      "localhost"
    );
  }

  return (
    process.env.MAIN_DOMAIN ||
    getBaseDomains().find(
      (domain) =>
        domain === "localhost" ||
        domain.endsWith(".local") ||
        domain.endsWith(".localhost"),
    ) ||
    "inksigma.com"
  ).toLowerCase();
};

export const getLocalCustomDomainAlias = (customDomain: string | null | undefined) => {
  const normalized = normalizePublicationHostnameValue(
    PUBLICATION_HOSTNAME_KIND.CUSTOM_DOMAIN,
    customDomain,
  );
  if (!normalized) return "";

  const label = normalized.split(".")[0];
  return label ? `${label}.local` : "";
};

export const getPublicationCanonicalHost = (
  publicationRecord: PublicationLike | null | undefined,
) => {
  if (!publicationRecord) return "";

  const customDomain = isCustomDomainActive(publicationRecord)
    ? normalizePublicationHostnameValue(
        PUBLICATION_HOSTNAME_KIND.CUSTOM_DOMAIN,
        publicationRecord.customDomain,
      )
    : "";

  if (customDomain) {
    if (shouldPreferBaseDomain()) {
      return getLocalCustomDomainAlias(customDomain) || customDomain;
    }

    return customDomain;
  }

  const subdomain = normalizePublicationHostnameValue(
    PUBLICATION_HOSTNAME_KIND.SUBDOMAIN,
    publicationRecord.subdomain,
  );

  if (!subdomain) return "";

  return `${subdomain}.${getPreferredBaseDomain()}`;
};

const buildDesiredHostnames = (publicationRecord: PublicationLike) => {
  const subdomain = normalizePublicationHostnameValue(
    PUBLICATION_HOSTNAME_KIND.SUBDOMAIN,
    publicationRecord.subdomain,
  );
  const customDomain = normalizePublicationHostnameValue(
    PUBLICATION_HOSTNAME_KIND.CUSTOM_DOMAIN,
    publicationRecord.customDomain,
  );
  const activeCustomDomain = isCustomDomainActive(publicationRecord)
    ? customDomain
    : "";

  const desired = [];

  if (subdomain) {
    desired.push({
      kind: PUBLICATION_HOSTNAME_KIND.SUBDOMAIN,
      value: subdomain,
      status: activeCustomDomain
        ? PUBLICATION_HOSTNAME_STATUS.REDIRECT
        : PUBLICATION_HOSTNAME_STATUS.ACTIVE,
    });
  }

  if (activeCustomDomain) {
    desired.push({
      kind: PUBLICATION_HOSTNAME_KIND.CUSTOM_DOMAIN,
      value: activeCustomDomain,
      status: PUBLICATION_HOSTNAME_STATUS.ACTIVE,
    });
  }

  return desired;
};

const buildHistoricalHostnames = (publicationRecord?: PublicationLike | null) => {
  if (!publicationRecord) return [];

  const subdomain = normalizePublicationHostnameValue(
    PUBLICATION_HOSTNAME_KIND.SUBDOMAIN,
    publicationRecord.subdomain,
  );
  const customDomain = normalizePublicationHostnameValue(
    PUBLICATION_HOSTNAME_KIND.CUSTOM_DOMAIN,
    publicationRecord.customDomain,
  );
  const activeCustomDomain = isCustomDomainActive(publicationRecord)
    ? customDomain
    : "";

  return [
    subdomain
      ? {
          kind: PUBLICATION_HOSTNAME_KIND.SUBDOMAIN,
          value: subdomain,
          status: PUBLICATION_HOSTNAME_STATUS.REDIRECT,
        }
      : null,
    activeCustomDomain
      ? {
          kind: PUBLICATION_HOSTNAME_KIND.CUSTOM_DOMAIN,
          value: activeCustomDomain,
          status: PUBLICATION_HOSTNAME_STATUS.REDIRECT,
        }
      : null,
  ].filter(Boolean);
};

export const buildPublicationHostnamePlan = (
  previousPublication: PublicationLike | null | undefined,
  nextPublication: PublicationLike,
) => {
  const desiredEntries = buildDesiredHostnames(nextPublication);
  const historicalEntries = buildHistoricalHostnames(previousPublication);
  const entriesByKey = new Map<string, HostnameEntry>();

  for (const entry of [...historicalEntries, ...desiredEntries]) {
    if (!entry) continue;
    entriesByKey.set(`${entry.kind}:${entry.value}`, {
      ...entry,
      publicationId: nextPublication.id,
    });
  }

  return Array.from(entriesByKey.values());
};

export const isPublicationHostnameAvailable = async (
  executor,
  {
    kind,
    value,
    excludePublicationId,
  }: {
    kind: HostnameKind;
    value?: string | null;
    excludePublicationId?: number | null;
  },
) => {
  const normalized = normalizePublicationHostnameValue(kind, value);
  if (!normalized) return true;

  const conditions = [
    eq(publicationHostname.kind, kind),
    eq(publicationHostname.value, normalized),
  ];

  if (excludePublicationId) {
    conditions.push(ne(publicationHostname.publicationId, excludePublicationId));
  }

  const [existing] = await executor
    .select({
      id: publicationHostname.id,
      publicationId: publicationHostname.publicationId,
    })
    .from(publicationHostname)
    .where(and(...conditions))
    .limit(1);

  return !existing;
};

export const assertPublicationHostnamesAvailable = async (
  executor,
  {
    publicationId,
    subdomain,
    customDomain,
  }: {
    publicationId?: number | null;
    subdomain?: string | null;
    customDomain?: string | null;
  },
) => {
  if (subdomain) {
    const isSubdomainAvailable = await isPublicationHostnameAvailable(executor, {
      kind: PUBLICATION_HOSTNAME_KIND.SUBDOMAIN,
      value: subdomain,
      excludePublicationId: publicationId,
    });

    if (!isSubdomainAvailable) {
      throw new Error("Subdomain is already reserved");
    }
  }

  if (customDomain) {
    const isCustomDomainAvailable = await isPublicationHostnameAvailable(
      executor,
      {
        kind: PUBLICATION_HOSTNAME_KIND.CUSTOM_DOMAIN,
        value: customDomain,
        excludePublicationId: publicationId,
      },
    );

    if (!isCustomDomainAvailable) {
      throw new Error("Custom domain is already reserved");
    }
  }
};

export const syncPublicationHostnames = async (
  executor,
  {
    previousPublication,
    nextPublication,
  }: {
    previousPublication?: PublicationLike | null;
    nextPublication: PublicationLike;
  },
) => {
  const entriesByKey = new Map(
    buildPublicationHostnamePlan(previousPublication, nextPublication).map(
      (entry) => [`${entry.kind}:${entry.value}`, entry],
    ),
  );

  const existingRows = await executor
    .select()
    .from(publicationHostname)
    .where(eq(publicationHostname.publicationId, nextPublication.id));

  const existingByKey = new Map<string, (typeof existingRows)[number]>(
    existingRows.map((row) => [`${row.kind}:${row.value}`, row]),
  );

  for (const entry of entriesByKey.values()) {
    const existing = existingByKey.get(`${entry.kind}:${entry.value}`);

    if (existing) {
      if (existing.status !== entry.status) {
        await executor
          .update(publicationHostname)
          .set({
            status: entry.status,
            updatedAt: new Date(),
          })
          .where(eq(publicationHostname.id, existing.id));
      }
      continue;
    }

    const [conflict] = await executor
      .select({
        id: publicationHostname.id,
        publicationId: publicationHostname.publicationId,
      })
      .from(publicationHostname)
      .where(
        and(
          eq(publicationHostname.kind, entry.kind),
          eq(publicationHostname.value, entry.value),
          ne(publicationHostname.publicationId, nextPublication.id),
        ),
      )
      .limit(1);

    if (conflict) {
      throw new Error(
        entry.kind === PUBLICATION_HOSTNAME_KIND.SUBDOMAIN
          ? "Subdomain is already reserved"
          : "Custom domain is already reserved",
      );
    }

    await executor.insert(publicationHostname).values({
      publicationId: nextPublication.id,
      kind: entry.kind,
      value: entry.value,
      status: entry.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
};
