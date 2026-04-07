import pino from "pino";
import { AsyncLocalStorage } from "node:async_hooks";

const isDev = process.env.NODE_ENV !== "production";

type RequestLogContext = {
  requestId: string;
  method?: string;
  route?: string;
  userId?: string;
  publicationId?: number | string;
};

const requestContextStorage = new AsyncLocalStorage<RequestLogContext>();

export const runWithRequestContext = (
  context: RequestLogContext,
  callback: () => void,
) => requestContextStorage.run(context, callback);

export const setRequestContext = (partialContext: Partial<RequestLogContext>) => {
  const store = requestContextStorage.getStore();
  if (!store) return;

  Object.assign(store, partialContext);
};

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  mixin() {
    const context = requestContextStorage.getStore();
    if (!context) return {};
    return {
      requestId: context.requestId,
      method: context.method,
      route: context.route,
      userId: context.userId,
      publicationId: context.publicationId,
    };
  },
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  base: isDev
    ? undefined
    : {
        env: process.env.NODE_ENV,
      },
});

export default logger;
