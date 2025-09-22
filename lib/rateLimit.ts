interface Counter {
  count: number;
  resetAt: number;
}

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 30);

const counters = new Map<string, Counter>();

export function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const counter = counters.get(key);
  if (!counter || counter.resetAt < now) {
    counters.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (counter.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  counter.count += 1;
  counters.set(key, counter);
  return { allowed: true, remaining: maxRequests - counter.count };
}
