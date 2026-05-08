<template>
  <div class="detail">
    <div class="container">
      <div class="back" @click="$router.back()">← 返回</div>

      <div class="latest-box" v-if="latest">
        <div class="latest-header">
          <span class="lottery-name">{{ lotteryName }}</span>
          <span class="lottery-issue">第{{ latest.issue }}期</span>
        </div>
        <div class="balls">
          <span v-for="(ball, index) in latest.balls" :key="index" class="ball-large">{{ ball }}</span>
        </div>
        <div class="lottery-date">{{ formatDate(latest.date) }}</div>
      </div>

      <div class="trend-section">
        <div class="trend-tabs">
          <span class="trend-tab" :class="{ active: currentTab === 'freq' }" @click="currentTab = 'freq'">号码频率</span>
          <span class="trend-tab" :class="{ active: currentTab === 'trend' }" @click="currentTab = 'trend'">开奖走势</span>
          <span class="trend-tab" :class="{ active: currentTab === 'history' }" @click="currentTab = 'history'">历史开奖</span>
        </div>
        
        <div class="trend-content" v-show="currentTab === 'freq'">
          <div class="freq-chart">
            <div class="freq-header">
              <span>号码出现频率（前{{ maxShow }}）</span>
              <span class="freq-total">共{{ totalCountFinal }}期</span>
            </div>
            <div class="freq-bars">
              <div v-for="item in freqListFinal" :key="item.num" class="freq-item">
                <span class="freq-num">{{ item.num }}</span>
                <div class="freq-bar-wrapper">
                  <div class="freq-bar" :style="{ width: item.percent + '%', background: item.color }"></div>
                </div>
                <span class="freq-count">{{ item.count }}次</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="trend-content" v-show="currentTab === 'trend'">
          <div class="trend-chart">
            <div class="trend-header">
              <span>近{{ showCount }}期开奖走势</span>
            </div>
            <div class="trend-table" v-if="trendListFinal.length > 0">
              <div class="trend-thead">
                <span class="th-issue">期号</span>
                <span v-for="i in codeLen" :key="i" class="th-pos">第{{ i }}位</span>
              </div>
              <div 
                v-for="item in trendListFinal" 
                :key="item.issue" 
                class="trend-row"
                :style="{ background: item === trendListFinal[0] ? '#fff5f5' : 'transparent' }"
              >
                <span class="td-issue">{{ item.issue }}</span>
                <span v-for="(ball, i) in item.balls" :key="i" class="td-ball" :style="{ background: getBallColor(ball) }">{{ ball }}</span>
              </div>
            </div>
            <div v-else class="no-data">暂无数据</div>
          </div>
        </div>
        
        <div class="history" v-show="currentTab === 'history'">
          <h3 class="section-title">历史开奖</h3>
          <div class="history-list">
            <div v-for="item in history" :key="item.issue" class="history-item">
              <span class="issue">第{{ item.issue }}期</span>
              <div class="balls">
                <span v-for="(ball, i) in item.balls" :key="i" class="ball-small">{{ ball }}</span>
              </div>
              <span class="date">{{ typeof item.date === 'string' ? item.date.split('T')[0] : item.date }}</span>
            </div>
          </div>
          <div class="load-more" ref="loadMoreRef" v-if="hasMore">
            {{ loading ? '加载中...' : '上滑加载更多' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const lotteryId = route.params.id
const lotteryName = ref('')
const latest = ref(null)
const history = ref([])
const prizes = ref([])
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)
const PAGE_SIZE = 20
const loadMoreRef = ref(null)
let timer = null

const currentTab = ref(route.path.startsWith('/trend/') ? 'freq' : 'history')

watch(() => route.path, (path) => {
  currentTab.value = path.startsWith('/trend/') ? 'freq' : 'history'
})

const codeLen = ref(7)
const showCount = ref(10)
const maxShow = ref(10)

const LOTTERY_CONFIG = {
  '3d': { len: 3, max: 9 },
  'ssq': { len: 7, max: 33 },
  'dlt': { len: 7, max: 35 },
  'qlc': { len: 7, max: 30 },
  'plw': { len: 5, max: 9 },
  'pl3': { len: 3, max: 9 },
  'qxc': { len: 7, max: 9 }
}

const freqListFinal = computed(() => {
  const counts = {}
  history.value.slice(0, 50).forEach(item => {
    (item.balls || []).forEach(ball => {
      counts[ball] = (counts[ball] || 0) + 1
    })
  })
  const list = Object.entries(counts).map(([num, count]) => ({ num, count, percent: 0 }))
    .sort((a, b) => b.count - a.count).slice(0, maxShow.value)
  const max = list[0]?.count || 1
  list.forEach(item => {
    item.percent = (item.count / max) * 100
    item.color = item.percent > 80 ? '#e63946' : item.percent > 50 ? '#f59e0b' : '#3b82f6'
  })
  return list
})

const totalCountFinal = computed(() => history.value.length)

const trendListFinal = computed(() => history.value.slice(0, showCount.value).reverse())

// 按位置统计走势
const posBalls = computed(() => {
  const data = history.value.slice(0, showCount.value)
  const posStats = []
  
  for (let p = 0; p < codeLen.value; p++) {
    const counts = {}
    data.forEach(item => {
      const ball = item.balls?.[p]
      if (ball) counts[ball] = (counts[ball] || 0) + 1
    })
    const list = Object.entries(counts).map(([num, count]) => ({ num, count })).sort((a, b) => a.num.localeCompare(b.num))
    const max = list[0]?.count || 1
    posStats.push({
      index: p + 1,
      balls: list.map(item => ({
        num: item.num,
        count: item.count,
        opacity: Math.max(0.3, item.count / max),
        color: getBallColor(item.num)
      }))
    })
  }
  return posStats
})

const getBallColor = (ball) => {
  const num = parseInt(ball) || 0
  if (num <= 3) return '#e63946'
  if (num <= 6) return '#f59e0b'
  if (num <= 9) return '#3b82f6'
  if (num <= 16) return '#22c55e'
  if (num <= 23) return '#8b5cf6'
  if (num <= 30) return '#ec4899'
  return '#06b6d4'
}

const fetchData = async (reset = false) => {
  if (reset) {
    page.value = 1
    history.value = []
    hasMore.value = true
  }
  loading.value = true
  try {
    const [infoRes, historyRes] = await Promise.all([
      axios.get(`/api/lottery/${lotteryId}`),
      axios.get(`/api/lottery/${lotteryId}/history?limit=${PAGE_SIZE}&page=${page.value}`)
    ])
    const data = infoRes.data
    lotteryName.value = data.name
    latest.value = data.latest
    if (page.value === 1) {
      history.value = historyRes.data
    } else {
      history.value = [...history.value, ...historyRes.data]
    }
    if (LOTTERY_CONFIG[lotteryId]) {
      codeLen.value = LOTTERY_CONFIG[lotteryId].len
    }
    prizes.value = data.latest?.prize || []
    hasMore.value = historyRes.data.length === PAGE_SIZE
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  if (loading.value || !hasMore.value) return
  page.value++
  try {
    const historyRes = await axios.get(`/api/lottery/${lotteryId}/history?limit=${PAGE_SIZE}&page=${page.value}`)
    history.value = [...history.value, ...historyRes.data]
    hasMore.value = historyRes.data.length === PAGE_SIZE
  } catch (e) {
    console.error(e)
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return date.split('T')[0]
}

onMounted(() => {
  fetchData()
  
  // 无限加载
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMore.value && !loading.value) {
      loadMore()
    }
  }, { threshold: 0.1 })
  
  if (loadMoreRef.value) {
    observer.observe(loadMoreRef.value)
  }
})
</script>

<style scoped>
.detail {
  padding: 0.5rem 0;
  background: #f5f7fa;
  min-height: 100vh;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 0.75rem;
}

.back {
  color: #666;
  cursor: pointer;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}

.latest-box {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.latest-header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.lottery-name {
  font-size: 1.25rem;
  font-weight: bold;
  color: #e63946;
}

.lottery-issue {
  font-size: 0.875rem;
  color: #666;
  background: #f5f5f5;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.balls {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.ball, .ball-large {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(135deg, #e63946 0%, #c1121f 100%);
}

.lottery-date {
  font-size: 0.75rem;
  color: #999;
}

.trend-section {
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.trend-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 0.5rem;
}

.trend-tab {
  font-size: 0.9rem;
  color: #999;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
}

.trend-tab.active {
  color: #e63946;
  font-weight: bold;
}

.trend-content, .history {
  padding: 0.5rem 0;
}

.freq-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.75rem;
}

.freq-total {
  color: #999;
}

.freq-bars {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.freq-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.freq-num {
  width: 20px;
  font-size: 0.85rem;
  font-weight: bold;
  color: #333;
}

.freq-bar-wrapper {
  flex: 1;
  height: 16px;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.freq-bar {
  height: 100%;
  border-radius: 8px;
}

.freq-count {
  width: 40px;
  font-size: 0.75rem;
  color: #999;
  text-align: right;
}

.trend-table {
  overflow-x: auto;
  border: 1px solid #eee;
  border-radius: 8px;
}

.trend-thead {
  display: flex;
  background: #f5f5f5;
  font-size: 0.7rem;
  color: #666;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.th-issue, .td-issue {
  width: 70px;
  flex-shrink: 0;
  padding-left: 0.5rem;
}

.th-pos, .td-ball {
  width: 30px;
  flex-shrink: 0;
  text-align: center;
}

.trend-row {
  display: flex;
  align-items: center;
  padding: 0.4rem 0;
  border-bottom: 1px solid #f5f5f5;
}

.trend-row:last-child {
  border-bottom: none;
}

.td-ball {
  height: 26px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  color: #fff;
}

.history {
  padding: 0.5rem 0;
}

.section-title {
  font-size: 1rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.75rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.issue {
  width: 80px;
  font-size: 0.85rem;
  color: #666;
}

.date {
  margin-left: auto;
  font-size: 0.8rem;
  color: #999;
}

.balls {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.ball-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(135deg, #e63946 0%, #c1121f 100%);
  margin-right: 0.25rem;
}

.load-more {
  text-align: center;
  padding: 1rem;
  color: #999;
  font-size: 0.8rem;
}

@media (min-width: 768px) {
  .ball {
    width: 56px;
    height: 56px;
    font-size: 1.5rem;
  }
}
</style>