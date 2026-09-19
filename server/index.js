import express from 'express'
import cors from 'cors'
import { env } from './env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import journeyRouter from './routes/journey.js'
import disruptionsRouter from './routes/disruptions.js'
import crowdingRouter from './routes/crowding.js'
import weatherRouter from './routes/weather.js'
import incentivesRouter from './routes/incentives.js'
import demoRouter from './routes/demo.js'
import stationsRouter from './routes/stations.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use('/api/journey', journeyRouter)
app.use('/api/disruptions', disruptionsRouter)
app.use('/api/crowding', crowdingRouter)
app.use('/api/weather', weatherRouter)
app.use('/api/incentives', incentivesRouter)
app.use('/api/demo', demoRouter)
app.use('/api/stations', stationsRouter)

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(env.port, '0.0.0.0', () => {
  console.log(`NebulaX API listening on port ${env.port}`)
})
