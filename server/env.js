import 'dotenv/config'

export const env = {
  port: Number(process.env.PORT) || 3001,
  ltaAccountKey: process.env.LTA_ACCOUNT_KEY || '',
  oneMapEmail: process.env.ONEMAP_EMAIL || '',
  oneMapPassword: process.env.ONEMAP_PASSWORD || '',
  maptilerKey: process.env.MAPTILER_KEY || '',
  stadiaKey: process.env.STADIA_API_KEY || '',
}

export const hasLta = () => Boolean(env.ltaAccountKey)
export const hasOneMap = () => Boolean(env.oneMapEmail && env.oneMapPassword)
