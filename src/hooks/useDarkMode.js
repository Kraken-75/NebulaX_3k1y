import { useEffect, useState } from 'react'

const KEY = 'nebulax:darkMode'

function readStored() {
  try {
    return localStorage.getItem(KEY) === 'true'
  } catch {
    return false
  }
}

// Applies the theme as a data-theme attribute on <html> so every CSS
// variable defined in index.css switches at once, wherever the toggle
// lives in the component tree (Settings page).
export function useDarkMode() {
  const [isDark, setIsDark] = useState(readStored)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    try {
      localStorage.setItem(KEY, String(isDark))
    } catch {
      // Non-critical — the toggle just won't persist across visits.
    }
  }, [isDark])

  return [isDark, setIsDark]
}
