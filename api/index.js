import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

// 彩票数据 - 模拟数据
const lotteryData = {
  ssq: {
    id: 'ssq',
    name: '双色球',
    type: 'ssq',
    latestIssue: '2025050',
    latest: {
      issue: '2025050',
      date: '2025-04-20',
      balls: ['02', '08', '14', '20', '27', '30', '09'],
      prize: [
        { name: '一等奖', amount: '10,000,000元' },
        { name: '二等奖', amount: '300,000元' }
      ]
    },
    history: [
      { issue: '2025050', date: '2025-04-20', balls: ['02', '08', '14', '20', '27', '30', '09'] },
      { issue: '2025049', date: '2025-04-18', balls: ['05', '12', '19', '23', '25', '28', '04'] },
      { issue: '2025048', date: '2025-04-15', balls: ['01', '09', '16', '22', '29', '33', '07'] }
    ]
  },
  dlt: {
    id: 'dlt',
    name: '大乐透',
    type: 'dlt',
    latestIssue: '2025042',
    latest: {
      issue: '2025042',
      date: '2025-04-19',
      balls: ['03', '12', '18', '24', '30', '03', '08'],
      prize: [
        { name: '一等奖', amount: '10,000,000元' },
        { name: '二等奖', amount: '200,000元' }
      ]
    },
    history: [
      { issue: '2025042', date: '2025-04-19', balls: ['03', '12', '18', '24', '30', '03', '08'] },
      { issue: '2025041', date: '2025-04-16', balls: ['06', '11', '19', '23', '27', '02', '05'] },
      { issue: '2025040', date: '2025-04-13', balls: ['02', '07', '15', '21', '28', '04', '09'] }
    ]
  },
  qxc: {
    id: 'qxc',
    name: '七星彩',
    type: 'qxc',
    latestIssue: '2025038',
    latest: {
      issue: '2025038',
      date: '2025-04-18',
      balls: ['2', '5', '8', '1', '4', '7', '9'],
      prize: [
        { name: '一等奖', amount: '5,000,000元' }
      ]
    },
    history: [
      { issue: '2025038', date: '2025-04-18', balls: ['2', '5', '8', '1', '4', '7', '9'] },
      { issue: '2025037', date: '2025-04-15', balls: ['3', '6', '9', '0', '2', '4', '8'] }
    ]
  },
  '3d': {
    id: '3d',
    name: '3D',
    type: '3d',
    latestIssue: '2025100',
    latest: {
      issue: '2025100',
      date: '2025-04-20',
      balls: ['5', '2', '9'],
      prize: [
        { name: '单选', amount: '1,040元' },
        { name: '组三', amount: '346元' }
      ]
    },
    history: [
      { issue: '2025100', date: '2025-04-20', balls: ['5', '2', '9'] },
      { issue: '2025099', date: '2025-04-19', balls: ['4', '1', '8'] },
      { issue: '2025098', date: '2025-04-18', balls: ['7', '3', '6'] }
    ]
  },
  pl3: {
    id: 'pl3',
    name: '排列三',
    type: 'pl3',
    latestIssue: '2025100',
    latest: {
      issue: '2025100',
      date: '2025-04-20',
      balls: ['3', '6', '9'],
      prize: [
        { name: '直选', amount: '1,040元' }
      ]
    },
    history: [
      { issue: '2025100', date: '2025-04-20', balls: ['3', '6', '9'] },
      { issue: '2025099', date: '2025-04-19', balls: ['2', '5', '8'] }
    ]
  },
  kl8: {
    id: 'kl8',
    name: '快乐8',
    type: 'kl8',
    latestIssue: '2025100',
    latest: {
      issue: '2025100',
      date: '2025-04-20',
      balls: ['03', '12', '18', '24', '25', '30', '41', '52', '53', '60', '64', '71', '73', '75', '78'],
      prize: [
        { name: '选十中十', amount: '5,000,000元' }
      ]
    },
    history: [
      { issue: '2025100', date: '2025-04-20', balls: ['03', '12', '18', '24', '25', '30', '41', '52', '53', '60', '64', '71', '73', '75', '78'] },
      { issue: '2025099', date: '2025-04-19', balls: ['05', '11', '19', '22', '28', '35', '42', '48', '50', '56', '62', '65', '69', '72', '80'] }
    ]
  }
}

// 获取所有彩票最新开奖
app.get('/api/lottery', (req, res) => {
  const list = Object.values(lotteryData).map(item => ({
    id: item.id,
    name: item.name,
    type: item.type,
    redCount: item.type === 'ssq' ? 6 : item.type === 'dlt' ? 5 : 0,
    latestIssue: item.latestIssue,
    date: item.latest.date,
    balls: item.latest.balls
  }))
  res.json(list)
})

// 获取单个彩票详情
app.get('/api/lottery/:id', (req, res) => {
  const { id } = req.params
  const data = lotteryData[id]
  if (!data) {
    return res.status(404).json({ error: 'Not found' })
  }
  res.json({
    id: data.id,
    name: data.name,
    type: data.type,
    latest: data.latest
  })
})

// 获取单个彩票历史
app.get('/api/lottery/:id/history', (req, res) => {
  const { id } = req.params
  const data = lotteryData[id]
  if (!data) {
    return res.status(404).json({ error: 'Not found' })
  }
  res.json(data.history)
})

// Vercel Serverless Handler
export default (req, res) => {
  app(req, res)
}