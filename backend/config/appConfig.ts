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
  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM,
    fromEmail: process.env.RESEND_FROM_EMAIL,
    fromName: process.env.RESEND_FROM_NAME,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};
