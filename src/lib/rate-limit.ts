import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_KV_REST_API_TOKEN;

const ratelimit =
  url && token
    ? new Ratelimit({
        redis: new Redis({ url, token }),
        limiter: Ratelimit.tokenBucket(10, "1 s", 100),
        prefix: "showcase:ratelimit",
        timeout: 1000,
      })
    : null;

export async function rateLimit(key: string) {
  if (!ratelimit) return { ok: true, retryAfterSec: 0 };
  try {
    const { success, reset } = await ratelimit.limit(key);
    return { ok: success, retryAfterSec: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
  } catch {
    // Redis down: fail open, an outage shouldn't take the site with it.
    return { ok: true, retryAfterSec: 0 };
  }
}
