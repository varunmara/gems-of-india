import "dotenv/config"

import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "./schema"

// Global connection pool for serverless environments
// This prevents creating new connections on every request
const globalForDb = globalThis as unknown as {
  pool: Pool | undefined
}

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 3, // Keep low for free tier limits
    idleTimeoutMillis: 10000, // Close idle connections quickly (10s)
    connectionTimeoutMillis: 5000, // Fail fast if can't connect
  })

// In development, preserve the pool across hot reloads
if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool
}

export const db = drizzle(pool, {
  schema,
})
