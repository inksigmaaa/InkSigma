import "dotenv/config";

import { getRedisClient } from "../config/redis.ts";

const hasRedisConfig =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

const run = async () => {
  if (process.env.REDIS_DISABLED === "true") {
    process.stdout.write("Redis smoke skipped: REDIS_DISABLED=true.\n");
    return;
  }

  if (!hasRedisConfig) {
    process.stdout.write(
      "Redis smoke skipped: set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to run it.\n",
    );
    return;
  }

  const client = getRedisClient();

  if (!client) {
    throw new Error("Redis client could not be initialized");
  }

  const key = `smoke:redis:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  const expected = `ok:${Date.now()}`;

  await client.setex(key, 30, expected);

  const actual = (await client.get(key)) as string | null;

  if (actual !== expected) {
    throw new Error(`Redis smoke failed: expected ${expected}, received ${String(actual)}`);
  }

  await client.del(key);
  process.stdout.write("Redis smoke verification passed.\n");
};

run().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
