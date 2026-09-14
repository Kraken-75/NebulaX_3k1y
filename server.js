import express from 'express'
import cors from 'cors'
import { exec } from 'child_process'

const app = express()
const port = 3001

app.use(cors())

app.get('/api/train-status', (req, res) => {
  exec('node train-alerts.cjs', (error, stdout, stderr) => {
    if (error) {
      console.error(error)
      return res.status(500).json({ error: 'Failed to fetch train data.' })
    }

    try {
      const data = JSON.parse(stdout)
      const alerts = Array.isArray(data?.value?.Message)
        ? data.value.Message.map((message, index) => ({
            id: `${message.CreatedDate || 'alert'}-${index}`,
            content: message.Content || 'Train service alert',
            timestamp: message.CreatedDate || null,
          }))
        : []

      return res.status(200).json({ alerts, source: 'TrainServiceAlerts' })
    } catch (e) {
      return res.status(500).json({ error: 'Invalid data returned from train-alerts.cjs' })
    }
  })
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})