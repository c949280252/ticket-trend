import express from 'express'
import cors from 'cors'
import { sql } from '@vercel/postgres'

const app = express()
app.use(cors())
app.use(express.json())

const API_INTERVAL = 5000 // 5秒

async function getLastFetchTime() {
  try {
    const result = await sql`SELECT value FROM lottery_meta WHERE key = 'last_fetch'`
    return result.rows[0]?.value ? parseInt(result.rows[0].value) : 0
  } catch {
    return 0
  }
}

async function setLastFetchTime(time) {
  try {
    await sql`INSERT INTO lottery_meta (key, value) VALUES ('last_fetch', ${time.toString()})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`
  } catch {}
}

function backgroundUpdate() {
  fetch('https://api.api68.com/QuanGuoCai/getLotteryInfoList.do?lotCode=10041')
    .then(r => r.json())
    .then(json => {
      const data = json.result?.data || []
      for (const item of data) {
        sql`INSERT INTO lottery_history (lottery_type, issue, code, draw_time)
          VALUES ('3d', ${item.preDrawIssue}, ${item.preDrawCode}, ${item.preDrawTime})
          ON CONFLICT (lottery_type, issue) DO UPDATE SET code = EXCLUDED.code, draw_time = EXCLUDED.draw_time`
      }
    }).catch(() => {})
}

sql`CREATE TABLE IF NOT EXISTS lottery_meta (key VARCHAR(50) PRIMARY KEY, value VARCHAR(100))`.catch(() => {})

app.get('/api/debug', async (req, res) => {
  const result = await sql`SELECT * FROM lottery_history ORDER BY id DESC LIMIT 3`
  res.json(result.rows)
})

app.get('/api/update', async (req, res) => {
  await setLastFetchTime(0)
  res.json({ ok: true })
})

async function getFromDB(limit = 30) {
  const result = await sql`SELECT issue, code, draw_time FROM lottery_history ORDER BY issue DESC LIMIT ${limit}`
  return result.rows.map(r => ({ issue: r.issue, balls: r.code.split(','), date: r.draw_time }))
}

app.get('/api/lottery', async (req, res) => {
  let data = await getFromDB(1)
  if (data.length === 0) return res.json([])

  res.json([{ id: '3d', name: '福彩3D', type: '3d', latestIssue: data[0].issue, date: data[0].date, balls: data[0].balls }])

  const latestDate = new Date(data[0].date)
  if (new Date() - latestDate >= 60000) {
    const lastFetch = await getLastFetchTime()
    if (Date.now() - lastFetch >= API_INTERVAL) {
      await setLastFetchTime(Date.now())
      backgroundUpdate()
    }
  }
})

app.get('/api/lottery/:id', async (req, res) => {
  let data = await getFromDB(1)
  if (data.length === 0) return res.status(404).json({ error: 'Not found' })

  res.json({ id: '3d', name: '福彩3D', type: '3d', latest: data[0], prize: [{ name: '单选', amount: '1,040元' }, { name: '组三', amount: '346元' }, { name: '组六', amount: '173元' }] })

  const latestDate = new Date(data[0].date)
  if (new Date() - latestDate >= 60000) {
    const lastFetch = await getLastFetchTime()
    if (Date.now() - lastFetch >= API_INTERVAL) {
      await setLastFetchTime(Date.now())
      backgroundUpdate()
    }
  }
})

app.get('/api/lottery/:id/history', async (req, res) => {
  res.json(await getFromDB(30))
})

export default (req, res) => app(req, res)