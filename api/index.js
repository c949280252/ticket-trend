import express from 'express'
import cors from 'cors'
import { sql } from '@vercel/postgres'

const app = express()
app.use(cors())
app.use(express.json())

// ========== 配置 ==========
// 定时任务每分钟更新，不需要5秒防重复

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
  const history = await sql`SELECT lottery_type, issue, code, draw_time FROM lottery_history ORDER BY lottery_type, issue DESC LIMIT 20`
  res.json({ history: history.rows })
})

// 手动触发更新（增量）
app.get('/api/update', async (req, res) => {
  const lotteryType = req.query.type || '3d'
  await doUpdate(lotteryType)
  res.json({ ok: true })
})

// 定时任务更新所有彩种（间隔执行）
app.get('/api/cron', async (req, res) => {
  const results = []
  
  for (const lotteryType of Object.keys(LOTTERY_CONFIG)) {
    const config = LOTTERY_CONFIG[lotteryType]
    if (!config || !config.apiUrl) continue
    
    // 每个间隔500ms，避免被限流
    await new Promise(r => setTimeout(r, 500))
    const result = await doUpdate(lotteryType)
    results.push(result)
  }
  
  res.json({ ok: true, results })
})

// 更新单个彩种
async function doUpdate(lotteryType) {
  const config = LOTTERY_CONFIG[lotteryType]
  if (!config || !config.apiUrl) return { error: 'No config or apiUrl' }
  
  try {
    const r = await fetch(config.apiUrl)
    const json = await r.json()
    const data = json.result?.data || []
    
    if (data.length === 0) {
      return { error: 'No data returned', lotteryType }
    }
    
    let inserted = 0
    for (const item of data) {
      await sql`INSERT INTO lottery_history (lottery_type, issue, code, draw_time)
        VALUES (${lotteryType}, ${item.preDrawIssue}, ${item.preDrawCode}, ${item.preDrawTime})
        ON CONFLICT (lottery_type, issue) DO UPDATE SET code = EXCLUDED.code, draw_time = EXCLUDED.draw_time`
      inserted++
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
    
    return { lotteryType, inserted }
  } catch (e) {
    return { error: e.message, lotteryType }
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