// Styled on the real SGMRT Telegram channel's public-update format, as a
// secondary disruption signal alongside LTA's own TrainServiceAlerts feed.
// This is 100% synthetic — generated here, never scraped or polled from
// Telegram/X — per the brief's explicit instruction not to attempt a real
// live scrape. Internally labeled `source: 'mock-telegram'` on every entry
// so nothing here is ever confused with a real API response in the code,
// even though it's presented in the UI as an ordinary community update.
export const MOCK_TELEGRAM_FEED = [
  {
    id: 'tg-1',
    source: 'mock-telegram',
    minutesAgo: 2,
    text: '🚨 [NEL] Train fault at Sengkang. Delays of up to 45 mins expected between Sengkang and Dhoby Ghaut.',
  },
  {
    id: 'tg-2',
    source: 'mock-telegram',
    minutesAgo: 1,
    text: 'ℹ️ [NEL] Free bridging buses now running every 5–8 mins, Sengkang ↔ Dhoby Ghaut, all stations.',
  },
  {
    id: 'tg-3',
    source: 'mock-telegram',
    minutesAgo: 0,
    text: '📍 Bridging bus queues forming at Sengkang bus bay B. Boon Keng and Farrer Park boarding points less busy.',
  },
]
