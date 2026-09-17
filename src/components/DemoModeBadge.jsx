// Never let mock/demo data pass as live — this badge is the honesty label
// the brief requires whenever a response isn't backed by real feeds.
function DemoModeBadge({ triggered }) {
  return (
    <span className="demo-badge" title="This screen is showing labeled demo data, not a live feed">
      {triggered ? 'DEMO DISRUPTION ACTIVE' : 'DEMO MODE'}
    </span>
  )
}

export default DemoModeBadge
