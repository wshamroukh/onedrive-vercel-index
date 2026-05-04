import Redis from 'ioredis'
import siteConfig from '../../config/site.config'

// Persistent key-value store is provided by Redis, hosted on Upstash
// https://vercel.com/integrations/upstash
if (!process.env.REDIS_URL) {
  console.error('[odAuthTokenStore] REDIS_URL environment variable is not set.')
}
const kv = new Redis(process.env.REDIS_URL || '')

kv.on('error', err => {
  console.error('[odAuthTokenStore] Redis connection error:', err.message)
})

export async function getOdAuthTokens(): Promise<{ accessToken: unknown; refreshToken: unknown }> {
  try {
    const accessToken = await kv.get(`${siteConfig.kvPrefix}access_token`)
    const refreshToken = await kv.get(`${siteConfig.kvPrefix}refresh_token`)

    console.log('[odAuthTokenStore] accessToken present:', !!accessToken, '| refreshToken present:', !!refreshToken)

    return {
      accessToken,
      refreshToken,
    }
  } catch (err: any) {
    console.error('[odAuthTokenStore] Failed to read tokens from Redis:', err.message)
    throw err
  }
}

export async function storeOdAuthTokens({
  accessToken,
  accessTokenExpiry,
  refreshToken,
}: {
  accessToken: string
  accessTokenExpiry: number
  refreshToken: string
}): Promise<void> {
  await kv.set(`${siteConfig.kvPrefix}access_token`, accessToken, 'EX', accessTokenExpiry)
  await kv.set(`${siteConfig.kvPrefix}refresh_token`, refreshToken)
}
