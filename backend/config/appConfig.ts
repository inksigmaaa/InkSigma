const isProd = process.env.NODE_ENV === "production";

export const config = {
  backend: {
    url:
      process.env.BACKEND_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      (isProd ? "https://api.inksigma.xyz" : `http://localhost:${process.env.PORT || 5000}`),
    port: process.env.PORT || 5000,
  },
  frontend: {
    url: process.env.FRONTEND_URL || (isProd ? "https://inksigma.xyz" : "http://localhost:3000"),
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
    fromName: process.env.SMTP_FROM_NAME,
  },
};
