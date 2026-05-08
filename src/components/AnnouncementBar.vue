<template>
  <div class="announcement-bar" v-if="announcements.length > 0">
    <span class="label">公告：</span>
    <div class="marquee-wrapper">
      <div class="marquee-content" ref="contentRef">
        <span v-for="item in announcements" :key="item.id" class="announcement-text">
          {{ item.content }}
        </span>
        <span v-for="item in announcements" :key="'dup-' + item.id" class="announcement-text">
          {{ item.content }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import axios from 'axios'

const announcements = ref([])
const contentRef = ref(null)

const SPEED = 30 // 30px/秒

onMounted(async () => {
  try {
    const res = await axios.get('/api/announcements')
    announcements.value = res.data
    
    await nextTick()
    setTimeout(calcSpeed, 100)
  } catch (e) {
    // ignore
  }
})

function calcSpeed() {
  if (!contentRef.value) return
  
  // 内容宽度（两份）
  const totalWidth = contentRef.value.offsetWidth
  // 一个内容的宽度
  const oneWidth = totalWidth / 2
  // 时间 = 宽度 / 速度
  const duration = oneWidth / SPEED
  contentRef.value.style.animationDuration = duration + 's'
}
</script>

<style scoped>
.announcement-bar {
  background: #1a56a8;
  padding: 0.4rem 0;
  display: flex;
  align-items: center;
  overflow: hidden;
  font-size: 0.875rem;
  margin-bottom: 0;
}

.label {
  font-weight: bold;
  color: #fff;
  padding: 0 0.5rem;
  background: #1a56a8;
  flex-shrink: 0;
  z-index: 1;
}

.marquee-wrapper {
  flex: 1;
  overflow: hidden;
}

.marquee-content {
  display: flex;
  white-space: nowrap;
  animation: scroll-left 20s linear infinite;
  will-change: transform;
}

.announcement-text {
  color: #fff;
  padding: 0 2rem;
  flex-shrink: 0;
}

@keyframes scroll-left {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}
</style>