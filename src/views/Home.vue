<template>
  <div class="home">
    <div class="container">
      <!-- 趋势图入口 -->
      <div class="trend-entrance">
        <span class="trend-label">趋势图</span>
        <div class="trend-icons">
          <div 
            class="trend-icon-small" 
            v-for="item in lotteryList" 
            :key="item.id" 
            :style="{ background: item.color }"
            @click="goTrend(item.id)"
            :title="item.name"
          >
            {{ item.name.charAt(0) }}
          </div>
        </div>
      </div>

      <!-- 全部彩种 -->
      <div class="nav-section">
        <div class="section-header">
          <h3 class="section-title">全部彩种</h3>
        </div>
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

    <!-- 底部信息 -->
    <div class="footer">
      <div class="footer-content">
        <div class="footer-logo">彩票开奖网</div>
        <div class="footer-desc">专业彩票开奖数据查询平台</div>
        <div class="footer-links">
          <span>关于我们</span>
          <span class="divider">|</span>
          <span>联系我们</span>
          <span class="divider">|</span>
          <span>服务条款</span>
        </div>
        <div class="footer-copyright">
          © 2024 彩票开奖网 · 鲁ICP备XXXXXXXX号
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const lotteryList = ref([])
let timer = null

// 热门推荐（基于彩种数据）
const hotList = computed(() => {
  return lotteryList.value.map((item, index) => ({
    ...item,
    color: ['#e63946', '#1a56a8', '#2d9cdb', '#f59e0b', '#8b5cf6', '#22c55e', '#ec4899'][index % 7]
  }))
})

const goTrend = (id) => {
  router.push(`/trend/${id}`)
}

const fetchData = async () => {
  try {
    const res = await axios.get('/api/lottery')
    // 排序：3D、排列三、排列五、七星彩、双色球、大乐透、七乐彩
    const order = ['3d', 'pl3', 'plw', 'qxc', 'ssq', 'dlt', 'qlc']
    const sorted = res.data.sort((a, b) => {
      const ia = order.indexOf(a.id)
      const ib = order.indexOf(b.id)
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
    })
    lotteryList.value = sorted
  } catch (e) {
    console.error(e)
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return date.split('T')[0]
}

const goDetail = (id) => {
  router.push(`/detail/${id}`)
}

onMounted(() => {
  fetchData()
  timer = setInterval(fetchData, 10000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.home {
  padding-bottom: 2rem;
  background: #f5f7fa;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 0.75rem;
}

/* 统计 */
.stats-section {
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  text-align: center;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: bold;
  color: #e63946;
}

.stat-label {
  font-size: 0.7rem;
  color: #999;
  margin-top: 0.25rem;
}

/* 区块标题 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.section-title {
  font-size: 1rem;
  font-weight: bold;
  color: #333;
}

.section-tag {
  font-size: 0.7rem;
  color: #e63946;
  background: rgba(230,57,70,0.1);
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
}

.section-more {
  font-size: 0.8rem;
  color: #999;
}

/* 最新开奖 */
.latest-box {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  text-align: center;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
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
  font-size: 0.8rem;
  color: #666;
  background: #f5f5f5;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
}

.balls {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.ball {
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
  box-shadow: 0 3px 6px rgba(230,57,70,0.3);
}

.lottery-date {
  font-size: 0.75rem;
  color: #999;
}

/* 趋势图入口 */
.trend-entrance {
  background: #fff;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.trend-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.trend-icons {
  display: flex;
  gap: 0.4rem;
}

.trend-icon-small {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  color: #fff;
  cursor: pointer;
}

/* 导航 */
.nav-section {
  margin-top: 0.5rem;
}

.nav-list {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
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
  gap: 0.4rem;
  margin-right: 0.5rem;
}

.ball-small {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(135deg, #e63946 0%, #c1121f 100%);
}

.arrow {
  color: #ccc;
  font-size: 1rem;
}

/* 底部 */
.footer {
  background: #2d2d2d;
  padding: 2rem 1rem;
  margin-top: 1rem;
  text-align: center;
}

.footer-logo {
  font-size: 1.25rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 0.5rem;
}

.footer-desc {
  font-size: 0.8rem;
  color: #999;
  margin-bottom: 1rem;
}

.footer-links {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 1rem;
}

.footer-links span {
  cursor: pointer;
}

.footer-links .divider {
  margin: 0 0.5rem;
}

.footer-copyright {
  font-size: 0.7rem;
  color: #555;
}

@media (max-width: 380px) {
  .container {
    padding: 0 0.5rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  
  .stat-value {
    font-size: 1rem;
  }
  
  .stat-label {
    font-size: 0.65rem;
  }
  
  .lottery-name {
    font-size: 1rem;
  }
  
  .ball {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }
  
  .hot-grid {
    grid-template-columns: 1fr;
  }
  
  .hot-card {
    padding: 0.5rem;
  }
  
  .hot-icon {
    width: 32px;
    height: 32px;
  }
  
  .footer-links {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .footer-links .divider {
    display: none;
  }
}

@media (min-width: 768px) {
  .container {
    padding: 0 1rem;
  }
  
  .stats-grid {
    gap: 1.5rem;
    padding: 1rem;
  }
  
  .stat-value {
    font-size: 1.75rem;
  }
  
  .stat-label {
    font-size: 0.85rem;
  }
  
  .latest-box {
    padding: 2rem;
  }
  
  .lottery-name {
    font-size: 1.5rem;
  }
  
  .ball {
    width: 60px;
    height: 60px;
    font-size: 1.75rem;
  }
  
  .hot-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .footer-content {
    padding: 2rem;
  }
}
</style>