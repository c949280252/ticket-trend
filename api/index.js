import express from 'express'
import cors from 'cors'
import { sql } from '@vercel/postgres'

const app = express()
app.use(cors())
app.use(express.json())

// 彩票数据 API 配置
const LOTTERY_APIS = {
  '3d': 'https://api.api68.com/QuanGuoCai/getLotteryInfoList.do?lotCode=10041'
}

// 初始化数据库表
async function initDB() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS lottery_history (
      id SERIAL PRIMARY KEY,
      lottery_type VARCHAR(20) NOT NULL,
      issue VARCHAR(20) NOT NULL,
      code VARCHAR(50) NOT NULL,
      draw_time TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(lottery_type, issue)
    )`
    console.log('Database initialized')
  } catch (e) {
    console.error('Init DB error:', e)
  }
}

// 保存开奖数据到数据库
async function saveLotteryHistory(lotCode, data) {
  for (const item of data) {
    try {
      await sql`INSERT INTO lottery_history (lottery_type, issue, code, draw_time)
        VALUES (${lotCode}, ${item.preDrawIssue}, ${item.preDrawCode}, ${item.preDrawTime})
        ON CONFLICT (lottery_type, issue) DO UPDATE SET
        code = EXCLUDED.code, draw_time = EXCLUDED.draw_time`
    } catch (e) {
      // 忽略重复插入错误
    }
  }
}

// 获取外部 API 数据
async function fetchLotteryData(lotCode) {
  const url = LOTTERY_APIS[lotCode]
  if (!url) return null

  try {
    const res = await fetch(url)
    const result = await res.json()
    const data = result.result?.data || []

    // 保存到数据库
    if (data.length > 0) {
      await saveLotteryHistory(lotCode, data)
    }

    return data
  } catch (e) {
    console.error('Fetch error:', e)
    return []
  }
}

// 从数据库获取历史
async function getHistoryFromDB(lotCode, limit = 30) {
  try {
    const result = await sql`
      SELECT issue, code, draw_time as date
      FROM lottery_history
      WHERE lottery_type = ${lotCode}
      ORDER BY draw_time DESC
      LIMIT ${limit}
    `
    return result.rows.map(row => ({
      issue: row.issue,
      date: row.date,
      balls: row.code.split(',')
    }))
  } catch (e) {
    console.error('Get history error:', e)
    return []
  }
}

// 初始化
initDB()

// 获取所有彩票最新开奖
app.get('/api/lottery', async (req, res) => {
  try {
    const data = await fetchLotteryData('3d')
    if (!data.length) {
      return res.json([])
    }

    const latest = data[0]
    const list = [{
      id: '3d',
      name: '福彩3D',
      type: '3d',
      latestIssue: latest.preDrawIssue,
      date: latest.preDrawTime,
      balls: latest.preDrawCode.split(',')
    }]

    res.json(list)
  } catch (e) {
    console.error(e)
    res.json([])
  }
})

// 获取单个彩票详情
app.get('/api/lottery/:id', async (req, res) => {
  const { id } = req.params
  const data = await fetchLotteryData(id)

  if (!data.length) {
    return res.status(404).json({ error: 'Not found' })
  }

  const latest = data[0]
  res.json({
    id,
    name: '福彩3D',
    type: id,
    latest: {
      issue: latest.preDrawIssue,
      date: latest.preDrawTime,
      balls: latest.preDrawCode.split(',')
    }
  })
})

// 获取单个彩票历史（优先从数据库）
app.get('/api/lottery/:id/history', async (req, res) => {
  const { id } = req.params

  // 优先从数据库获取
  const history = await getHistoryFromDB(id)
  if (history.length > 0) {
    return res.json(history)
  }

  // 数据库没有则从 API 获取
  const data = await fetchLotteryData(id)
  if (!data.length) {
    return res.status(404).json({ error: 'Not found' })
  }

  const historyData = data.slice(0, 30).map(item => ({
    issue: item.preDrawIssue,
    date: item.preDrawTime,
    balls: item.preDrawCode.split(',')
  }))

  res.json(historyData)
})

// Vercel Serverless Handler
export default (req, res) => {
  app(req, res)
}