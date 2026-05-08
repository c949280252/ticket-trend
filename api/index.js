import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import { sql } from '@vercel/postgres'

const app = express()
app.use(cors())
app.use(express.json())

// ========== 配置 ==========

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

// 清理数据：每个彩种保留最多2000条
async function cleanupOldData() {
  for (const lotteryType of Object.keys(LOTTERY_CONFIG)) {
    const count = await sql`SELECT COUNT(*) as cnt FROM lottery_history WHERE lottery_type = ${lotteryType}`
    if (parseInt(count.rows[0].cnt) > 2000) {
      await sql`DELETE FROM lottery_history WHERE lottery_type = ${lotteryType} AND id NOT IN (
        SELECT id FROM lottery_history WHERE lottery_type = ${lotteryType} ORDER BY issue DESC LIMIT 2000
      )`
    }
  }
}

// ========== 查询数据库 ==========
async function getFromDB(lotteryType, limit = 30, offset = 0) {
  const config = LOTTERY_CONFIG[lotteryType]
  const codeLen = config?.codeLen || 10
  const result = await sql`SELECT issue, code, draw_time, created_at FROM lottery_history WHERE lottery_type = ${lotteryType} ORDER BY issue DESC LIMIT ${limit} OFFSET ${offset}`
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
  // 最后按固定长度截取，并补齐2位
  const result = []
  for (let i = 0; i < code.length && i < codeLen; i++) {
    if (code[i] >= '0' && code[i] <= '9') {
      // 两位数处理
      let num = ''
      if (i + 1 < code.length && code[i+1] >= '0' && code[i+1] <= '9') {
        num = code[i] + code[i+1]
        i++
      } else {
        num = code[i]
      }
      result.push(num)
    }
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

// 定时任务默认只更新这3个主要彩种，其他手动
const CRON_LOTTERIES = ['3d', 'ssq', 'plw']

// 定时任务更新
app.get('/api/cron', async (req, res) => {
  // 每次更新时清理旧数据
  await cleanupOldData()
  
  const results = []
  
  for (const lotteryType of CRON_LOTTERIES) {
    const config = LOTTERY_CONFIG[lotteryType]
    if (!config || !config.apiUrl) continue
    
    // 每个间隔300ms，避免被限流
    await new Promise(r => setTimeout(r, 300))
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
      // 使用 draw_time（开奖时间），created_at 用当前时间并指定时区
      await sql`INSERT INTO lottery_history (lottery_type, issue, code, draw_time, created_at)
        VALUES (${lotteryType}, ${item.preDrawIssue}, ${item.preDrawCode}, ${item.preDrawTime}, NOW() + INTERVAL '8 hours')
        ON CONFLICT (lottery_type, issue) DO UPDATE SET code = EXCLUDED.code, draw_time = EXCLUDED.draw_time`
      inserted++
    }
    
    // 派生彩种
    if (config.derive) {
      const deriveConfig = LOTTERY_CONFIG[config.derive]
      if (deriveConfig) {
        for (const item of data) {
          const code3 = item.preDrawCode.replace(/,/g, '').slice(0, 3)
          await sql`INSERT INTO lottery_history (lottery_type, issue, code, draw_time, created_at)
            VALUES (${config.derive}, ${item.preDrawIssue}, ${code3}, ${item.preDrawTime}, NOW() + INTERVAL '8 hours')
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
  const { limit = 30, offset = 0 } = req.query
  if (!LOTTERY_CONFIG[lotteryType]) return res.status(404).json({ error: 'Not found' })
  
  const data = await getFromDB(lotteryType, parseInt(limit) || 30, parseInt(offset) || 0)
  res.json(data)
})

// ========== 后台管理 ==========

// 创建 admin_settings 表（如果不存在）
async function initAdminSettings() {
  await sql`CREATE TABLE IF NOT EXISTS admin_settings (
    key VARCHAR(50) PRIMARY KEY,
    value VARCHAR(255)
  )`
  // 检查是否已有密码，没有则创建默认密码的哈希
  const existing = await sql`SELECT value FROM admin_settings WHERE key = 'password'`
  if (existing.rows.length === 0) {
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync('ticket123', salt, 100000, 64, 'sha512').toString('hex')
    await sql`INSERT INTO admin_settings (key, value) VALUES ('password', ${salt + ':' + hash})`
  }
  // 创建公告表
  await sql`CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    content VARCHAR(500) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
  )`
}

// 读取密码哈希
async function getAdminHash() {
  const result = await sql`SELECT value FROM admin_settings WHERE key = 'password'`
  return result.rows[0]?.value || null
}

// 验证密码
async function verifyPassword(inputPassword) {
  const stored = await getAdminHash()
  if (!stored) return false
  const [salt, hash] = stored.split(':')
  const inputHash = crypto.pbkdf2Sync(inputPassword, salt, 100000, 64, 'sha512').toString('hex')
  return hash === inputHash
}

// 生成简单token（用密码原文，包含时间戳）
function makeToken(password, time) {
  return Buffer.from(`${password}:${time}`).toString('base64')
}

// 登录
app.post('/api/admin/login', async (req, res) => {
  const { password } = req.body
  const valid = await verifyPassword(password)
  if (!valid) {
    return res.status(401).json({ error: '密码错误' })
  }
  const token = makeToken(password, Date.now())
  res.json({ ok: true, token })
})

// 后台中间件（验证token中的密码）
async function requireAuth(req, res, next) {
  const token = req.headers.authorization
  if (!token) {
    return res.status(401).json({ error: '未授权' })
  }
  try {
    const decoded = Buffer.from(token, 'base64').toString()
    const [password, time] = decoded.split(':')
    // 检查时间戳有效性
    if (Date.now() - parseInt(time) >= 86400000) {
      return res.status(401).json({ error: '登录已过期' })
    }
    // 验证密码
    const valid = await verifyPassword(password)
    if (!valid) {
      return res.status(401).json({ error: '未授权' })
    }
    next()
  } catch {
    return res.status(401).json({ error: '未授权' })
  }
}

// 后台列表
app.get('/api/admin/lottery', requireAuth, async (req, res) => {
  const { type, issue, limit = 20, offset = 0 } = req.query
  const limitNum = parseInt(limit) || 20
  const offsetNum = parseInt(offset) || 0
  
  let sqlQuery = 'SELECT * FROM lottery_history WHERE 1=1'
  const params = []
  
  if (type) {
    params.push(type)
    sqlQuery += ` AND lottery_type = $${params.length}`
  }
  if (issue) {
    params.push(`%${issue}%`)
    sqlQuery += ` AND issue LIKE $${params.length}`
  }
  sqlQuery += ` ORDER BY id DESC LIMIT ${limitNum} OFFSET ${offsetNum}`
  
  const result = await sql`${sqlQuery}`.catch(() => sql`SELECT * FROM lottery_history ORDER BY id DESC LIMIT ${limitNum}`)
  res.json(result.rows)
})

// 后台添加
app.post('/api/admin/lottery', requireAuth, async (req, res) => {
  const { lottery_type, issue, code, draw_time } = req.body
  if (!lottery_type || !issue || !code) {
    return res.status(400).json({ error: '缺少必要字段' })
  }
  
  await sql`INSERT INTO lottery_history (lottery_type, issue, code, draw_time, created_at)
    VALUES (${lottery_type}, ${issue}, ${code}, ${draw_time || new Date()}, NOW())
    ON CONFLICT (lottery_type, issue) DO UPDATE SET code = EXCLUDED.code, draw_time = EXCLUDED.draw_time`
  
  res.json({ ok: true })
})

// 后台更新
app.put('/api/admin/lottery/:id', requireAuth, async (req, res) => {
  const { lottery_type, issue, code, draw_time } = req.body
  const { id } = req.params
  
  await sql`UPDATE lottery_history SET lottery_type = ${lottery_type}, issue = ${issue}, code = ${code}, draw_time = ${draw_time} WHERE id = ${id}`
  
  res.json({ ok: true })
})

// 后台删除
app.delete('/api/admin/lottery/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  await sql`DELETE FROM lottery_history WHERE id = ${id}`
  res.json({ ok: true })
})

// 修改密码
app.put('/api/admin/password', requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '缺少参数' })
  }
  // 验证旧密码
  const valid = await verifyPassword(oldPassword)
  if (!valid) {
    return res.status(401).json({ error: '旧密码错误' })
  }
  // 生成新密码哈希
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(newPassword, salt, 100000, 64, 'sha512').toString('hex')
  await sql`UPDATE admin_settings SET value = ${salt + ':' + hash} WHERE key = 'password'`
  res.json({ ok: true })
})

// ========== 公告管理 ==========

// 获取启用的公告列表
app.get('/api/announcements', async (req, res) => {
  const result = await sql`SELECT * FROM announcements WHERE enabled = true ORDER BY id DESC`
  res.json(result.rows)
})

// 公告列表（后台）
app.get('/api/admin/announcements', requireAuth, async (req, res) => {
  const result = await sql`SELECT * FROM announcements ORDER BY id DESC`
  res.json(result.rows)
})

// 添加公告
app.post('/api/admin/announcements', requireAuth, async (req, res) => {
  const { content, enabled } = req.body
  if (!content) {
    return res.status(400).json({ error: '内容不能为空' })
  }
  await sql`INSERT INTO announcements (content, enabled) VALUES (${content}, ${enabled !== false})`
  res.json({ ok: true })
})

// 更新公告
app.put('/api/admin/announcements/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  const { content, enabled } = req.body
  await sql`UPDATE announcements SET content = ${content}, enabled = ${enabled} WHERE id = ${id}`
  res.json({ ok: true })
})

// 删除公告
app.delete('/api/admin/announcements/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  await sql`DELETE FROM announcements WHERE id = ${id}`
  res.json({ ok: true })
})

// 启动时初始化admin_settings
initAdminSettings().catch(console.error)

export default (req, res) => app(req, res)