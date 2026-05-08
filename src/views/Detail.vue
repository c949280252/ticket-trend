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

        <!-- 奖池信息 -->
        <div class="prize-pool" v-if="prizes && prizes.length > 0">
          <div class="prize-title">开奖公告</div>
          <div class="prize-list">
            <div v-for="(p, i) in prizes" :key="i" class="prize-item">
              <span>{{ p.name }}</span>
              <span>{{ p.amount }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 历史开奖 -->
      <div class="history">
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
import { ref, onMounted, onUnmounted } from 'vue'
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

const fetchData = async (reset = false) => {
  if (reset) {
    page.value = 1
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
</style>