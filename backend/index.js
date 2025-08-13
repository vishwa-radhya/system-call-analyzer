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
    if (err) {
      console.error('Error reading log file:', err)
      return res.status(500).send('Error reading log file')
    }

    const lines = data.trim().split('\n')

    const recentLogs = lines.slice(-300).map(line => {
      // Example line:
      // [2025-08-13 22:14:55] [ProcessStart] notepad.exe (PID: 1234)
      // [2025-08-13 22:15:02] [FileIO] notepad.exe -> D:\test\file.txt

      const timeMatch = line.match(/^\[(.*?)\]/) // timestamp
      const typeMatch = line.match(/\[(ProcessStart|ProcessStop|FileIO)\]/) // event type
      const details = line.split('] ').slice(2).join(' ')

      if (timeMatch && typeMatch) {
        return {
          timestamp: timeMatch[1],
          event: typeMatch[1],
          details
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
