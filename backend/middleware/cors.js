import cors from "cors";
import { parseHost } from "../utils/hostParser.js";

const allowList = new Set(
  (
    process.env.ALLOWED_ORIGINS ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowList.has(origin)) return true;

  try {
    const url = new URL(origin);
    const { baseDomain } = parseHost(url.hostname);
    if (!baseDomain) return false;
    return true;
  } catch (error) {
    return false;
  }
};

// CORS configuration
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
});
