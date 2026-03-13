const EMAIL_REDACTED = "[EMAIL_REDACTED]";
const ID_REDACTED = "[ID_REDACTED]";

export const redactEmail = (email: string | undefined | null): string => {
  if (!email) return EMAIL_REDACTED;
  
  const parts = email.split("@");
  if (parts.length !== 2) return EMAIL_REDACTED;
  
  const localPart = parts[0];
  const domain = parts[1];
  
  if (localPart.length <= 2) {
    return `${"*".repeat(localPart.length)}@${domain}`;
  }
  
  return `${localPart[0]}${"*".repeat(localPart.length - 2)}${localPart[localPart.length - 1]}@${domain}`;
};

export const redactUserId = (userId: string | undefined | null): string => {
  if (!userId) return ID_REDACTED;
  if (userId.length <= 8) return ID_REDACTED;
  return `${userId.slice(0, 4)}...${userId.slice(-4)}`;
};

export const redactPII = {
  email: redactEmail,
  userId: redactUserId,
};

export default redactPII;
