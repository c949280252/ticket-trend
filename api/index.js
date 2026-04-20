import express from 'express'
import cors from 'cors'
import { sql } from '@vercel/postgres'

const app = express()
app.use(cors())
app.use(express.json())

let lastFetch = 0
const API_INTERVAL = 5000 // 5秒

// 自动更新
async function autoUpdate() {
  const now = Date.now()
  if (now - lastFetch < API_INTERVAL) return false
  lastFetch = now

  try {
    const res = await fetch('https://api.api68.com/QuanGuoCai/getLotteryInfoList.do?lotCode=10041')
    const json = await res.json()
    const data = json.result?.data || []
    for (const item of data) {
      await sql`INSERT INTO lottery_history (lottery_type, issue, code, draw_time)
        VALUES ('3d', ${item.preDrawIssue}, ${item.preDrawCode}, ${item.preDrawTime})
        ON CONFLICT (lottery_type, issue) DO UPDATE SET code = EXCLUDED.code, draw_time = EXCLUDED.draw_time`
    }
    console.log('Updated', data.length)
    return true
  } catch (e) {
    console.log('Error:', e.message)
    return false
  }
}

app.get('/api/debug', async (req, res) => {
  const result = await sql`SELECT * FROM lottery_history ORDER BY id DESC LIMIT 3`
  res.json(result.rows)
})

app.get('/api/update', async (req, res) => {
  lastFetch = 0
  await autoUpdate()
  res.json({ ok: true })
})

async function getFromDB(limit = 30) {
  const result = await sql`
    SELECT issue, code, draw_time as date
    FROM lottery_history
    ORDER BY issue DESC
    LIMIT ${limit}
  `
  return result.rows.map(r => ({
    issue: r.issue,
    balls: r.code.split(','),
    date: r.date
  }))
}

app.get('/api/lottery', async (req, res) => {
  let data = await getFromDB(1)

  // 检查1分钟内有新数据不请求API
  if (data.length > 0) {
    const latestDate = new Date(data[0].date)
    const now = new Date()
    if (now - latestDate < 60000) {
      return res.json([{
        id: '3d',
        name: '福彩3D',
        type: '3d',
        latestIssue: data[0].issue,
        date: data[0].date,
        balls: data[0].balls
      }])
    }
  }

  // 检查5秒内是否请求过API
  if (Date.now() - lastFetch >= API_INTERVAL) {
    await autoUpdate()
    data = await getFromDB(1)
  }

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
  let data = await getFromDB(1)

  if (data.length > 0) {
    const latestDate = new Date(data[0].date)
    const now = new Date()
    if (now - latestDate < 60000) {
      return res.json({
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
    }
  }

  if (Date.now() - lastFetch >= API_INTERVAL) {
    await autoUpdate()
    data = await getFromDB(1)
  }

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