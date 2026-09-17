// Last-resort handler: something in a route threw after its own try/catch
// already attempted a graceful fallback. Never leak stack traces to the client.
export function errorHandler(err, req, res, _next) {
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err.message)
  res.status(500).json({ error: 'Something went wrong. Please try again.' })
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` })
}
