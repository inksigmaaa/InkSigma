import dns from "node:dns/promises";
import {
  createConcurrencyLimiter,
  getEnvNumber,
  withTimeout,
} from "../utils/externalOps.js";
import sliService from "./sliService.js";
import {
  CUSTOM_DOMAIN_TYPE,
  buildCustomDomainSetupPlan,
  getConfiguredCustomDomainTargets,
  normalizeCustomDomainValue,
  validateCustomDomainInput,
} from "./customDomainPlanner.js";

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

type CustomDomainDnsStatus = {
  ready: boolean;
  status: "ready" | "pending" | "failed";
  message: string | null;
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
  const nextDomainValidation =
    nextCustomDomain === null ||
    nextCustomDomain === undefined ||
    nextCustomDomain === ""
      ? null
      : validateCustomDomainInput(nextCustomDomain);
  const normalizedNext =
    nextDomainValidation && nextDomainValidation.valid
      ? nextDomainValidation.normalizedDomain
      : null;
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
      customDomainVerificationToken: null,
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
    customDomainVerificationToken: null,
    customDomainVerificationError: null,
    customDomainVerifiedAt: null,
    customDomainLastCheckedAt: null,
  };
};

const inspectCustomDomainDnsStatus = async (
  customDomain: string,
): Promise<CustomDomainDnsStatus> => {
  const validation = validateCustomDomainInput(customDomain);
  if (validation.valid === false) {
    return {
      ready: false,
      status: "failed",
      message: validation.error,
    };
  }

  const { normalizedDomain, domainType } = validation;
  const { apexIpTargets, subdomainCnameTargets } = getConfiguredCustomDomainTargets();
  const cnameValues = await resolveCnameValues(normalizedDomain);
  const aValues = await resolveAValues(normalizedDomain);
  const aaaaValues = await resolveAaaaValues(normalizedDomain);

  if (
    domainType === CUSTOM_DOMAIN_TYPE.SUBDOMAIN &&
    (aValues.length > 0 || aaaaValues.length > 0) &&
    cnameValues.length === 0
  ) {
    return {
      ready: false,
      status: "pending",
      message:
        "Subdomain DNS is not correct yet. Add the required CNAME record and remove conflicting A or AAAA records.",
    };
  }

  if (domainType === CUSTOM_DOMAIN_TYPE.APEX) {
    if (apexIpTargets.length === 0) {
      return {
        ready: false,
        status: "failed",
        message: "Apex A record targets are not configured on the server.",
      };
    }

    if (aaaaValues.length > 0) {
      return {
        ready: false,
        status: "pending",
        message:
          "Remove conflicting AAAA records from the root domain before activating the custom domain.",
      };
    }

    const matchesApexTarget = aValues.some((value) => apexIpTargets.includes(value));
    if (!matchesApexTarget) {
      return {
        ready: false,
        status: "pending",
        message:
          "Root domain DNS is not pointing to InkSigma yet. Add the required A record IP and wait for propagation.",
      };
    }

    return {
      ready: true,
      status: "ready",
      message: null,
    };
  }

  if (subdomainCnameTargets.length === 0) {
    return {
      ready: false,
      status: "failed",
      message: "Subdomain CNAME target is not configured on the server.",
    };
  }

  const matchesCnameTarget = cnameValues.some((value) =>
    subdomainCnameTargets.includes(value),
  );
  if (!matchesCnameTarget) {
    return {
      ready: false,
      status: "pending",
      message:
        "Subdomain DNS is not pointing to InkSigma yet. Add the required CNAME record and wait for propagation.",
    };
  }

  return {
    ready: true,
    status: "ready",
    message: null,
  };
};

export const verifyCustomDomainLifecycle = async (
  publicationRecord: PublicationCustomDomainLike | null | undefined,
  options: {
    dnsInspector?: (customDomain: string) => Promise<CustomDomainDnsStatus>;
  } = {},
): Promise<CustomDomainVerificationFields> => {
  const customDomain = normalizeCustomDomainValue(publicationRecord?.customDomain);
  const now = new Date();
  const dnsInspector = options.dnsInspector || inspectCustomDomainDnsStatus;

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

  const dnsStatus = await dnsInspector(customDomain);
  if (!dnsStatus.ready) {
    return verificationFailure(
      dnsStatus.status === "failed"
        ? (CUSTOM_DOMAIN_STATUS.FAILED as CustomDomainStatus)
        : (CUSTOM_DOMAIN_STATUS.PENDING_VERIFICATION as CustomDomainStatus),
      dnsStatus.message || "DNS is not configured correctly yet.",
      null,
    );
  }

  return verificationSuccess(
    CUSTOM_DOMAIN_STATUS.ACTIVE as CustomDomainStatus,
    now,
  );
};

export {
  buildCustomDomainSetupPlan,
  normalizeCustomDomainValue,
  validateCustomDomainInput,
};
