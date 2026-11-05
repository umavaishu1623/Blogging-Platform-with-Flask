import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const limiters = new Map<string, Ratelimit>();

export async function checkRateLimit(
  scope: string,
  key: string,
  limit: number,
  windowSeconds: number,
) {
  if (!redis) return process.env.NODE_ENV !== "production";

  const cacheKey = `${scope}:${limit}:${windowSeconds}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: `ink-signal:${scope}`,
    });
    limiters.set(cacheKey, limiter);
  }

  const hashedKey = createHash("sha256").update(key).digest("hex");
  const result = await limiter.limit(hashedKey);
  return result.success;
}