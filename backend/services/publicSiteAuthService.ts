import crypto from "node:crypto";
import { getEnvNumber } from "../utils/externalOps.js";

type PublicSiteAuthUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  username?: string | null;
};

type PublicSiteAuthPayload = {
  sub: string;
  email: string | null;
  name: string | null;
  image: string | null;
  username: string | null;
  iat: number;
  exp: number;
  iss: "inksigma-public-site";
};

const PUBLIC_SITE_AUTH_ISSUER = "inksigma-public-site";
const PUBLIC_SITE_AUTH_TOKEN_TTL_SECONDS = getEnvNumber(
  process.env.PUBLIC_SITE_AUTH_TOKEN_TTL_SECONDS,
  60 * 30,
  60,
);

const encodeBase64Url = (value: string) =>
  Buffer.from(value, "utf8").toString("base64url");

const decodeBase64Url = (value: string) =>
  Buffer.from(value, "base64url").toString("utf8");

const getPublicSiteAuthSecret = () =>
  String(
    process.env.PUBLIC_SITE_AUTH_SECRET || process.env.BETTER_AUTH_SECRET || "",
  ).trim();

const signPayload = (encodedPayload: string, secret: string) =>
  crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");

export const createPublicSiteAuthToken = (
  user: PublicSiteAuthUser | null | undefined,
) => {
  const secret = getPublicSiteAuthSecret();
  if (!secret || !user?.id) {
    return null;
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: PublicSiteAuthPayload = {
    sub: user.id,
    email: user.email || null,
    name: user.name || null,
    image: user.image || null,
    username: user.username || null,
    iat: issuedAt,
    exp: issuedAt + PUBLIC_SITE_AUTH_TOKEN_TTL_SECONDS,
    iss: PUBLIC_SITE_AUTH_ISSUER,
  };

  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
};

export const verifyPublicSiteAuthToken = (
  token: string | null | undefined,
): PublicSiteAuthPayload | null => {
  const secret = getPublicSiteAuthSecret();
  if (!secret || !token) {
    return null;
  }

  const [encodedPayload, signature] = String(token).trim().split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload, secret);
  const actualBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      decodeBase64Url(encodedPayload),
    ) as PublicSiteAuthPayload;
    const now = Math.floor(Date.now() / 1000);

    if (
      payload.iss !== PUBLIC_SITE_AUTH_ISSUER ||
      !payload.sub ||
      !Number.isFinite(payload.exp) ||
      payload.exp <= now
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};

const readHeader = (headers: Headers | Record<string, unknown>, key: string) => {
  const normalizedKey = key.toLowerCase();

  if (headers instanceof Headers) {
    return headers.get(normalizedKey) || headers.get(key) || "";
  }

  const rawValue =
    headers[normalizedKey] ||
    headers[key] ||
    headers[key.toUpperCase()] ||
    "";

  if (Array.isArray(rawValue)) {
    return String(rawValue[0] || "");
  }

  return String(rawValue || "");
};

export const readPublicSiteAuthTokenFromHeaders = (
  headers: Headers | Record<string, unknown>,
) => {
  const authorization = readHeader(headers, "authorization").trim();
  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return readHeader(headers, "x-public-site-auth").trim();
};

export const getPublicSiteAuthTokenExpiry = () =>
  PUBLIC_SITE_AUTH_TOKEN_TTL_SECONDS;
