import crypto from "node:crypto";
import dns from "node:dns/promises";
import {
  createConcurrencyLimiter,
  getEnvNumber,
  withTimeout,
} from "../utils/externalOps.js";
import sliService from "./sliService.js";

export const CUSTOM_DOMAIN_STATUS = {
  PENDING_VERIFICATION: "pending_verification",
  VERIFIED: "verified",
  SSL_PENDING: "ssl_pending",
  ACTIVE: "active",
  FAILED: "failed",
  DETACHED: "detached",
} as const;

type CustomDomainStatus =
  (typeof CUSTOM_DOMAIN_STATUS)[keyof typeof CUSTOM_DOMAIN_STATUS];

type PublicationCustomDomainLike = {
  customDomain?: string | null;
  customDomainStatus?: string | null;
  customDomainVerificationToken?: string | null;
  customDomainVerificationError?: string | null;
  customDomainVerifiedAt?: Date | null;
  customDomainLastCheckedAt?: Date | null;
};

type CustomDomainLifecycleFields = {
  customDomain: string | null;
  customDomainStatus: CustomDomainStatus | null;
  customDomainVerificationToken: string | null;
  customDomainVerificationError: string | null;
  customDomainVerifiedAt: Date | null;
  customDomainLastCheckedAt: Date | null;
};

type CustomDomainVerificationFields = {
  customDomainStatus: CustomDomainStatus | null;
  customDomainVerificationError: string | null;
  customDomainVerifiedAt: Date | null;
  customDomainLastCheckedAt: Date | null;
};

type CustomDomainConfiguration = {
  verificationRecord: {
    type: "TXT";
    host: string;
    value: string;
  } | null;
  routingTargets: {
    cname: string[];
    ip: string[];
  };
};

const normalizeCustomDomainValue = (value: string | null | undefined) => {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!normalized) return null;
  return normalized.replace(/^https?:\/\//, "").split("/")[0] || null;
};

const normalizeCustomDomainStatus = (
  status: string | null | undefined,
): CustomDomainStatus | null => {
  if (!status) return null;

  return Object.values(CUSTOM_DOMAIN_STATUS).includes(status as CustomDomainStatus)
    ? (status as CustomDomainStatus)
    : null;
};

const isLocalDomain = (domain: string | null | undefined) =>
  Boolean(
    domain &&
      (domain.endsWith(".local") ||
        domain.endsWith(".localhost") ||
        domain === "localhost"),
  );

const shouldAutoActivateCustomDomain = (domain: string | null | undefined) =>
  Boolean(domain) &&
  (process.env.NODE_ENV === "development" || isLocalDomain(domain));

const generateVerificationToken = () => crypto.randomBytes(16).toString("hex");

const parseConfiguredTargets = (...values: Array<string | undefined>) =>
  values
    .flatMap((value) =>
      String(value || "")
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    )
    .filter(Boolean);

const DNS_LOOKUP_TIMEOUT_MS = getEnvNumber(
  process.env.DNS_LOOKUP_TIMEOUT_MS,
  2500,
  100,
);
const DNS_LOOKUP_MAX_CONCURRENCY = getEnvNumber(
  process.env.DNS_LOOKUP_MAX_CONCURRENCY,
  8,
  1,
);
const runDnsLookupLimited = createConcurrencyLimiter(DNS_LOOKUP_MAX_CONCURRENCY);

const runDnsLookup = <T>(operationName: string, operation: () => Promise<T>) =>
  runDnsLookupLimited(() =>
    withTimeout(operation, {
      timeoutMs: DNS_LOOKUP_TIMEOUT_MS,
      operationName: `dns.${operationName}`,
    }),
  );

const resolveTxtValues = async (hostname: string) => {
  try {
    const records = await runDnsLookup(`resolveTxt:${hostname}`, () =>
      dns.resolveTxt(hostname),
    );
    return records.flat().map((value) => value.trim());
  } catch {
    return [];
  }
};

const resolveCnameValues = async (hostname: string) => {
  try {
    return (
      await runDnsLookup(`resolveCname:${hostname}`, () =>
        dns.resolveCname(hostname),
      )
    ).map((value) =>
      value.replace(/\.$/, "").trim().toLowerCase(),
    );
  } catch {
    return [];
  }
};

const resolveAValues = async (hostname: string) => {
  try {
    return (
      await runDnsLookup(`resolve4:${hostname}`, () => dns.resolve4(hostname))
    ).map((value) => value.trim().toLowerCase());
  } catch {
    return [];
  }
};

const resolveAaaaValues = async (hostname: string) => {
  try {
    return (
      await runDnsLookup(`resolve6:${hostname}`, () => dns.resolve6(hostname))
    ).map((value) => value.trim().toLowerCase());
  } catch {
    return [];
  }
};

export const getConfiguredCustomDomainTargets = () => ({
  cname: parseConfiguredTargets(
    process.env.CUSTOM_DOMAIN_CNAME_TARGETS,
    process.env.CUSTOM_DOMAIN_CNAME_TARGET,
  ),
  ip: parseConfiguredTargets(
    process.env.CUSTOM_DOMAIN_IP_TARGETS,
    process.env.CUSTOM_DOMAIN_IP_TARGET,
  ),
});

export const getCustomDomainVerificationRecordValue = (
  token: string | null | undefined,
) => {
  if (!token) return "";
  return `inksigma-verification=${String(token).trim()}`;
};

export const getCustomDomainVerificationHostname = (
  domain: string | null | undefined,
) => {
  const normalized = normalizeCustomDomainValue(domain);
  return normalized ? `_inksigma.${normalized}` : "";
};

export const getCustomDomainConfiguration = ({
  domain,
  token,
}: {
  domain: string | null | undefined;
  token: string | null | undefined;
}): CustomDomainConfiguration => {
  const verificationHost = getCustomDomainVerificationHostname(domain);
  const verificationValue = getCustomDomainVerificationRecordValue(token);
  const routingTargets = getConfiguredCustomDomainTargets();

  return {
    verificationRecord:
      verificationHost && verificationValue
        ? {
            type: "TXT",
            host: verificationHost,
            value: verificationValue,
          }
        : null,
    routingTargets,
  };
};

export const isCustomDomainActive = (
  publicationRecord: PublicationCustomDomainLike | null | undefined,
) => {
  const customDomain = normalizeCustomDomainValue(publicationRecord?.customDomain);
  if (!customDomain) return false;

  return publicationRecord?.customDomainStatus === CUSTOM_DOMAIN_STATUS.ACTIVE;
};

export const buildCustomDomainLifecycleFields = ({
  currentPublication,
  nextCustomDomain,
}: {
  currentPublication?: PublicationCustomDomainLike | null;
  nextCustomDomain?: string | null;
}): CustomDomainLifecycleFields => {
  const normalizedCurrent = normalizeCustomDomainValue(
    currentPublication?.customDomain,
  );
  const normalizedNext = normalizeCustomDomainValue(nextCustomDomain);
  const now = new Date();

  if (!normalizedNext) {
    return {
      customDomain: null,
      customDomainStatus: null,
      customDomainVerificationToken: null,
      customDomainVerificationError: null,
      customDomainVerifiedAt: null,
      customDomainLastCheckedAt: null,
    };
  }

  if (normalizedCurrent === normalizedNext) {
    return {
      customDomain: normalizedNext,
      customDomainStatus:
        normalizeCustomDomainStatus(currentPublication?.customDomainStatus) ||
        (shouldAutoActivateCustomDomain(normalizedNext)
          ? CUSTOM_DOMAIN_STATUS.ACTIVE
          : CUSTOM_DOMAIN_STATUS.PENDING_VERIFICATION),
      customDomainVerificationToken:
        currentPublication?.customDomainVerificationToken ||
        (shouldAutoActivateCustomDomain(normalizedNext)
          ? null
          : generateVerificationToken()),
      customDomainVerificationError:
        currentPublication?.customDomainVerificationError || null,
      customDomainVerifiedAt: currentPublication?.customDomainVerifiedAt || null,
      customDomainLastCheckedAt: currentPublication?.customDomainLastCheckedAt || null,
    };
  }

  if (shouldAutoActivateCustomDomain(normalizedNext)) {
    return {
      customDomain: normalizedNext,
      customDomainStatus: CUSTOM_DOMAIN_STATUS.ACTIVE,
      customDomainVerificationToken: null,
      customDomainVerificationError: null,
      customDomainVerifiedAt: now,
      customDomainLastCheckedAt: now,
    };
  }

  return {
    customDomain: normalizedNext,
    customDomainStatus: CUSTOM_DOMAIN_STATUS.PENDING_VERIFICATION,
    customDomainVerificationToken: generateVerificationToken(),
    customDomainVerificationError: null,
    customDomainVerifiedAt: null,
    customDomainLastCheckedAt: null,
  };
};

export const verifyCustomDomainLifecycle = async (
  publicationRecord: PublicationCustomDomainLike | null | undefined,
): Promise<CustomDomainVerificationFields> => {
  const customDomain = normalizeCustomDomainValue(publicationRecord?.customDomain);
  const now = new Date();

  const verificationFailure = (
    status: CustomDomainStatus | null,
    message: string,
    verifiedAt: Date | null,
  ): CustomDomainVerificationFields => {
    sliService.recordDomainVerification(false);
    return {
      customDomainStatus: status,
      customDomainVerificationError: message,
      customDomainVerifiedAt: verifiedAt,
      customDomainLastCheckedAt: now,
    };
  };

  const verificationSuccess = (
    status: CustomDomainStatus,
    verifiedAt: Date,
  ): CustomDomainVerificationFields => {
    sliService.recordDomainVerification(true);
    return {
      customDomainStatus: status,
      customDomainVerificationError: null,
      customDomainVerifiedAt: verifiedAt,
      customDomainLastCheckedAt: now,
    };
  };

  if (!customDomain) {
    return verificationFailure(null, "Custom domain is not configured.", null);
  }

  if (shouldAutoActivateCustomDomain(customDomain)) {
    return verificationSuccess(
      CUSTOM_DOMAIN_STATUS.ACTIVE as CustomDomainStatus,
      now,
    );
  }

  const verificationToken = String(
    publicationRecord?.customDomainVerificationToken || "",
  ).trim();

  if (!verificationToken) {
    return verificationFailure(
      CUSTOM_DOMAIN_STATUS.FAILED as CustomDomainStatus,
      "Verification token is missing. Save the custom domain again to regenerate it.",
      null,
    );
  }

  const verificationHost = getCustomDomainVerificationHostname(customDomain);
  const verificationValue =
    getCustomDomainVerificationRecordValue(verificationToken);

  const txtRecords = [
    ...(await resolveTxtValues(verificationHost)),
    ...(await resolveTxtValues(customDomain)),
  ];

  const ownershipVerified = txtRecords.some((record) => {
    const normalizedRecord = record.trim();
    return (
      normalizedRecord === verificationValue ||
      normalizedRecord === verificationToken
    );
  });

  if (!ownershipVerified) {
    return verificationFailure(
      CUSTOM_DOMAIN_STATUS.FAILED as CustomDomainStatus,
      "Ownership check failed. Add the verification TXT record and try again.",
      null,
    );
  }

  const { cname: expectedCnameTargets, ip: expectedIpTargets } =
    getConfiguredCustomDomainTargets();

  const cnameValues = await resolveCnameValues(customDomain);
  const ipValues = [
    ...(await resolveAValues(customDomain)),
    ...(await resolveAaaaValues(customDomain)),
  ];

  const hasRoutingTargets =
    expectedCnameTargets.length > 0 || expectedIpTargets.length > 0;
  const routingVerified =
    !hasRoutingTargets ||
    cnameValues.some((value) => expectedCnameTargets.includes(value)) ||
    ipValues.some((value) => expectedIpTargets.includes(value));

  if (!routingVerified) {
    return verificationFailure(
      CUSTOM_DOMAIN_STATUS.VERIFIED as CustomDomainStatus,
      "Ownership verified, but the domain is not pointing to InkSigma yet.",
      now,
    );
  }

  return verificationSuccess(
    CUSTOM_DOMAIN_STATUS.ACTIVE as CustomDomainStatus,
    now,
  );
};
