// Single module for the dynamic incentive scaling described in the brief:
// how strong a reward to offer scales with (a) how crowded the top-ranked
// route ("Plan A") currently is, and (b) how much worse the alternative
// ("Plan B/C") is in time. Deliberately coarse tiers, not cent-level math —
// easy to demo and explain to judges, per the brief's own guidance.
//
// Behavior this is meant to produce:
// - Plan A very crowded + alternative barely costs anything extra -> large
//   (an easy, valuable swap).
// - Plan A only mildly crowded + alternative costs a lot -> small/none
//   (not worth asking someone to sacrifice much for little benefit).
export const TIER_POINTS = { small: 15, medium: 30, large: 60 }

export function calculateIncentiveTier({ topCrowdScore, alternativeCrowdScore, timeDeltaMinutes }) {
  const crowdingRelief = Math.max(0, topCrowdScore - alternativeCrowdScore)
  const extraMinutes = Math.max(0, timeDeltaMinutes)

  let tier = crowdingRelief >= 0.9 ? 'large' : crowdingRelief >= 0.6 ? 'medium' : 'small'

  // A big time cost undercuts an otherwise-strong incentive — not worth
  // asking someone to sacrifice a lot of time for a modest improvement.
  if (extraMinutes > 12 && tier === 'large') tier = 'medium'
  if (extraMinutes > 12 && tier === 'medium') tier = 'small'

  return { tier, points: TIER_POINTS[tier] }
}
