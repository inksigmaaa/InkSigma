import { getEnvNumber, withTimeout } from "../utils/externalOps.js";
import {
  CUSTOM_DOMAIN_TYPE,
  validateCustomDomainInput,
} from "./customDomainPlanner.js";

const VERCEL_API_BASE_URL = "https://api.vercel.com";

type VercelDomainConfig = {
  token: string;
  projectIdOrName: string;
  teamId?: string;
  teamSlug?: string;
  timeoutMs: number;
};

type VercelVerificationChallenge = {
  type?: string;
  domain?: string;
  value?: string;
  reason?: string;
};

type VercelProjectDomain = {
  name?: string;
  apexName?: string;
  projectId?: string;
  verified?: boolean;
  verification?: VercelVerificationChallenge[];
};

type VercelDomainConfiguration = {
  configuredBy?: "CNAME" | "A" | "http" | "dns-01" | null;
  acceptedChallenges?: string[];
  recommendedIPv4?: Array<{ value?: string; rank?: number } | string>;
  recommendedCNAME?: Array<{ value?: string; rank?: number } | string>;
  misconfigured?: boolean;
};

type PlannedDnsRecord = {
  type: "A" | "CNAME" | "TXT";
  name: string;
  value: string;
  ttl: string;
  role: "required" | "recommended";
};

type VercelFetchOptions = {
  method?: string;
  body?: unknown;
  fetchImpl?: typeof fetch;
  config?: VercelDomainConfig | null;
};

export class VercelDomainError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;

  constructor(
    message: string,
    params: { statusCode?: number; code?: string; details?: unknown } = {},
  ) {
    super(message);
    this.name = "VercelDomainError";
    this.statusCode = params.statusCode;
    this.code = params.code;
    this.details = params.details;
  }
}

export const isVercelDomainError = (error: unknown): error is VercelDomainError =>
  error instanceof VercelDomainError;

export const getVercelDomainConfig = (): VercelDomainConfig | null => {
  const token = process.env.VERCEL_TOKEN?.trim();
  const projectIdOrName =
    process.env.VERCEL_PROJECT_ID_OR_NAME?.trim() ||
    process.env.VERCEL_PROJECT_ID?.trim() ||
    process.env.VERCEL_PROJECT_NAME?.trim();

  if (!token || !projectIdOrName) return null;

  return {
    token,
    projectIdOrName,
    teamId: process.env.VERCEL_TEAM_ID?.trim() || undefined,
    teamSlug: process.env.VERCEL_TEAM_SLUG?.trim() || undefined,
    timeoutMs: getEnvNumber(process.env.VERCEL_API_TIMEOUT_MS, 8000, 500),
  };
};

export const isVercelDomainIntegrationConfigured = () =>
  Boolean(getVercelDomainConfig());

export const shouldRequireVercelDomainIntegration = () =>
  process.env.NODE_ENV === "production";

const normalizeVercelValue = (value: unknown) =>
  String(value || "")
    .replace(/\.$/, "")
    .trim()
    .toLowerCase();

const getChallengeMessage = (domain: VercelProjectDomain) => {
  const challenge = domain.verification?.find(
    (entry) => entry.type && entry.domain && entry.value,
  );

  if (!challenge) {
    return "Vercel has not verified this domain for the project yet.";
  }

  return `Add ${challenge.type} record ${challenge.domain} with value ${challenge.value} to verify domain ownership.`;
};

const buildQueryString = (config: VercelDomainConfig) => {
  const query = new URLSearchParams();
  if (config.teamId) query.set("teamId", config.teamId);
  if (config.teamSlug) query.set("slug", config.teamSlug);
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

const readJsonResponse = async (response: Response) => {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const getVercelErrorMessage = (payload: any, fallback: string) =>
  payload?.error?.message ||
  payload?.message ||
  payload?.error?.code ||
  payload?.error ||
  fallback;

const getVercelErrorCode = (payload: any) =>
  payload?.error?.code || payload?.code || undefined;

const vercelFetch = async <T>(
  path: string,
  options: VercelFetchOptions = {},
): Promise<T> => {
  const config = options.config === undefined ? getVercelDomainConfig() : options.config;
  if (!config) {
    throw new VercelDomainError(
      "Vercel custom-domain integration is not configured.",
      { code: "vercel_not_configured" },
    );
  }

  const fetchImpl = options.fetchImpl || fetch;
  const queryString = buildQueryString(config);
  const url = `${VERCEL_API_BASE_URL}${path}${queryString}`;
  const response = await withTimeout(
    () =>
      fetchImpl(url, {
        method: options.method || "GET",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      }),
    {
      timeoutMs: config.timeoutMs,
      operationName: `vercel.domain.${options.method || "GET"}:${path}`,
    },
  );

  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throw new VercelDomainError(
      getVercelErrorMessage(payload, `Vercel API request failed (${response.status})`),
      {
        statusCode: response.status,
        code: getVercelErrorCode(payload),
        details: payload,
      },
    );
  }

  return payload as T;
};

const projectDomainPath = (config: VercelDomainConfig, domain?: string) => {
  const project = encodeURIComponent(config.projectIdOrName);
  if (!domain) return `/v10/projects/${project}/domains`;
  return `/v9/projects/${project}/domains/${encodeURIComponent(domain)}`;
};

const isAlreadyOnProjectError = (error: unknown) => {
  if (!isVercelDomainError(error)) return false;
  const normalized = `${error.code || ""} ${error.message || ""}`.toLowerCase();
  return (
    (error.statusCode === 400 || error.statusCode === 409) &&
    normalized.includes("already")
  );
};

export const getVercelProjectDomain = async (
  domain: string,
  options: Pick<VercelFetchOptions, "fetchImpl" | "config"> = {},
) => {
  const config = options.config === undefined ? getVercelDomainConfig() : options.config;
  if (!config) {
    throw new VercelDomainError(
      "Vercel custom-domain integration is not configured.",
      { code: "vercel_not_configured" },
    );
  }

  return vercelFetch<VercelProjectDomain>(projectDomainPath(config, domain), {
    ...options,
    config,
  });
};

export const addVercelProjectDomain = async (
  domain: string,
  options: Pick<VercelFetchOptions, "fetchImpl" | "config"> = {},
) => {
  const config = options.config === undefined ? getVercelDomainConfig() : options.config;
  if (!config) {
    throw new VercelDomainError(
      "Vercel custom-domain integration is not configured.",
      { code: "vercel_not_configured" },
    );
  }

  try {
    return await vercelFetch<VercelProjectDomain>(projectDomainPath(config), {
      ...options,
      config,
      method: "POST",
      body: { name: domain },
    });
  } catch (error) {
    if (!isAlreadyOnProjectError(error)) throw error;
    return getVercelProjectDomain(domain, options);
  }
};

export const removeVercelProjectDomain = async (
  domain: string,
  options: Pick<VercelFetchOptions, "fetchImpl" | "config"> = {},
) => {
  const config = options.config === undefined ? getVercelDomainConfig() : options.config;
  if (!config) return false;

  try {
    await vercelFetch(projectDomainPath(config, domain), {
      ...options,
      config,
      method: "DELETE",
    });
    return true;
  } catch (error) {
    if (isVercelDomainError(error) && error.statusCode === 404) return false;
    throw error;
  }
};

export const verifyVercelProjectDomain = async (
  domain: string,
  options: Pick<VercelFetchOptions, "fetchImpl" | "config"> = {},
) => {
  const config = options.config === undefined ? getVercelDomainConfig() : options.config;
  if (!config) {
    throw new VercelDomainError(
      "Vercel custom-domain integration is not configured.",
      { code: "vercel_not_configured" },
    );
  }

  return vercelFetch<VercelProjectDomain>(
    `${projectDomainPath(config, domain)}/verify`,
    {
      ...options,
      config,
      method: "POST",
    },
  );
};

export const getVercelDomainConfiguration = async (
  domain: string,
  options: Pick<VercelFetchOptions, "fetchImpl" | "config"> = {},
) => {
  const config = options.config === undefined ? getVercelDomainConfig() : options.config;
  if (!config) {
    throw new VercelDomainError(
      "Vercel custom-domain integration is not configured.",
      { code: "vercel_not_configured" },
    );
  }

  const query = new URLSearchParams();
  query.set("projectIdOrName", config.projectIdOrName);
  if (config.teamId) query.set("teamId", config.teamId);
  if (config.teamSlug) query.set("slug", config.teamSlug);

  return vercelFetch<VercelDomainConfiguration>(
    `/v6/domains/${encodeURIComponent(domain)}/config?${query.toString()}`,
    {
      ...options,
      config: {
        ...config,
        teamId: undefined,
        teamSlug: undefined,
      },
    },
  );
};

const getRankedValues = (
  values: Array<{ value?: string; rank?: number } | string> | undefined,
) =>
  [...(values || [])]
    .map((entry) =>
      typeof entry === "string"
        ? { value: normalizeVercelValue(entry), rank: 1 }
        : { value: normalizeVercelValue(entry.value), rank: entry.rank || 1 },
    )
    .filter((entry) => entry.value)
    .sort((a, b) => a.rank - b.rank)
    .map((entry) => entry.value);

export const buildVercelDnsRecords = async (
  domain: string,
  options: Pick<VercelFetchOptions, "fetchImpl" | "config"> = {},
) => {
  const validation = validateCustomDomainInput(domain);
  if (validation.valid === false) {
    throw new VercelDomainError(validation.error, { code: "invalid_domain" });
  }

  const configuration = await getVercelDomainConfiguration(
    validation.normalizedDomain,
    options,
  );
  const records: PlannedDnsRecord[] = [];

  if (validation.domainType === CUSTOM_DOMAIN_TYPE.APEX) {
    const ipv4Values = getRankedValues(configuration.recommendedIPv4);
    for (const value of ipv4Values) {
      records.push({
        type: "A",
        name: "@",
        value,
        ttl: "Auto",
        role: "required",
      });
    }

    const cnameValue = getRankedValues(configuration.recommendedCNAME)[0];
    if (cnameValue) {
      records.push({
        type: "CNAME",
        name: "www",
        value: cnameValue,
        ttl: "Auto",
        role: "recommended",
      });
    }
  } else {
    const cnameValues = getRankedValues(configuration.recommendedCNAME);
    const hostLabel = validation.normalizedDomain.slice(
      0,
      -(validation.apexDomain.length + 1),
    );
    for (const value of cnameValues) {
      records.push({
        type: "CNAME",
        name: hostLabel || validation.normalizedDomain,
        value,
        ttl: "Auto",
        role: "required",
      });
    }
  }

  return {
    configuration,
    records,
  };
};

export const buildVercelVerificationRecords = (
  domain: VercelProjectDomain,
) => {
  return (domain.verification || [])
    .filter((entry) => entry.type && entry.domain && entry.value)
    .map((entry) => ({
      type: entry.type as "TXT",
      name: entry.domain || "",
      value: entry.value || "",
      ttl: "Auto",
      role: "required" as const,
    }));
};

export const getVercelProjectDomainStatusMessage = getChallengeMessage;
