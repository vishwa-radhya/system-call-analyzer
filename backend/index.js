// test code
import express from 'express'
import fs from 'fs'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'


const app = express()
const PORT = 3001

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use(cors())

const logPath = path.resolve(__dirname, '../logs/SysWatchProcessLogs.log')

app.get('/api/logs', (req, res) => {
  fs.readFile(logPath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading log file')

    const lines = data.trim().split('\n')
    const recentLogs = lines.slice(-100).map(line => {
      const match = line.match(/\[\+\] Process Started: (\w+) \(PID: (\d+)\)/)
  if (match) {
    return {
      event: 'ProcessStart',
      timestamp: new Date().toISOString(), 
      name: match[1],
      pid: parseInt(match[2])
    }
  }
  return null
    }).filter(Boolean)
    res.json(recentLogs)
  })
})

app.listen(PORT, () => {
  console.log(`Log API running at http://localhost:${PORT}`)
})
