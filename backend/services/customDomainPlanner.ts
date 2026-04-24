import { domainToASCII } from "node:url";
import validator from "validator";
import { parseConfiguredDomains } from "../utils/domainConfig.js";
import { BASE_DOMAINS, MAIN_DOMAIN, RESERVED_SUBDOMAINS } from "../utils/hostnameRouting.js";

export const CUSTOM_DOMAIN_TYPE = {
  APEX: "apex",
  SUBDOMAIN: "subdomain",
} as const;

type CustomDomainType =
  (typeof CUSTOM_DOMAIN_TYPE)[keyof typeof CUSTOM_DOMAIN_TYPE];

type PlannedDnsRecord = {
  type: "A" | "CNAME";
  name: string;
  value: string;
  ttl: string;
  role: "required" | "recommended";
};

type CustomDomainSetupPlan = {
  domain: string;
  domainType: CustomDomainType;
  apexDomain: string;
  records: PlannedDnsRecord[];
  warnings: string[];
};

type CustomDomainValidationResult =
  | {
      valid: true;
      normalizedDomain: string;
      domainType: CustomDomainType;
      apexDomain: string;
    }
  | {
      valid: false;
      error: string;
    };

const KNOWN_MULTI_LABEL_SUFFIXES = new Set([
  "co.uk",
  "org.uk",
  "gov.uk",
  "ac.uk",
  "co.jp",
  "com.au",
  "net.au",
  "org.au",
  "co.in",
  "com.br",
  "com.sg",
  "com.mx",
  "co.za",
]);

const normalizeConfiguredList = (...values: Array<string | undefined>) =>
  Array.from(
    new Set(
      values.flatMap((value) =>
        parseConfiguredDomains(value).map((entry) => entry.toLowerCase()),
      ),
    ),
  );

const getReservedPlatformDomains = () =>
  Array.from(new Set([...BASE_DOMAINS, MAIN_DOMAIN])).filter(Boolean);

const isLocalLikeDomain = (domain: string) =>
  domain === "localhost" ||
  domain.endsWith(".local") ||
  domain.endsWith(".localhost");

const getEffectiveKnownSuffixes = () =>
  new Set([
    ...KNOWN_MULTI_LABEL_SUFFIXES,
    ...normalizeConfiguredList(process.env.CUSTOM_DOMAIN_MULTI_LABEL_SUFFIXES),
  ]);

const inferDomainType = (domain: string) => {
  const labels = domain.split(".").filter(Boolean);
  if (labels.length <= 2) {
    return {
      domainType: CUSTOM_DOMAIN_TYPE.APEX,
      apexDomain: domain,
    };
  }

  const suffixes = getEffectiveKnownSuffixes();
  const lastTwoLabels = labels.slice(-2).join(".");
  const suffixLabelCount = suffixes.has(lastTwoLabels) ? 2 : 1;
  const apexStartIndex = labels.length - (suffixLabelCount + 1);
  const apexDomain = labels.slice(apexStartIndex).join(".");
  const domainType =
    labels.length === suffixLabelCount + 1
      ? CUSTOM_DOMAIN_TYPE.APEX
      : CUSTOM_DOMAIN_TYPE.SUBDOMAIN;

  return { domainType, apexDomain };
};

const parseIpTargets = (...values: Array<string | undefined>) =>
  Array.from(
    new Set(
      values
        .flatMap((value) =>
          String(value || "")
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean),
        )
        .filter((entry) => validator.isIP(entry) !== 0),
    ),
  );

const parseCnameTargets = (...values: Array<string | undefined>) =>
  Array.from(
    new Set(
      normalizeConfiguredList(...values).filter((entry) =>
        validator.isFQDN(entry, {
          require_tld: true,
          allow_underscores: false,
          allow_trailing_dot: false,
          allow_wildcard: false,
        }),
      ),
    ),
  );

const getApexHostLabel = (domain: string, apexDomain: string) =>
  domain === apexDomain ? "@" : domain.slice(0, -(apexDomain.length + 1));

export const normalizeCustomDomainValue = (
  value: string | null | undefined,
): string | null => {
  if (typeof value !== "string") return null;

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.includes("/") ||
    trimmed.includes("?") ||
    trimmed.includes("#")
  ) {
    return null;
  }

  const asciiDomain = domainToASCII(trimmed.replace(/\.$/, ""));
  if (!asciiDomain) return null;
  return asciiDomain.toLowerCase();
};

export const validateCustomDomainInput = (
  value: string | null | undefined,
): CustomDomainValidationResult => {
  const normalizedDomain = normalizeCustomDomainValue(value);
  if (!normalizedDomain) {
    return {
      valid: false,
      error:
        "Custom domain must be a valid hostname without protocol, path, query, or fragment.",
    };
  }

  const isDevelopment = process.env.NODE_ENV !== "production";
  const allowLocalDomain = isDevelopment && isLocalLikeDomain(normalizedDomain);
  const isFqdn = validator.isFQDN(normalizedDomain, {
    require_tld: !allowLocalDomain,
    allow_underscores: false,
    allow_trailing_dot: false,
    allow_wildcard: false,
  });

  if (!allowLocalDomain && !isFqdn) {
    return {
      valid: false,
      error: "Custom domain must be a valid fully qualified domain name.",
    };
  }

  const platformDomains = getReservedPlatformDomains();
  const collidesWithPlatformDomain = platformDomains.some(
    (platformDomain) =>
      normalizedDomain === platformDomain ||
      normalizedDomain.endsWith(`.${platformDomain}`),
  );
  if (collidesWithPlatformDomain) {
    return {
      valid: false,
      error: "This domain is reserved for the InkSigma platform.",
    };
  }

  const { domainType, apexDomain } = inferDomainType(normalizedDomain);
  const leftmostLabel = normalizedDomain.split(".")[0] || "";
  if (RESERVED_SUBDOMAINS.has(leftmostLabel) && domainType === CUSTOM_DOMAIN_TYPE.SUBDOMAIN) {
    return {
      valid: false,
      error: "This subdomain label is reserved and cannot be used as a custom domain.",
    };
  }

  return {
    valid: true,
    normalizedDomain,
    domainType,
    apexDomain,
  };
};

export const getConfiguredCustomDomainTargets = () => ({
  apexIpTargets: parseIpTargets(
    process.env.CUSTOM_DOMAIN_IP_TARGETS,
    process.env.CUSTOM_DOMAIN_IP_TARGET,
  ),
  subdomainCnameTargets: parseCnameTargets(
    process.env.CUSTOM_DOMAIN_CNAME_TARGETS,
    process.env.CUSTOM_DOMAIN_CNAME_TARGET,
  ),
});

export const buildCustomDomainSetupPlan = (
  domain: string | null | undefined,
): CustomDomainSetupPlan => {
  const validation = validateCustomDomainInput(domain);
  if (validation.valid === false) {
    throw new Error(validation.error);
  }

  const { normalizedDomain, domainType, apexDomain } = validation;
  const { apexIpTargets, subdomainCnameTargets } = getConfiguredCustomDomainTargets();
  const warnings: string[] = [];
  const records: PlannedDnsRecord[] = [];

  if (domainType === CUSTOM_DOMAIN_TYPE.APEX) {
    if (apexIpTargets.length === 0) {
      warnings.push("No apex A record targets are configured on the server.");
    }

    for (const value of apexIpTargets) {
      records.push({
        type: "A",
        name: "@",
        value,
        ttl: "Auto",
        role: "required",
      });
    }

    const recommendedCname = subdomainCnameTargets[0];
    if (recommendedCname) {
      records.push({
        type: "CNAME",
        name: "www",
        value: recommendedCname,
        ttl: "Auto",
        role: "recommended",
      });
    }
  } else {
    if (subdomainCnameTargets.length === 0) {
      warnings.push("No subdomain CNAME target is configured on the server.");
    }

    const hostLabel = getApexHostLabel(normalizedDomain, apexDomain);
    for (const value of subdomainCnameTargets) {
      records.push({
        type: "CNAME",
        name: hostLabel,
        value,
        ttl: "Auto",
        role: "required",
      });
    }
  }

  if (!isLocalLikeDomain(normalizedDomain)) {
    warnings.push(
      "If your DNS provider supports it, remove conflicting records before adding the required record.",
    );
  }

  return {
    domain: normalizedDomain,
    domainType,
    apexDomain,
    records,
    warnings,
  };
};
