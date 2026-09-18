import { useEffect, useState } from 'react'
import { getIncentives, redeemVoucher } from '../lib/api'

// Redesigned around a single clear progress bar toward the next voucher —
// "how far am I from a reward" is the one thing this page needs to answer
// at a glance, per the simplified-UI feedback.
function RewardsPage() {
  const [state, setState] = useState({ loading: true, error: '', data: null })
  const [redeemingId, setRedeemingId] = useState(null)
  const [message, setMessage] = useState('')

  function load() {
    getIncentives()
      .then((data) => setState({ loading: false, error: '', data }))
      .catch(() => setState({ loading: false, error: 'Rewards balance is unavailable right now.', data: null }))
  }

  useEffect(load, [])

  async function handleRedeem(tier) {
    setRedeemingId(tier.id)
    setMessage('')
    try {
      const result = await redeemVoucher(tier.id)
      setMessage(`Redeemed ${tier.brand} ${tier.label}.`)
      setState((prev) => ({ ...prev, data: { ...prev.data, pointsBalance: result.pointsBalance } }))
      load()
    } catch {
      setMessage('Could not redeem that just now — try again shortly.')
    } finally {
      setRedeemingId(null)
    }
  }

  const { data } = state
  const balance = data?.pointsBalance ?? 0
  const tiers = data?.tiers || []
  const nextTier = tiers.find((tier) => balance < tier.threshold)
  const progressPercent = nextTier ? Math.min(100, Math.round((balance / nextTier.threshold) * 100)) : 100

  return (
    <section className="page">
      <div className="section-heading">
        <div>
          <p className="label">Load-spreading rewards</p>
          <h2>Your points</h2>
        </div>
      </div>

      {state.loading && <p className="loading-line">Loading your balance…</p>}
      {state.error && <p className="error-line">{state.error}</p>}

      {data && (
        <>
          <div className="points-card">
            <p className="card-label">Balance</p>
            <p className="points-total">{balance} pts</p>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="progress-caption">
              {nextTier
                ? `${Math.max(0, nextTier.threshold - balance)} pts to ${nextTier.brand} ${nextTier.label}`
                : 'All vouchers unlocked!'}
            </p>
          </div>

          <div className="voucher-list">
            {tiers.map((tier) => {
              const unlocked = balance >= tier.threshold
              return (
                <article key={tier.id} className={`voucher-card${unlocked ? ' voucher-unlocked' : ''}`}>
                  <div>
                    <p className="card-label">{tier.brand}</p>
                    <h3>{tier.label}</h3>
                    <p className="voucher-threshold">{tier.threshold} pts</p>
                  </div>
                  <button
                    type="button"
                    className="voucher-redeem-button"
                    disabled={!unlocked || redeemingId === tier.id}
                    onClick={() => handleRedeem(tier)}
                  >
                    {redeemingId === tier.id ? 'Redeeming…' : unlocked ? 'Redeem' : 'Locked'}
                  </button>
                </article>
              )
            })}
          </div>

          {message && <p className="confirmation-line">{message}</p>}

          <p className="mock-disclaimer">
            Demo concept only — no real vouchers are issued. A production version would need a
            real partner (e.g. HPB Healthy365 or an SG retail rewards aggregator).
          </p>
        </>
      )}
    </section>
  )
}

export default RewardsPage
