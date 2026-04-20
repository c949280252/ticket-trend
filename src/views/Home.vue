<template>
  <div class="home">
    <div class="container">
      <!-- 最新开奖 -->
      <div class="latest-box" v-if="lotteryList.length > 0">
        <div class="lottery-header">
          <span class="lottery-name">{{ lotteryList[0].name }}</span>
          <span class="lottery-issue">第{{ lotteryList[0].latestIssue }}期</span>
        </div>
        <div class="balls">
          <span
            v-for="(ball, index) in lotteryList[0].balls"
            :key="index"
            class="ball"
          >{{ ball }}</span>
        </div>
        <div class="lottery-date">{{ formatDate(lotteryList[0].date) }}</div>
      </div>

      <!-- 导航列表 -->
      <div class="nav-list">
        <div
          class="nav-item"
          v-for="item in lotteryList"
          :key="item.id"
          @click="goDetail(item.id)"
        >
          <div class="nav-info">
            <span class="nav-name">{{ item.name }}</span>
            <span class="nav-issue">第{{ item.latestIssue }}期</span>
          </div>
          <div class="nav-balls">
            <span v-for="(ball, i) in item.balls" :key="i" class="ball-small">{{ ball }}</span>
          </div>
          <span class="arrow">></span>
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

const formatDate = (date) => {
  if (!date) return ''
  // 只取日期部分，不转时区
  return date.split('T')[0]
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
  padding: 0.5rem 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 0.75rem;
}

.latest-box {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.lottery-header {
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
}

.nav-list {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.nav-item:last-child {
  border-bottom: none;
}

.nav-item:active {
  background: #f9f9f9;
}

.nav-info {
  flex: 1;
}

.nav-name {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.nav-issue {
  font-size: 0.75rem;
  color: #999;
}

.nav-balls {
  display: flex;
  gap: 0.25rem;
  margin-right: 0.5rem;
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

.arrow {
  color: #ccc;
  font-size: 1rem;
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