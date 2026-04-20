import express from 'express'
import cors from 'cors'
import { sql } from '@vercel/postgres'

const app = express()
app.use(cors())
app.use(express.json())

// 防重复请求
let fetching = false
let lastFetchTime = 0
const FETCH_INTERVAL = 300000 // 5分钟内跳过

// 初始化数据库
async function initDB() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS lottery_cache (
      id SERIAL PRIMARY KEY,
      lottery_type VARCHAR(20) NOT NULL,
      issue VARCHAR(20) NOT NULL,
      code VARCHAR(50) NOT NULL,
      draw_time TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(lottery_type, issue)
    )`
  } catch (e) {
    console.log('Init error:', e.message)
  }
}

// 从数据库读取
async function getFromDB(lotCode, limit = 30) {
  try {
    const result = await sql`
      SELECT issue, code, draw_time as date
      FROM lottery_cache
      WHERE lottery_type = ${lotCode}
      ORDER BY draw_time DESC
      LIMIT ${limit}
    `
    return result.rows.map(r => ({
      issue: r.issue,
      balls: r.code.split(','),
      date: r.date
    }))
  } catch (e) {
    return []
  }
}

// 写入数据库
async function saveToDB(lotCode, data) {
  for (const item of data.slice(0, 50)) {
    try {
      await sql`INSERT INTO lottery_cache (lottery_type, issue, code, draw_time)
        VALUES (${lotCode}, ${item.preDrawIssue}, ${item.preDrawCode}, ${item.preDrawTime})
        ON CONFLICT (lottery_type, issue) DO UPDATE SET code = EXCLUDED.code, draw_time = EXCLUDED.draw_time`
    } catch (e) {}
  }
}

// 更新数据 - 每次都尝试，但5分钟内只请求一次
async function fetchAndSave(lotCode) {
  const now = Date.now()
  if (fetching || (now - lastFetchTime) < FETCH_INTERVAL) {
    return false // 跳过
  }

  fetching = true
  lastFetchTime = now

  try {
    const res = await fetch('https://api.api68.com/QuanGuoCai/getLotteryInfoList.do?lotCode=10041')
    const json = await res.json()
    if (json.result?.data) {
      await saveToDB(lotCode, json.result.data)
      return true // 更新成功
    }
  } catch (e) {
    console.log('Fetch error:', e.message)
  } finally {
    fetching = false
  }
  return false
}

// 首页 - 先更新再返回数据，确保及时
app.get('/api/lottery', async (req, res) => {
  // 先尝试更新（5分钟内跳過）
  await fetchAndSave('3d')

  // 返回最新数据
  const data = await getFromDB('3d', 1)
  if (data.length === 0) return res.json([])

  res.json([{
    id: '3d',
    name: '福cai3D',
    type: '3d',
    latestIssue: data[0].issue,
    date: data[0].date,
    balls: data[0].balls
  }])
})

// 详情
app.get('/api/lottery/:id', async (req, res) => {
  const data = await getFromDB('3d', 1)
  if (data.length === 0) return res.status(404).json({ error: 'Not found' })

  res.json({
    id: '3d',
    name: '福cai3D',
    type: '3d',
    latest: data[0]
  })
})

// 历史
app.get('/api/lottery/:id/history', async (req, res) => {
  const data = await getFromDB('3d', 30)
  res.json(data)
})

initDB()

export default (req, res) => app(req, res)