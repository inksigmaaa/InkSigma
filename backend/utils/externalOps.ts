type TimeoutOptions = {
  timeoutMs: number;
  operationName: string;
};

export const getEnvNumber = (
  value: string | undefined,
  fallback: number,
  min = 1,
) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < min) return min;
  return parsed;
};

export const withTimeout = async <T>(
  operation: () => Promise<T>,
  options: TimeoutOptions,
): Promise<T> => {
  const { timeoutMs, operationName } = options;

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    operation()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

export const createConcurrencyLimiter = (maxConcurrent: number) => {
  let active = 0;
  const queue: Array<() => void> = [];

  const drain = () => {
    if (active >= maxConcurrent) return;
    const next = queue.shift();
    if (!next) return;
    active += 1;
    next();
  };

  return async <T>(task: () => Promise<T>): Promise<T> => {
    if (active < maxConcurrent) {
      active += 1;
      try {
        return await task();
      } finally {
        active -= 1;
        drain();
      }
    }

    return new Promise<T>((resolve, reject) => {
      queue.push(() => {
        task()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            active -= 1;
            drain();
          });
      });
    });
  };
};
