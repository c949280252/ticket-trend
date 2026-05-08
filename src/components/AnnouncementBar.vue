<template>
  <div class="announcement-bar" v-if="announcements.length > 0">
    <span class="label">公告：</span>
    <div class="marquee-wrapper" ref="wrapperRef">
      <div class="marquee-content" :style="contentStyle">
        <div class="marquee-inner">
          <span v-for="item in announcements" :key="item.id" class="announcement-text">
            {{ item.content }}
          </span>
        </div>
        <div class="marquee-inner">
          <span v-for="item in announcements" :key="'dup-' + item.id" class="announcement-text">
            {{ item.content }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import axios from 'axios'

const announcements = ref([])
const wrapperRef = ref(null)
const duration = ref(20)

const contentStyle = computed(() => ({
  animation: `scroll-left ${duration.value}s linear infinite`
}))

const SPEED = 30 // 30px/秒

onMounted(async () => {
  try {
    const res = await axios.get('/api/announcements')
    announcements.value = res.data
    
    await nextTick()
    setTimeout(calcDuration, 100)
  } catch (e) {
    // ignore
  }
})

function calcDuration() {
  const inner = document.querySelector('.marquee-inner')
  if (inner) {
    duration.value = inner.offsetWidth / SPEED
  }
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
  position: relative;
}

.marquee-content {
  display: flex;
  will-change: transform;
}

.marquee-inner {
  display: flex;
  white-space: nowrap;
  flex-shrink: 0;
}

.announcement-text {
  color: #fff;
  padding: 0 2rem;
  flex-shrink: 0;
}

@keyframes scroll-left {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}
</style>