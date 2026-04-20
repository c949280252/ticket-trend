import express from 'express'
import cors from 'cors'
import { sql } from '@vercel/postgres'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/debug', async (req, res) => {
  const result = await sql\SELECT * FROM lottery_history ORDER BY id DESC LIMIT 3\
  res.json(result.rows)
})

async function getFromDB(limit = 30) {
  const result = await sql\
    SELECT issue, code, draw_time as date
    FROM lottery_history
    ORDER BY issue DESC
    LIMIT \
  \
  return result.rows.map(r => ({
    issue: r.issue,
    balls: r.code.split(','),
    date: r.date
  }))
}

app.get('/api/lottery', async (req, res) => {
  const data = await getFromDB(1)
  console.log('data:', data)
  if (data.length === 0) return res.json([])

  res.json([{
    id: '3d',
    name: '福彩3D',
    type: '3d',
    latestIssue: data[0].issue,
    date: data[0].date,
    balls: data[0].balls
  }])
})

app.get('/api/lottery/:id', async (req, res) => {
  const data = await getFromDB(1)
  if (data.length === 0) return res.status(404).json({ error: 'Not found' })

  res.json({
    id: '3d',
    name: '福彩3D',
    type: '3d',
    latest: data[0],
    prize: [
      { name: '单选', amount: '1,040元' },
      { name: '组三', amount: '346元' },
      { name: '组六', amount: '173元' }
    ]
  })
})

app.get('/api/lottery/:id/history', async (req, res) => {
  const data = await getFromDB(30)
  res.json(data)
})

export default (req, res) => app(req, res)