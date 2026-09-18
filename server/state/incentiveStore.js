// Mocked voucher/points ledger for the hackathon demo — no real payment or
// redemption integration. In-memory by design; a production version would
// need a real partner (e.g. HPB Healthy365 or an SG retail rewards
// aggregator) and a persistent, auditable ledger, not this.
import { VOUCHER_TIERS } from '../data/voucherTiers.js'

const PARTNER_BRANDS = ['Polar Puffs & Cakes', 'FairPrice', 'Kopitiam', 'Koufu']

let pointsBalance = 50
const history = [
  { id: 'seed-1', brand: 'FairPrice', points: 50, note: 'Welcome bonus', earnedAt: null },
]

export function getIncentiveState() {
  return { pointsBalance, history, tiers: VOUCHER_TIERS }
}

export function awardIncentive({ routeId, points = 30 }) {
  const brand = PARTNER_BRANDS[Math.floor(Math.random() * PARTNER_BRANDS.length)]
  pointsBalance += points
  const entry = {
    id: `award-${Date.now()}`,
    brand,
    points,
    note: `Chose the less-crowded route (${routeId})`,
    earnedAt: new Date().toISOString(),
  }
  history.unshift(entry)
  return { pointsBalance, entry }
}

export function redeemVoucher(tierId) {
  const tier = VOUCHER_TIERS.find((candidate) => candidate.id === tierId)
  if (!tier) {
    throw new Error(`Unknown voucher tier "${tierId}"`)
  }
  if (pointsBalance < tier.threshold) {
    throw new Error('Not enough points yet for this voucher')
  }
  pointsBalance -= tier.threshold
  const entry = {
    id: `redeem-${Date.now()}`,
    brand: tier.brand,
    points: -tier.threshold,
    note: `Redeemed ${tier.label}`,
    earnedAt: new Date().toISOString(),
  }
  history.unshift(entry)
  return { pointsBalance, entry }
}
