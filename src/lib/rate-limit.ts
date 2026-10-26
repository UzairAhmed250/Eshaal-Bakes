interface RateLimitBucket {
  timestamps: number[];
}

const buckets = new Map<string, RateLimitBucket>();

export interface RateLimitConfig {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Sliding-window rate limiter used on login, order creation, custom quote request,
 * reference photo upload, and order tracking lookup.
 */
export function checkRateLimit(
  config: RateLimitConfig,
  nowMs: number = Date.now()
): RateLimitResult {
  const cutoff = nowMs - config.windowMs;
  const existing = buckets.get(config.key) ?? { timestamps: [] };
  const activeTimestamps = existing.timestamps.filter((t) => t > cutoff);

  if (activeTimestamps.length >= config.limit) {
    const oldest = activeTimestamps[0] ?? nowMs;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + config.windowMs - nowMs) / 1000)
    );
    buckets.set(config.key, { timestamps: activeTimestamps });
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  activeTimestamps.push(nowMs);
  buckets.set(config.key, { timestamps: activeTimestamps });

  return {
    allowed: true,
    remaining: Math.max(0, config.limit - activeTimestamps.length),
    retryAfterSeconds: 0,
  };
}

export function resetRateLimitsForTests(): void {
  buckets.clear();
}

export function getClientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? "127.0.0.1";
}
