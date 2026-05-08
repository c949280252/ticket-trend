<template>
  <div class="announcement-bar" v-if="announcements.length > 0">
    <span class="label">公告：</span>
    <div class="marquee-wrapper">
      <div class="marquee-content" ref="contentRef">
        <span v-for="item in announcements" :key="item.id" class="announcement-text">
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
    setTimeout(calcDuration, 200)
  } catch (e) {
    // ignore
  }
})

function calcDuration() {
  if (!contentRef.value) return
  const width = contentRef.value.offsetWidth
  if (width > 0) {
    const duration = width / SPEED
    contentRef.value.style.animationDuration = duration + 's'
  }
}
</script>

<style scoped>
.announcement-bar {
  background: #1a56a8;
  padding: 0.4rem 0;
  display: flex;
  align-items: center;
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
  display: inline-block;
  white-space: nowrap;
  animation: marquee 10s linear infinite;
}

.announcement-text {
  color: #fff;
  padding: 0 2rem;
}

@keyframes marquee {
  0% {
    transform: translateX(100vw);
  }
  to {
    transform: translateX(-100%);
  }
}
</style>