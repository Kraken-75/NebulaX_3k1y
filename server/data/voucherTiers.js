// Redeemable tiers for the Rewards page progress bar. Kept separate from the
// per-route incentive award amount (server/state/incentiveStore.js) so the
// dynamic tiered-incentive-value work (deferred, see docs/AUDIT_V2.md) can
// change how many points a route earns without touching what points buy.
export const VOUCHER_TIERS = [
  { id: 'small', threshold: 100, brand: 'Kopitiam', label: '$1 voucher' },
  { id: 'medium', threshold: 250, brand: 'FairPrice', label: '$3 voucher' },
  { id: 'large', threshold: 500, brand: 'Polar Puffs & Cakes', label: '$5 voucher' },
]
