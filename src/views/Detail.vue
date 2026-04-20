<template>
  <div class="detail">
    <div class="container">
      <div class="back" @click="$router.back()">← 返回</div>
      <h2>{{ lotteryName }}</h2>
      <div class="latest-result" v-if="latest">
        <div class="latest-header">
          <span>第{{ latest.issue }}期</span>
          <span>{{ latest.date }}</span>
        </div>
        <div class="balls">
          <span
            v-for="(ball, index) in latest.balls"
            :key="index"
            class="ball"
            :class="{ red: lotteryType === 'ssq' || lotteryType === 'dlt', blue: lotteryType === 'dlt' && index >= redCount }"
          >{{ ball }}</span>
        </div>
        <div class="prize" v-if="latest.prize">
          <div v-for="(item, index) in latest.prize" :key="index" class="prize-item">
            <span>{{ item.name }}</span>
            <span>{{ item.amount }}</span>
          </div>
        </div>
      </div>
      <div class="history">
        <h3>历史开奖</h3>
        <div class="history-list">
          <div v-for="item in history" :key="item.issue" class="history-item">
            <span class="issue">第{{ item.issue }}期</span>
            <div class="balls">
              <span
                v-for="(ball, index) in item.balls"
                :key="index"
                class="ball-small"
                :class="{ red: lotteryType === 'ssq' || lotteryType === 'dlt', blue: lotteryType === 'dlt' && index >= redCount }"
              >{{ ball }}</span>
            </div>
            <span class="date">{{ item.date }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const lotteryId = route.params.id
const lotteryName = ref('')
const lotteryType = ref('')
const latest = ref(null)
const history = ref([])
let timer = null

const redCount = computed(() => {
  if (lotteryType.value === 'ssq') return 6
  if (lotteryType.value === 'dlt') return 5
  return 0
})

const fetchData = async () => {
  try {
    const [infoRes, historyRes] = await Promise.all([
      axios.get(`/api/lottery/${lotteryId}`),
      axios.get(`/api/lottery/${lotteryId}/history`)
    ])
    const data = infoRes.data
    lotteryName.value = data.name
    lotteryType.value = data.type
    latest.value = data.latest
    history.value = historyRes.data
    console.log('History:', historyRes.data)
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchData()
  timer = setInterval(fetchData, 5000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.detail {
  padding: 2rem 0;
}

.back {
  color: #666;
  cursor: pointer;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.back:hover {
  color: #1a1a2e;
}

h2 {
  margin-bottom: 1.5rem;
}

.latest-result {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.latest-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  color: #666;
  font-size: 0.875rem;
}

.balls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.ball {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
}

.ball.red {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
}

.ball.blue {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
}

.prize {
  border-top: 1px solid #eee;
  padding-top: 1rem;
}

.prize-item {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  font-size: 0.875rem;
}

.history h3 {
  font-size: 1rem;
  margin-bottom: 1rem;
}

.history-list {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.history-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.history-item:last-child {
  border-bottom: none;
}

.history-item .issue {
  width: 100px;
  font-size: 0.875rem;
  color: #666;
}

.history-item .balls {
  flex: 1;
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0;
}

.ball-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
}

.history-item .date {
  font-size: 0.75rem;
  color: #999;
  width: 80px;
  text-align: right;
}
</style>