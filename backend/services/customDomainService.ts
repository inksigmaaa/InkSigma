import dns from "node:dns/promises";
import { randomBytes } from "node:crypto";
import logger from "../utils/logger.js";
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
import {
  VercelDomainError,
  addVercelProjectDomain,
  buildVercelDnsRecords,
  buildVercelVerificationRecords,
  getVercelDomainConfig,
  getVercelProjectDomain,
  getVercelProjectDomainStatusMessage,
  isVercelDomainIntegrationConfigured,
  shouldRequireVercelDomainIntegration,
  verifyVercelProjectDomain,
} from "./vercelDomainService.js";

export const CUSTOM_DOMAIN_STATUS = {
  PENDING_VERIFICATION: "pending_verification",
  VERIFIED: "verified",
  SSL_PENDING: "ssl_pending",
  ACTIVE: "active",
  FAILED: "failed",
  DETACHED: "detached",
} as const;

// Host prefix + value tag for the self-owned TXT ownership record we surface
// (and later check) when the hosting provider does not supply its own
// verification challenge. The record for `shop.test.com` looks like:
//   name:  _inksigma-verify.shop
//   value: inksigma-verify=<token>
const CUSTOM_DOMAIN_VERIFICATION_TXT_PREFIX = "inksigma-verify";

const generateCustomDomainVerificationToken = (): string =>
  randomBytes(16).toString("hex");

const CUSTOM_DOMAIN_SETUP_PLAN_PROVIDER_TIMEOUT_FLOOR_MS = 500;
const CUSTOM_DOMAIN_SETUP_PLAN_PROVIDER_TIMEOUT_MS = getEnvNumber(
  process.env.CUSTOM_DOMAIN_SETUP_PLAN_PROVIDER_TIMEOUT_MS,
  2500,
  CUSTOM_DOMAIN_SETUP_PLAN_PROVIDER_TIMEOUT_FLOOR_MS,
);

const getSetupPlanVercelConfig = () => {
  const config = getVercelDomainConfig();
  if (!config) return null;

  // Clamp the resulting timeout, not just the env-var source: a misconfigured
  // VERCEL_DOMAIN_TIMEOUT_MS below the floor must still respect it.
  const clampedTimeoutMs = Math.max(
    CUSTOM_DOMAIN_SETUP_PLAN_PROVIDER_TIMEOUT_FLOOR_MS,
    Math.min(config.timeoutMs, CUSTOM_DOMAIN_SETUP_PLAN_PROVIDER_TIMEOUT_MS),
  );

  return {
    ...config,
    timeoutMs: clampedTimeoutMs,
  };
};

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

type CustomDomainReachabilityStatus = {
  ready: boolean;
  status: "ready" | "provider_pending" | "ssl_pending" | "failed";
  message: string | null;
};

type CustomDomainProviderStatus = {
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

type CustomDomainSetupPlan = ReturnType<typeof buildCustomDomainSetupPlan>;

type CustomDomainSetupPlanWithProvider = Omit<
  CustomDomainSetupPlan,
  "records"
> & {
  records: Array<{
    type: "A" | "CNAME" | "TXT";
    name: string;
    value: string;
    ttl: string;
    role: "required" | "recommended";
  }>;
  provider?: "vercel";
  providerConfigured?: boolean;
  providerRecordsAvailable?: boolean;
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

const shouldUseVercelDomainProvider = () =>
  isVercelDomainIntegrationConfigured();

const assertVercelDomainProviderConfiguredForSave = () => {
  if (isVercelDomainIntegrationConfigured()) return;
  if (!shouldRequireVercelDomainIntegration()) return;

  throw new VercelDomainError(
    "Vercel custom-domain integration is not configured on the server.",
    { code: "vercel_not_configured" },
  );
};

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
const CUSTOM_DOMAIN_REACHABILITY_TIMEOUT_MS = getEnvNumber(
  process.env.CUSTOM_DOMAIN_REACHABILITY_TIMEOUT_MS,
  8000,
  500,
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

const resolveTxtValues = async (hostname: string) => {
  try {
    // dns.resolveTxt returns string[][] — each record may be split into
    // multiple character-strings that must be concatenated back together.
    return (
      await runDnsLookup(`resolveTxt:${hostname}`, () => dns.resolveTxt(hostname))
    ).map((chunks) => chunks.join("").trim());
  } catch {
    return [];
  }
};

// The self-owned ownership record's fully-qualified host and expected value for a
// given custom domain, e.g. `_inksigma-verify.shop.test.com` /
// `inksigma-verify=<token>`. Returns null when the domain is invalid.
const getCustomDomainVerificationTxt = (
  customDomain: string,
  token: string,
): { fqdn: string; relativeName: string; value: string } | null => {
  const validation = validateCustomDomainInput(customDomain);
  if (validation.valid === false) return null;

  const fqdn = `_${CUSTOM_DOMAIN_VERIFICATION_TXT_PREFIX}.${validation.normalizedDomain}`;
  // Strip the trailing apex zone so the "Name" shown to the user is what they
  // enter at the registrar (relative to their DNS zone).
  const relativeName =
    fqdn.slice(0, -(validation.apexDomain.length + 1)) || fqdn;

  return {
    fqdn,
    relativeName,
    value: `${CUSTOM_DOMAIN_VERIFICATION_TXT_PREFIX}=${token}`,
  };
};

const buildSelfOwnedVerificationRecords = (
  customDomain: string,
  token: string | null | undefined,
) => {
  if (!token) return [];
  const txt = getCustomDomainVerificationTxt(customDomain, token);
  if (!txt) return [];

  return [
    {
      type: "TXT" as const,
      name: txt.relativeName,
      value: txt.value,
      ttl: "Auto",
      role: "required" as const,
    },
  ];
};

const inspectCustomDomainOwnership = async (
  customDomain: string,
  token: string,
): Promise<CustomDomainDnsStatus> => {
  const txt = getCustomDomainVerificationTxt(customDomain, token);
  if (!txt) {
    return {
      ready: false,
      status: "failed",
      message: "Custom domain is not valid.",
    };
  }

  const txtValues = await resolveTxtValues(txt.fqdn);
  if (!txtValues.includes(txt.value)) {
    return {
      ready: false,
      status: "pending",
      message:
        "Domain ownership is not verified yet. Add the required TXT record and wait for DNS to propagate.",
    };
  }

  return { ready: true, status: "ready", message: null };
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
      customDomainVerificationToken: shouldAutoActivateCustomDomain(normalizedNext)
        ? null
        : currentPublication?.customDomainVerificationToken ||
          generateCustomDomainVerificationToken(),
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
    customDomainVerificationToken: generateCustomDomainVerificationToken(),
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

const isTlsOrConnectionFailure = (error: unknown) => {
  const message = String((error as Error)?.message || "");
  const cause = (error as { cause?: { code?: string } })?.cause;
  const code = cause?.code || "";

  return [
    "CERT_",
    "ERR_TLS",
    "DEPTH_ZERO_SELF_SIGNED_CERT",
    "SELF_SIGNED_CERT",
    "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
    "ECONNREFUSED",
    "ECONNRESET",
    "ENOTFOUND",
    "EAI_AGAIN",
    "ETIMEDOUT",
  ].some((token) => code.includes(token) || message.includes(token));
};

const inspectCustomDomainReachability = async (
  customDomain: string,
): Promise<CustomDomainReachabilityStatus> => {
  const url = `https://${customDomain}/`;

  try {
    const response = await withTimeout(
      () =>
        fetch(url, {
          method: "GET",
          redirect: "manual",
          headers: {
            "User-Agent": "InkSigma-Custom-Domain-Verification/1.0",
          },
        }),
      {
        timeoutMs: CUSTOM_DOMAIN_REACHABILITY_TIMEOUT_MS,
        operationName: `customDomain.reachability:${customDomain}`,
      },
    );

    const providerError = response.headers.get("x-vercel-error");
    if (providerError) {
      return {
        ready: false,
        status: "provider_pending",
        message:
          providerError === "DEPLOYMENT_NOT_FOUND"
            ? "DNS is verified, but the custom domain is not attached to the frontend hosting project yet."
            : `DNS is verified, but the hosting provider is not ready yet (${providerError}).`,
      };
    }

    if (response.status >= 500) {
      return {
        ready: false,
        status: "provider_pending",
        message:
          "DNS is verified, but the custom domain is not serving InkSigma yet. Wait for hosting propagation and try again.",
      };
    }

    return {
      ready: true,
      status: "ready",
      message: null,
    };
  } catch (error) {
    return {
      ready: false,
      status: isTlsOrConnectionFailure(error) ? "ssl_pending" : "provider_pending",
      message:
        "DNS is verified, but HTTPS is not ready yet. Wait for the hosting provider to attach the domain and issue SSL.",
    };
  }
};

const inspectVercelDomainProviderStatus = async (
  customDomain: string,
): Promise<CustomDomainProviderStatus> => {
  if (!shouldUseVercelDomainProvider()) {
    return {
      ready: true,
      status: "ready",
      message: null,
    };
  }

  try {
    let projectDomain = await verifyVercelProjectDomain(customDomain);
    if (!projectDomain || projectDomain.verified === undefined) {
      projectDomain = await getVercelProjectDomain(customDomain);
    }

    if (projectDomain.verified === false) {
      return {
        ready: false,
        status: "pending",
        message: getVercelProjectDomainStatusMessage(projectDomain),
      };
    }

    return {
      ready: true,
      status: "ready",
      message: null,
    };
  } catch (error) {
    if (
      error instanceof VercelDomainError &&
      error.code === "vercel_not_configured"
    ) {
      return {
        ready: false,
        status: "failed",
        message:
          "Vercel custom-domain integration is not configured on the server.",
      };
    }

    return {
      ready: false,
      status: "failed",
      message:
        error instanceof Error
          ? error.message
          : "Failed to verify the domain with Vercel.",
    };
  }
};

export const attachCustomDomainToHostingProvider = async (
  customDomain: string,
): Promise<CustomDomainVerificationFields | null> => {
  assertVercelDomainProviderConfiguredForSave();
  if (!shouldUseVercelDomainProvider()) return null;

  const now = new Date();
  const projectDomain = await addVercelProjectDomain(customDomain);

  if (projectDomain.verified === false) {
    return {
      customDomainStatus: CUSTOM_DOMAIN_STATUS.PENDING_VERIFICATION,
      customDomainVerificationError:
        getVercelProjectDomainStatusMessage(projectDomain),
      customDomainVerifiedAt: null,
      customDomainLastCheckedAt: now,
    };
  }

  return {
    customDomainStatus: CUSTOM_DOMAIN_STATUS.VERIFIED,
    customDomainVerificationError: null,
    customDomainVerifiedAt: now,
    customDomainLastCheckedAt: now,
  };
};

export const buildCustomDomainSetupPlanWithProvider = async (
  domain: string | null | undefined,
  options: { verificationToken?: string | null } = {},
): Promise<CustomDomainSetupPlanWithProvider> => {
  const fallbackPlan = buildCustomDomainSetupPlan(domain);
  const providerConfig = getSetupPlanVercelConfig();
  const selfOwnedVerificationRecords = buildSelfOwnedVerificationRecords(
    fallbackPlan.domain,
    options.verificationToken,
  );

  if (!shouldUseVercelDomainProvider() || !providerConfig) {
    return {
      ...fallbackPlan,
      providerConfigured: false,
      providerRecordsAvailable: false,
      records: [...fallbackPlan.records, ...selfOwnedVerificationRecords],
    };
  }

  const [dnsPlan, projectDomain] = await Promise.all([
    buildVercelDnsRecords(fallbackPlan.domain, {
      config: providerConfig,
    }).catch((error) => {
      logger.warn(
        {
          err: error,
          domain: fallbackPlan.domain,
          timeoutMs: providerConfig.timeoutMs,
          code: "custom_domain.setup_plan.dns_plan_fallback",
        },
        "Vercel DNS plan unavailable for setup-plan; using static fallback",
      );
      return null;
    }),
    getVercelProjectDomain(fallbackPlan.domain, {
      config: providerConfig,
    }).catch((error) => {
      logger.warn(
        {
          err: error,
          domain: fallbackPlan.domain,
          timeoutMs: providerConfig.timeoutMs,
          code: "custom_domain.setup_plan.project_domain_fallback",
        },
        "Vercel project-domain lookup failed for setup-plan",
      );
      return null;
    }),
  ]);
  const providerVerificationRecords = projectDomain
    ? buildVercelVerificationRecords(projectDomain)
    : [];
  // Prefer the hosting provider's own ownership challenge; fall back to our
  // self-owned TXT record so an ownership step is always shown.
  const verificationRecords = providerVerificationRecords.length
    ? providerVerificationRecords
    : selfOwnedVerificationRecords;
  const fallbackWarnings = dnsPlan
    ? fallbackPlan.warnings.filter(
        (warning) =>
          !warning.includes("No apex A record targets") &&
          !warning.includes("No subdomain CNAME target"),
      )
    : fallbackPlan.warnings;

  return {
    ...fallbackPlan,
    provider: "vercel",
    providerConfigured: true,
    providerRecordsAvailable: Boolean(dnsPlan),
    records:
      dnsPlan?.records.length
        ? [...dnsPlan.records, ...verificationRecords]
        : [...fallbackPlan.records, ...verificationRecords],
    warnings: [
      ...fallbackWarnings,
      ...(dnsPlan?.configuration.misconfigured
        ? ["Vercel reports this domain is not configured correctly yet."]
        : []),
      ...(dnsPlan
        ? []
        : [
            "Hosting provider DNS recommendations could not be loaded quickly; showing default DNS records.",
          ]),
    ],
  };
};

export const verifyCustomDomainLifecycle = async (
  publicationRecord: PublicationCustomDomainLike | null | undefined,
  options: {
    dnsInspector?: (customDomain: string) => Promise<CustomDomainDnsStatus>;
    reachabilityInspector?: (
      customDomain: string,
    ) => Promise<CustomDomainReachabilityStatus>;
    ownershipInspector?: (
      customDomain: string,
      token: string,
    ) => Promise<CustomDomainDnsStatus>;
  } = {},
): Promise<CustomDomainVerificationFields> => {
  const customDomain = normalizeCustomDomainValue(publicationRecord?.customDomain);
  const verificationToken =
    publicationRecord?.customDomainVerificationToken || null;
  const now = new Date();
  const dnsInspector = options.dnsInspector || inspectCustomDomainDnsStatus;
  const reachabilityInspector =
    options.reachabilityInspector || inspectCustomDomainReachability;
  const ownershipInspector =
    options.ownershipInspector || inspectCustomDomainOwnership;

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

  // Ownership proof via the self-owned TXT record, checked before the hosting
  // provider's routing/SSL status on every path. Enforced only when a token has
  // been issued (domains saved before tokens existed keep their prior behavior)
  // and skipped for already-active domains so a re-check never regresses a live
  // domain if the user later removes the TXT record.
  const alreadyActive =
    normalizeCustomDomainStatus(publicationRecord?.customDomainStatus) ===
    CUSTOM_DOMAIN_STATUS.ACTIVE;
  if (verificationToken && !alreadyActive) {
    const ownershipStatus = await ownershipInspector(
      customDomain,
      verificationToken,
    );
    if (!ownershipStatus.ready) {
      return verificationFailure(
        ownershipStatus.status === "failed"
          ? (CUSTOM_DOMAIN_STATUS.FAILED as CustomDomainStatus)
          : (CUSTOM_DOMAIN_STATUS.PENDING_VERIFICATION as CustomDomainStatus),
        ownershipStatus.message || "Domain ownership is not verified yet.",
        null,
      );
    }
  }

  if (shouldUseVercelDomainProvider()) {
    const providerStatus = await inspectVercelDomainProviderStatus(customDomain);
    if (!providerStatus.ready) {
      return verificationFailure(
        providerStatus.status === "failed"
          ? (CUSTOM_DOMAIN_STATUS.FAILED as CustomDomainStatus)
          : (CUSTOM_DOMAIN_STATUS.PENDING_VERIFICATION as CustomDomainStatus),
        providerStatus.message ||
          "The hosting provider has not verified this domain yet.",
        null,
      );
    }

    const reachabilityStatus = await reachabilityInspector(customDomain);
    if (!reachabilityStatus.ready) {
      return verificationFailure(
        reachabilityStatus.status === "ssl_pending"
          ? (CUSTOM_DOMAIN_STATUS.SSL_PENDING as CustomDomainStatus)
          : (CUSTOM_DOMAIN_STATUS.VERIFIED as CustomDomainStatus),
        reachabilityStatus.message ||
          "DNS is verified, but the custom domain is not serving InkSigma yet.",
        now,
      );
    }

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

  const reachabilityStatus = await reachabilityInspector(customDomain);
  if (!reachabilityStatus.ready) {
    return verificationFailure(
      reachabilityStatus.status === "ssl_pending"
        ? (CUSTOM_DOMAIN_STATUS.SSL_PENDING as CustomDomainStatus)
        : (CUSTOM_DOMAIN_STATUS.VERIFIED as CustomDomainStatus),
      reachabilityStatus.message ||
        "DNS is verified, but the custom domain is not serving InkSigma yet.",
      now,
    );
  }

  return verificationSuccess(
    CUSTOM_DOMAIN_STATUS.ACTIVE as CustomDomainStatus,
    now,
  );
};

export {
  buildCustomDomainSetupPlan,
  generateCustomDomainVerificationToken,
  normalizeCustomDomainValue,
  validateCustomDomainInput,
};
