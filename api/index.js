import express from 'express'
import cors from 'cors'
import { sql } from '@vercel/postgres'

const app = express()
app.use(cors())
app.use(express.json())

// ========== 配置 ==========
const API_INTERVAL = 5000 // 5秒内不重复请求外部API

// 彩种配置
const LOTTERY_CONFIG = {
  '3d': { name: '福彩3D', apiUrl: 'https://api.api68.com/QuanGuoCai/getLotteryInfoList.do?lotCode=10041' }
}

// ========== 数据库操作 ==========

// 获取指定彩种上次请求外部API的时间（用于5秒防重复）
async function getLastFetchTime(lotteryType) {
  const key = `last_fetch_${lotteryType}`
  try {
    const result = await sql`SELECT value FROM lottery_meta WHERE key = ${key}`
    return result.rows[0]?.value ? parseInt(result.rows[0].value) : 0
  } catch {
    return 0
  }
}

// 设置指定彩种上次请求外部API的时间
async function setLastFetchTime(lotteryType, time) {
  const key = `last_fetch_${lotteryType}`
  try {
    await sql`INSERT INTO lottery_meta (key, value) VALUES (${key}, ${time.toString()})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`
  } catch {}
}

// 后台静默更新（不等待返回）
function backgroundUpdate(lotteryType) {
  const config = LOTTERY_CONFIG[lotteryType]
  if (!config) return

  fetch(config.apiUrl)
    .then(r => r.json())
    .then(json => {
      const data = json.result?.data || []
      for (const item of data) {
        sql`INSERT INTO lottery_history (lottery_type, issue, code, draw_time)
          VALUES (${lotteryType}, ${item.preDrawIssue}, ${item.preDrawCode}, ${item.preDrawTime})
          ON CONFLICT (lottery_type, issue) DO UPDATE SET code = EXCLUDED.code, draw_time = EXCLUDED.draw_time`
      }
    }).catch(() => {})
}

// 初始化meta表
sql`CREATE TABLE IF NOT EXISTS lottery_meta (key VARCHAR(50) PRIMARY KEY, value VARCHAR(100))`.catch(() => {})

// ========== 查询数据库 ==========
async function getFromDB(lotteryType, limit = 30) {
  const result = await sql`SELECT issue, code, draw_time, created_at FROM lottery_history WHERE lottery_type = ${lotteryType} ORDER BY issue DESC LIMIT ${limit}`
  return result.rows.map(r => ({ issue: r.issue, balls: r.code.split(','), date: r.draw_time, created_at: r.created_at }))
}

// ========== API 接口 ==========

// 调试：查看数据库状态
app.get('/api/debug', async (req, res) => {
  const history = await sql`SELECT * FROM lottery_history ORDER BY id DESC LIMIT 3`
  const meta = await sql`SELECT * FROM lottery_meta`
  res.json({ history: history.rows, meta: meta.rows })
})

// 手动触发更新
app.get('/api/update', async (req, res) => {
  const lotteryType = '3d'
  await setLastFetchTime(lotteryType, Date.now())
  const r = await fetch(LOTTERY_CONFIG[lotteryType].apiUrl)
  const json = await r.json()
  const data = json.result?.data || []
  for (const item of data) {
    await sql`INSERT INTO lottery_history (lottery_type, issue, code, draw_time)
      VALUES (${lotteryType}, ${item.preDrawIssue}, ${item.preDrawCode}, ${item.preDrawTime})
      ON CONFLICT (lottery_type, issue) DO UPDATE SET code = EXCLUDED.code, draw_time = EXCLUDED.draw_time`
  }
  res.json({ ok: true, updated: data.length })
})

// 首页/最新开奖
// 逻辑：
// 1. 立即返回数据库数据（用户秒开）
// 2. 每个彩种独立5秒防重复
app.get('/api/lottery', async (req, res) => {
  const lotteryType = '3d'
  let data = await getFromDB(lotteryType, 1)
  if (data.length === 0) return res.json([])

  const lastFetch = await getLastFetchTime(lotteryType)
  const canFetch = lastFetch === 0 || (Date.now() - lastFetch) >= API_INTERVAL
  
  const config = LOTTERY_CONFIG[lotteryType]
  res.json([{ 
    id: lotteryType, name: config.name, type: lotteryType, 
    latestIssue: data[0].issue, date: data[0].date, balls: data[0].balls
  }])

  if (canFetch) {
    await setLastFetchTime(lotteryType, Date.now())
    backgroundUpdate(lotteryType)
  }
})

// 详情页
app.get('/api/lottery/:id', async (req, res) => {
  const lotteryType = req.params.id
  let data = await getFromDB(lotteryType, 1)
  if (data.length === 0) return res.status(404).json({ error: 'Not found' })

  const lastFetch = await getLastFetchTime(lotteryType)
  const canFetch = lastFetch === 0 || (Date.now() - lastFetch) >= API_INTERVAL

  const config = LOTTERY_CONFIG[lotteryType]
  res.json({ 
    id: lotteryType, name: config?.name || lotteryType, type: lotteryType, 
    latest: data[0], 
    prize: [{ name: '单选', amount: '1,040元' }, { name: '组三', amount: '346元' }, { name: '组六', amount: '173元' }]
  })

  if (canFetch) {
    await setLastFetchTime(lotteryType, Date.now())
    backgroundUpdate(lotteryType)
  }
})

// 历史记录
app.get('/api/lottery/:id/history', async (req, res) => {
  const lotteryType = req.params.id
  res.json(await getFromDB(lotteryType, 30))
})

export default (req, res) => app(req, res)