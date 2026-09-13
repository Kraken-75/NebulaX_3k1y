function AnnouncementsPage({ announcements }) {
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

      <div className="announcement-list">
        {announcements.map((item) => (
          <article className="announcement-card" key={item.id}>
            <div className="announcement-topline">
              <span className="tag">{item.tag}</span>
              <span className="time">{item.time}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default AnnouncementsPage
