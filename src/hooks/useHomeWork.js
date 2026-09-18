import { useState } from 'react'

const KEY = 'nebulax:homeWork'

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// One-time signup seed: home + work/school station, 2 taps, nothing else
// asked afterward. Stored locally so it only ever needs to run once per
// device for this demo (no account system).
export function useHomeWork() {
  const [homeWork, setHomeWork] = useState(read)

  function save(next) {
    setHomeWork(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      // Non-critical — worst case the signup screen reappears next visit.
    }
  }

  return { homeWork, save }
}
