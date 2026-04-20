import express from 'express'
import cors from 'cors'
import { sql } from '@vercel/postgres'

const app = express()
app.use(cors())
app.use(express.json())

// ========== 配置 ==========
const API_INTERVAL = 5000 // 5秒内不重复请求外部API

// 跟踪pending请求，避免重复请求
const pendingFetch = new Map() // { lotteryType: timestamp }

// 彩种配置
const LOTTERY_CONFIG = {
  '3d': { name: '福彩3D', apiUrl: 'https://api.api68.com/QuanGuoCai/getLotteryInfoList.do?lotCode=10041', codeLen: 3, prize: [{ name: '单选', amount: '1,040元' }, { name: '组三', amount: '346元' }, { name: '组六', amount: '173元' }] },
  'ssq': { name: '双色球', apiUrl: 'https://api.api68.com/QuanGuoCai/getHistoryLotteryInfo.do?lotCode=10039', codeLen: 7, prize: [{ name: '一等奖', amount: '最高1,000万' }, { name: '二等奖', amount: '最高500万' }, { name: '六等奖', amount: '5元' }] },
  'dlt': { name: '超级大乐透', apiUrl: 'https://api.api68.com/QuanGuoCai/getHistoryLotteryInfo.do?lotCode=10040', codeLen: 7, prize: [{ name: '一等奖', amount: '最高1,800万' }, { name: '二等奖', amount: '最高500万' }, { name: '九等奖', amount: '3元' }] },
  'qlc': { name: '七乐彩', apiUrl: 'https://api.api68.com/QuanGuoCai/getHistoryLotteryInfo.do?lotCode=10042', codeLen: 7, prize: [{ name: '一等奖', amount: '最高500万' }, { name: '二等奖', amount: '最高10万' }, { name: '七等奖', amount: '5元' }] },
  'plw': { name: '排列五', apiUrl: 'https://api.api68.com/QuanGuoCai/getHistoryLotteryInfo.do?lotCode=10044', codeLen: 5, derive: 'pl3', prize: [{ name: '一等奖', amount: '100,000元' }] },
  'pl3': { name: '排列三', apiUrl: null, codeLen: 3, from: 'plw', prize: [{ name: '直选', amount: '1,040元' }, { name: '组三', amount: '346元' }, { name: '组六', amount: '173元' }] },
  'qxc': { name: '七星彩', apiUrl: 'https://api.api68.com/QuanGuoCai/getHistoryLotteryInfo.do?lotCode=10045', codeLen: 7, prize: [{ name: '一等奖', amount: '最高1,000万' }, { name: '二等奖', amount: '最高20万' }, { name: '九等奖', amount: '5元' }] }
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

// 批量获取所有彩种的上次请求时间（一次查询）
async function getAllLastFetchTimes() {
  try {
    const result = await sql`SELECT key, value FROM lottery_meta WHERE key LIKE 'last_fetch_%'`
    const map = {}
    for (const row of result.rows) {
      map[row.key] = row.value ? parseInt(row.value) : 0
    }
    return map
  } catch {
    return {}
  }
}

// 设置指定彩种上次请求外部API的时间（不阻塞）
function setLastFetchTime(lotteryType, time) {
  const key = `last_fetch_${lotteryType}`
  sql`INSERT INTO lottery_meta (key, value) VALUES (${key}, ${time.toString()})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`.catch(() => {})
}

// 后台静默更新（不等待返回）
function backgroundUpdate(lotteryType) {
  const config = LOTTERY_CONFIG[lotteryType]
  if (!config) return

  // 检查是否已经有pending的请求超过5秒还没返回
  const pendingTime = pendingFetch.get(lotteryType)
  if (pendingTime && Date.now() - pendingTime < API_INTERVAL) {
    return // 5秒内的请求还没返回，跳过
  }
  pendingFetch.set(lotteryType, Date.now())

  // 派生彩种（如排列三）从排列五取数据
  if (config.from) {
    sql`INSERT INTO lottery_history (lottery_type, issue, code, draw_time)
      SELECT ${lotteryType}, issue, LEFT(code, ${config.codeLen}), draw_time FROM lottery_history WHERE lottery_type = ${config.from}
      ON CONFLICT (lottery_type, issue) DO UPDATE SET code = EXCLUDED.code`.catch(() => {})
    pendingFetch.delete(lotteryType)
    return
  }

  fetch(config.apiUrl)
    .then(r => r.json())
    .then(json => {
      const data = json.result?.data || []
      for (const item of data) {
        sql`INSERT INTO lottery_history (lottery_type, issue, code, draw_time)
          VALUES (${lotteryType}, ${item.preDrawIssue}, ${item.preDrawCode}, ${item.preDrawTime})
          ON CONFLICT (lottery_type, issue) DO UPDATE SET code = EXCLUDED.code, draw_time = EXCLUDED.draw_time`
      }
      // 如果有派生彩种，也一并更新
      if (config.derive) {
        const deriveConfig = LOTTERY_CONFIG[config.derive]
        if (deriveConfig) {
          sql`INSERT INTO lottery_history (lottery_type, issue, code, draw_time)
            SELECT ${config.derive}, issue, LEFT(code, ${deriveConfig.codeLen}), draw_time FROM lottery_history WHERE lottery_type = ${lotteryType}
            ON CONFLICT (lottery_type, issue) DO UPDATE SET code = EXCLUDED.code`.catch(() => {})
        }
      }
    }).catch(() => {})
    .finally(() => {
      pendingFetch.delete(lotteryType)
    })
}

// 初始化meta表
sql`CREATE TABLE IF NOT EXISTS lottery_meta (key VARCHAR(50) PRIMARY KEY, value VARCHAR(100))`.catch(() => {})

// ========== 查询数据库 ==========
async function getFromDB(lotteryType, limit = 30) {
  const config = LOTTERY_CONFIG[lotteryType]
  const codeLen = config?.codeLen || 10
  const result = await sql`SELECT issue, code, draw_time, created_at FROM lottery_history WHERE lottery_type = ${lotteryType} ORDER BY issue DESC LIMIT ${limit}`
  return result.rows.map(r => ({ issue: r.issue, balls: formatBalls(r.code, codeLen), date: r.draw_time, created_at: r.created_at }))
}

// 批量获取所有彩种最新数据（一次查询）
async function getAllLatestData() {
  const result = await sql`
    SELECT t.* FROM (
      SELECT DISTINCT ON (lottery_type) lottery_type, issue, code, draw_time, created_at 
      FROM lottery_history 
      ORDER BY lottery_type, issue DESC
    ) t
  `
  const map = {}
  for (const r of result.rows) {
    const config = LOTTERY_CONFIG[r.lottery_type]
    const codeLen = config?.codeLen || 10
    map[r.lottery_type] = { issue: r.issue, balls: formatBalls(r.code, codeLen), date: r.draw_time, created_at: r.created_at }
  }
  return map
}

// 格式化球号（根据位数分组）
function formatBalls(code, codeLen) {
  if (!code) return []
  // 先尝试逗号分隔
  if (code.includes(',')) {
    return code.split(',').map(s => s.trim()).filter(s => s)
  }
  // 再尝试空格分隔
  if (code.includes(' ')) {
    return code.split(' ').map(s => s.trim()).filter(s => s)
  }
  // 最后按固定长度截取
  const result = []
  for (let i = 0; i < code.length && i < codeLen; i++) {
    if (code[i] >= '0' && code[i] <= '9') result.push(code[i])
  }
  return result
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
  const lotteryType = req.query.type || '3d'
  await doUpdate(lotteryType)
  res.json({ ok: true })
})

// 自动更新所有彩种（定时任务用）
app.get('/api/cron', async (req, res) => {
  for (const lotteryType of Object.keys(LOTTERY_CONFIG)) {
    const config = LOTTERY_CONFIG[lotteryType]
    if (!config || !config.apiUrl) continue
    await doUpdate(lotteryType)
  }
  res.json({ ok: true })
})

// 更新逻辑
async function doUpdate(lotteryType) {
  const config = LOTTERY_CONFIG[lotteryType]
  if (!config || !config.apiUrl) return
  
  await setLastFetchTime(lotteryType, Date.now())
  const r = await fetch(config.apiUrl)
  const json = await r.json()
  const data = json.result?.data || []
  
  for (const item of data) {
    await sql`INSERT INTO lottery_history (lottery_type, issue, code, draw_time)
      VALUES (${lotteryType}, ${item.preDrawIssue}, ${item.preDrawCode}, ${item.preDrawTime})
      ON CONFLICT (lottery_type, issue) DO UPDATE SET code = EXCLUDED.code, draw_time = EXCLUDED.draw_time`
  }
  
  // 派生彩种
  if (config.derive) {
    const deriveConfig = LOTTERY_CONFIG[config.derive]
    if (deriveConfig) {
      for (const item of data) {
        const code3 = item.preDrawCode.replace(/,/g, '').slice(0, 3)
        await sql`INSERT INTO lottery_history (lottery_type, issue, code, draw_time)
          VALUES (${config.derive}, ${item.preDrawIssue}, ${code3}, ${item.preDrawTime})
          ON CONFLICT (lottery_type, issue) DO UPDATE SET code = EXCLUDED.code`
      }
    }
  }
}

// 首页/最新开奖 - 只返回数据，不触发更新
app.get('/api/lottery', async (req, res) => {
  const allData = await getAllLatestData()
  
  const result = []
  for (const lotteryType of Object.keys(LOTTERY_CONFIG)) {
    const config = LOTTERY_CONFIG[lotteryType]
    if (!config) continue
    
    const data = allData[lotteryType]
    result.push({ 
      id: lotteryType, name: config.name, type: lotteryType, 
      latestIssue: data?.issue || null, date: data?.date || null, balls: data?.balls || []
    })
  }
  
  res.json(result)
})

// 详情页 - 只返回数据，不触发更新
app.get('/api/lottery/:id', async (req, res) => {
  const lotteryType = req.params.id
  const config = LOTTERY_CONFIG[lotteryType]
  if (!config) return res.status(404).json({ error: 'Not found' })
  
  const data = await getFromDB(lotteryType, 1)
  if (data.length === 0) return res.status(404).json({ error: 'No data, refresh later' })

  res.json({ 
    id: lotteryType, name: config.name, type: lotteryType, 
    latest: data[0], 
    prize: config.prize || []
  })
})

// 历史记录 - 只返回数据，不触发更新
app.get('/api/lottery/:id/history', async (req, res) => {
  const lotteryType = req.params.id
  if (!LOTTERY_CONFIG[lotteryType]) return res.status(404).json({ error: 'Not found' })
  
  const data = await getFromDB(lotteryType, 30)
  res.json(data)
})

export default (req, res) => app(req, res)