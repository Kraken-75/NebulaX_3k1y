// A secondary disruption signal alongside the official alert, styled like a
// public transport Telegram channel. Entirely synthetic demo data (see
// server/data/mockTelegramFeed.js) — shown as an ordinary community-updates
// list, not called out loudly, but never pretended to be a real API call.
function CommunityUpdatesFeed({ updates }) {
  if (!updates || updates.length === 0) return null

  return (
    <details className="community-updates">
      <summary>Community updates ({updates.length})</summary>
      <div className="community-updates-list">
        {updates.map((update) => (
          <p key={update.id} className="community-update-line">
            <span className="community-update-time">
              {update.minutesAgo === 0 ? 'now' : `${update.minutesAgo}m ago`}
            </span>
            {update.text}
          </p>
        ))}
      </div>
    </details>
  )
}

export default CommunityUpdatesFeed
