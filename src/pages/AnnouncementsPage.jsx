import { useEffect, useState } from 'react'

function AnnouncementsPage() {
  const [trainUpdates, setTrainUpdates] = useState([])
  const [trainLoading, setTrainLoading] = useState(true)
  const [trainError, setTrainError] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchTrainUpdates = async () => {
      try {
        const response = await fetch('/train-alerts.json')

        if (!response.ok) {
          throw new Error('Unable to fetch train updates right now.')
        }

        const result = await response.json()
        const updates = Array.isArray(result?.alerts) ? result.alerts : []

        if (isMounted) {
          setTrainUpdates(updates)
          setTrainError('')
        }
      } catch (error) {
        if (isMounted) {
          setTrainUpdates([])
          setTrainError(
            error.message || 'Train updates are currently unavailable. Please try again later.',
          )
        }
      } finally {
        if (isMounted) {
          setTrainLoading(false)
        }
      }
    }

    fetchTrainUpdates()

    const intervalId = window.setInterval(fetchTrainUpdates, 60000)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [])

  return (
    <section className="page">
      <div className="section-heading">
        <div>
          <p className="label">SMRT updates</p>
          <h2>Recent announcements</h2>
        </div>
        <button className="primary-button" type="button">
          Refresh feed
        </button>
      </div>

      <div className="announcement-list" style={{ marginBottom: '24px' }}>
        {trainLoading ? (
          <p>Loading train announcements...</p>
        ) : trainError ? (
          <p>{trainError}</p>
        ) : trainUpdates.length > 0 ? (
          trainUpdates.slice(0, 4).map((item, index) => (
            <article className="announcement-card" key={item.id || `train-${index}`}>
              <div className="announcement-topline">
                <span className="tag">Live</span>
                <span className="time">
                  {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Updated from LTA DataMall'}
                </span>
              </div>
              <h3>Train service update</h3>
              <p>{item.content || 'No details available.'}</p>
            </article>
          ))
        ) : null}
      </div>

    </section>
  )
}

export default AnnouncementsPage
