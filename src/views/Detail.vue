<template>
  <div class="detail">
    <div class="container">
      <div class="back" @click="$router.back()">← 返回</div>

      <!-- 最新开奖 -->
      <div class="latest-box" v-if="latest">
        <div class="latest-header">
          <span class="lottery-name">{{ lotteryName }}</span>
          <span class="lottery-issue">第{{ latest.issue }}期</span>
        </div>
        <div class="balls">
          <span
            v-for="(ball, index) in latest.balls"
            :key="index"
            class="ball"
          >{{ ball }}</span>
        </div>
        <div class="lottery-date">{{ formatDate(latest.date) }}</div>
      </div>

      <!-- 标签页 -->
      <div class="trend-section">
        <div class="trend-tabs">
          <span 
            class="trend-tab" 
            :class="{ active: currentTab === 'freq' }"
            @click="currentTab = 'freq'"
          >号码频率</span>
          <span 
            class="trend-tab" 
            :class="{ active: currentTab === 'trend' }"
            @click="currentTab = 'trend'"
          >开奖走势</span>
          <span 
            class="trend-tab" 
            :class="{ active: currentTab === 'history' }"
            @click="currentTab = 'history'"
          >历史开奖</span>
        </div>
        
<!-- 号码频率 -->
        <div class="trend-content" v-show="currentTab === 'freq'">
          <div class="freq-chart" v-if="currentTab === 'freq'">
            <div class="freq-header">
              <span>号码出现频率（前{{ maxShow }}）</span>
              <span class="freq-total">共{{ totalCount }}期</span>
            </div>
            <div class="freq-bars">
              <div v-for="item in freqList" :key="item.num" class="freq-item">
                <span class="freq-num">{{ item.num }}</span>
                <div class="freq-bar-wrapper">
                  <div class="freq-bar" :style="{ width: item.percent + '%', background: item.color }"></div>
                </div>
                <span class="freq-count">{{ item.count }}次</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 开奖走势 -->
        <div class="trend-content" v-show="currentTab === 'trend'">
          <div class="trend-chart" v-if="currentTab === 'trend'">
            <div class="trend-header">
              <span>近{{ showCount }}期开奖走势</span>
            </div>
            <div class="trend-grid">
              <div class="trend-row header">
                <span class="trend-issue">期号</span>
                <span v-for="i in codeLen" :key="i" class="trend-pos">第{{ i }}位</span>
              </div>
              <div v-for="item in trendList" :key="item.issue" class="trend-row">
                <span class="trend-issue">{{ item.issue }}</span>
                <span 
                  v-for="(ball, i) in item.balls" 
                  :key="i" 
                  class="trend-ball"
                  :style="{ background: getBallColor(ball) }"
                >{{ ball }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 历史开奖 -->
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
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const lotteryId = route.params.id

// 标签页：根据路由判断默认打开哪个
const currentTab = ref(route.path.startsWith('/trend/') ? 'freq' : 'history')

// 监听路由变化
watch(() => route.path, (path) => {
  currentTab.value = path.startsWith('/trend/') ? 'freq' : 'history'
})

const codeLen = ref(7)  // 默认7位数
const showCount = ref(10)   // 显示近10期
const maxShow = ref(10)    // 显示前10个

// 彩种配置
const LOTTERY_CONFIG = {
  '3d': { len: 3, max: 9 },
  'ssq': { len: 7, max: 33 },
  'dlt': { len: 7, max: 35 },
  'qlc': { len: 7, max: 30 },
  'plw': { len: 5, max: 9 },
  'pl3': { len: 3, max: 9 },
  'qxc': { len: 7, max: 9 }
}

// 号码频率统计
const totalCount = computed(() => history.value.length)

const freqList = computed(() => {
  const counts = {}
  const max = LOTTERY_CONFIG[lotteryId]?.max || 9
  const limit = Math.min(max + 1, 10)
  
  // 统计每个号码出现次数
  history.value.forEach(item => {
    (item.balls || []).forEach(ball => {
      counts[ball] = (counts[ball] || 0) + 1
    })
  })
  
  // 转为数组并排序
  const list = Object.entries(counts).map(([num, count]) => ({
    num, count, percent: 0
  })).sort((a, b) => b.count - a.count).slice(0, maxShow.value)
  
  // 计算百分比
  const maxCount = list[0]?.count || 1
  list.forEach(item => {
    item.percent = (item.count / maxCount) * 100
    item.color = item.percent > 80 ? '#e63946' : item.percent > 50 ? '#f59e0b' : '#3b82f6'
  })
  
  return list
})

// 走势列表
const trendList = computed(() => {
  return history.value.slice(0, showCount.value).reverse()
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
    hasMore.value = true
  }
  
  loading.value = true
  try {
    const [infoRes, historyRes] = await Promise.all([
      axios.get(`/api/lottery/${lotteryId}`),
      axios.get(`/api/lottery/${lotteryId}/history?limit=50&page=1`)
    ])
    const data = infoRes.data
    lotteryName.value = data.name
    latest.value = data.latest
    history.value = historyRes.data
    
    // 设置号码位数
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

// 滚动检测
const handleScroll = () => {
  if (!loadMoreRef.value) return
  const rect = loadMoreRef.value.getBoundingClientRect()
  if (rect.top < window.innerHeight + 100) {
    loadMore()
  }
}

const formatDate = (date) => {
  if (!date) return ''
  // 只取日期部分，不转时区
  return typeof date === 'string' ? date.split('T')[0] : date
}

onMounted(() => {
  fetchData()
  timer = setInterval(fetchData, 5000)
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.detail {
  padding: 0.5rem 0;
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

.back:active {
  color: #e63946;
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

.ball {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(135deg, #e63946 0%, #c1121f 100%);
  box-shadow: 0 4px 8px rgba(230, 57, 70, 0.3);
}

.lottery-date {
  font-size: 0.75rem;
  color: #999;
  margin-bottom: 1rem;
}

.prize-pool {
  border-top: 1px solid #f0f0f0;
  padding-top: 1rem;
}

.prize-title {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.prize-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.prize-item {
  background: #f9f9f9;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  display: flex;
  gap: 0.5rem;
}

.prize-item span:first-child {
  color: #666;
}

.prize-item span:last-child {
  color: #e63946;
  font-weight: 600;
}

.section-title {
  font-size: 1rem;
  color: #333;
  margin-bottom: 0.75rem;
  padding-left: 0.5rem;
  border-left: 3px solid #e63946;
}

.history-list {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.history-item {
  display: flex;
  align-items: center;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.history-item:last-child {
  border-bottom: none;
}

.history-item .issue {
  width: 90px;
  font-size: 0.75rem;
  color: #666;
  flex-shrink: 0;
}

.history-item .balls {
  flex: 1;
  display: flex;
  gap: 0.25rem;
  justify-content: center;
}

.ball-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(135deg, #e63946 0%, #c1121f 100%);
}

.history-item .date {
  width: 70px;
  font-size: 0.625rem;
  color: #999;
  text-align: right;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .latest-box {
    padding: 2rem;
  }

  .ball {
    width: 72px;
    height: 72px;
    font-size: 2rem;
  }

  .ball-small {
    width: 28px;
    height: 28px;
    font-size: 0.875rem;
  }
}

/* 趋势图 */
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

/* 号码频率 */
.freq-chart {
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
  transition: width 0.3s;
}

.freq-count {
  width: 40px;
  font-size: 0.75rem;
  color: #999;
  text-align: right;
}

/* 开奖走势 */
.trend-chart {
  padding: 0.5rem 0;
  overflow-x: auto;
}

.trend-header {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.75rem;
}

.trend-grid {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.trend-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.trend-row.header {
  font-size: 0.7rem;
  color: #999;
  margin-bottom: 0.25rem;
}

.trend-issue {
  width: 60px;
  font-size: 0.7rem;
  color: #666;
  flex-shrink: 0;
}

.trend-pos {
  width: 28px;
  font-size: 0.65rem;
  color: #999;
  text-align: center;
  flex-shrink: 0;
}

.trend-ball {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
  color: #fff;
  flex-shrink: 0;
}
</style>