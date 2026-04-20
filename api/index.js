import express from 'express'
import cors from 'cors'
import { sql } from '@vercel/postgres'

const app = express()
app.use(cors())
app.use(express.json())

async function getFromDB(lotCode, limit = 30) {
  const result = await sql`
    SELECT issue, code, draw_time as date
    FROM lottery_history
    WHERE lottery_type = ${lotCode}
    ORDER BY draw_time DESC
    LIMIT ${limit}
  `
  return result.rows.map(r => ({
    issue: r.issue,
    balls: r.code.split(','),
    date: r.date
  }))
}

app.get('/api/lottery', async (req, res) => {
  const data = await getFromDB('3d', 1)
  console.log('Data:', data)

  if (data.length === 0) return res.json([])

  res.json([{
    id: '3d',
    name: '福cai 3D',
    type: '3d',
    latestIssue: data[0].issue,
    date: data[0].date,
    balls: data[0].balls
  }])
})

app.get('/api/lottery/:id', async (req, res) => {
  const data = await getFromDB('3d', 1)
  if (data.length === 0) return res.status(404).json({ error: 'Not found' })

  res.json({
    id: '3d',
    name: '福cai 3D',
    type: '3d',
    latest: data[0]
  })
})

app.get('/api/lottery/:id/history', async (req, res) => {
  const data = await getFromDB('3d', 30)
  res.json(data)
})

export default (req, res) => app(req, res)