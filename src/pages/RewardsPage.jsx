import { useEffect, useState } from 'react'
import { getIncentives } from '../lib/api'

function RewardsPage() {
  const [state, setState] = useState({ loading: true, error: '', data: null })

  useEffect(() => {
    let isMounted = true

    getIncentives()
      .then((data) => isMounted && setState({ loading: false, error: '', data }))
      .catch(() =>
        isMounted &&
        setState({ loading: false, error: 'Rewards balance is unavailable right now.', data: null }),
      )

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="page">
      <div className="section-heading">
        <div>
          <p className="label">Load-spreading rewards</p>
          <h2>Your points</h2>
        </div>
      </div>

      <p className="mock-disclaimer">
        Demo concept only — no real vouchers are issued. A production version would need a real
        partner (e.g. HPB Healthy365 or an SG retail rewards aggregator).
      </p>

      {state.loading && <p className="loading-line">Loading your balance…</p>}
      {state.error && <p className="error-line">{state.error}</p>}

      {state.data && (
        <>
          <div className="points-card">
            <p className="card-label">Balance</p>
            <p className="points-total">{state.data.pointsBalance} pts</p>
          </div>

          <div className="announcement-list">
            {state.data.history.map((entry) => (
              <article className="announcement-card reward-card" key={entry.id}>
                <div className="announcement-topline">
                  <span className="tag tag-reward">{entry.brand}</span>
                  <span className="time">+{entry.points} pts</span>
                </div>
                <p>{entry.note}</p>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default RewardsPage
