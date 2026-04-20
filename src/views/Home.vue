<template>
  <div class="home">
    <div class="container">
      <h2>常用彩票最新开奖结果</h2>
      <div v-if="lotteryList.length === 0" class="loading">加载中...</div>
      <div class="lottery-list" v-else>
        <div
          v-for="item in lotteryList"
          :key="item.id"
          class="lottery-card"
          @click="goDetail(item.id)"
        >
          <div class="lottery-header">
            <span class="lottery-name">{{ item.name }}</span>
            <span class="lottery-issue">第{{ item.latestIssue }}期</span>
          </div>
          <div class="lottery-balls">
            {{ item.balls }}
            <span
              v-for="(ball, index) in item.balls"
              :key="index"
              class="ball"
            >{{ ball }}</span>
          </div>
          <div class="lottery-date">{{ item.date }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const lotteryList = ref([])
let timer = null

const fetchData = async () => {
  try {
    const res = await axios.get('/api/lottery')
    lotteryList.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const goDetail = (id) => {
  router.push(`/detail/${id}`)
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
.home {
  padding: 2rem 0;
}

h2 {
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
  color: #333;
}

.lottery-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.lottery-card {
  background: #fff;
  border-radius: 8px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.lottery-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.lottery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.lottery-name {
  font-weight: 600;
  font-size: 1rem;
  color: #1a1a2e;
}

.lottery-issue {
  font-size: 0.75rem;
  color: #999;
}

.lottery-balls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.ball {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
}

.ball.red {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
}

.ball.blue {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
}

.lottery-date {
  font-size: 0.75rem;
  color: #999;
}
</style>