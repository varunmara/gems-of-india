import Redis from "ioredis"

// create redis client only if URL is provided
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null

export async function checkRateLimit(
  identifier: string,
  limit: number,
  window: number,
): Promise<{
  success: boolean
  remaining: number
  reset: number
}> {
  if (!redis) {
    // If no Redis, allow the request to pass (fallback for development/build)
    return {
      success: true,
      remaining: limit - 1,
      reset: Math.ceil(window / 1000),
    }
  }

  const key = `rate-limit:${identifier}`
  const now = Date.now()
  const windowStart = now - window

  try {
    // clean up old requests
    await redis.zremrangebyscore(key, 0, windowStart)

    // get the number of requests in the current window
    const requestCount = await redis.zcard(key)

    if (requestCount >= limit) {
      // get the oldest request with its score
      const oldestRequest = await redis.zrange(key, 0, 0, "WITHSCORES")
      const reset = oldestRequest.length ? parseInt(oldestRequest[1]) + window : now + window

      return {
        success: false,
        remaining: 0,
        reset: Math.ceil((reset - now) / 1000), // Time remaining in seconds
      }
    }

    // add the new request
    await redis.zadd(key, now, now.toString())

    // set the expiration of the key
    await redis.expire(key, Math.ceil(window / 1000))

    return {
      success: true,
      remaining: limit - requestCount - 1,
      reset: Math.ceil(window / 1000),
    }
  } catch (error) {
    console.error("Redis error:", error)
    // if redis error, let the request pass
    return {
      success: true,
      remaining: 1,
      reset: 0,
    }
  }
}
