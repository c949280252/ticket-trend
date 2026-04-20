import express from 'express'
import cors from 'cors'
import { sql } from '@vercel/postgres'

const app = express()
app.use(cors())
app.use(express.json())

// ========== 配置 ==========
const API_INTERVAL = 5000 // 5秒内不重复请求外部API

// ========== 数据库操作 ==========

// 获取上次请求外部API的时间（用于5秒防重复）
async function getLastFetchTime() {
  try {
    const result = await sql`SELECT value FROM lottery_meta WHERE key = 'last_fetch'`
    return result.rows[0]?.value ? parseInt(result.rows[0].value) : 0
  } catch {
    return 0
  }
}

// 设置上次请求外部API的时间
async function setLastFetchTime(time) {
  try {
    await sql`INSERT INTO lottery_meta (key, value) VALUES ('last_fetch', ${time.toString()})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`
  } catch {}
}

// 后台静默更新（不等待返回）
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

// 初始化meta表
sql`CREATE TABLE IF NOT EXISTS lottery_meta (key VARCHAR(50) PRIMARY KEY, value VARCHAR(100))`.catch(() => {})

// ========== 查询数据库 ==========
async function getFromDB(limit = 30) {
  const result = await sql`SELECT issue, code, draw_time FROM lottery_history ORDER BY issue DESC LIMIT ${limit}`
  return result.rows.map(r => ({ issue: r.issue, balls: r.code.split(','), date: r.draw_time }))
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
  await setLastFetchTime(Date.now()) // 请求前设置时间
  const r = await fetch('https://api.api68.com/QuanGuoCai/getLotteryInfoList.do?lotCode=10041')
  const json = await r.json()
  const data = json.result?.data || []
  for (const item of data) {
    await sql`INSERT INTO lottery_history (lottery_type, issue, code, draw_time)
      VALUES ('3d', ${item.preDrawIssue}, ${item.preDrawCode}, ${item.preDrawTime})
      ON CONFLICT (lottery_type, issue) DO UPDATE SET code = EXCLUDED.code, draw_time = EXCLUDED.draw_time`
  }
  res.json({ ok: true, updated: data.length })
})

// 首页/最新开奖
// 逻辑：
// 1. 立即返回数据库数据（用户秒开）
// 2. 检查数据是否超过1分钟
// 3. 超过1分钟 → 检查5秒防重复 → 触发后台更新
app.get('/api/lottery', async (req, res) => {
  let data = await getFromDB(1)
  if (data.length === 0) return res.json([])

  // 返回数据
  const latestDate = new Date(data[0].date)
  const diff = new Date() - latestDate
  const needUpdate = diff >= 60000
  const lastFetch = await getLastFetchTime()
  const canFetch = Date.now() - lastFetch >= API_INTERVAL
  
  res.json([{ 
    id: '3d', name: '福彩3D', type: '3d', 
    latestIssue: data[0].issue, date: data[0].date, balls: data[0].balls,
    _debug: { diff, needUpdate, lastFetch, canFetch }
  }])

  if (needUpdate && canFetch) {
    await setLastFetchTime(Date.now())
    backgroundUpdate()
  }
})

// 详情页
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

// 历史记录
app.get('/api/lottery/:id/history', async (req, res) => {
  res.json(await getFromDB(30))
})

export default (req, res) => app(req, res)