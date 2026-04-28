import crypto from "crypto";

const HASH_PREFIX = "sha256:";

const getTokenHashSecret = () => {
  const secret =
    process.env.TOKEN_HASH_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("Missing token hash secret");
  }

  return secret;
};

const timingSafeStringEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
};

export const hashToken = (token: string) =>
  `${HASH_PREFIX}${crypto
    .createHmac("sha256", getTokenHashSecret())
    .update(token)
    .digest("hex")}`;

export const tokenMatches = (storedToken: string | null | undefined, rawToken: string) => {
  if (!storedToken || !rawToken) return false;

  const hashedToken = hashToken(rawToken);
  if (timingSafeStringEqual(storedToken, hashedToken)) return true;

  // Temporary compatibility for outstanding links created before token hashing.
  if (!storedToken.startsWith(HASH_PREFIX)) {
    return timingSafeStringEqual(storedToken, rawToken);
  }

  return false;
};
