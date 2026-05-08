<template>
  <div class="announcement-bar" v-if="announcements.length > 0">
    <span class="label">公告：</span>
    <div class="marquee">
      <div class="marquee-content" :style="{ animationDuration: `${announcements.length * 5}s` }">
        <span v-for="(item, index) in announcements" :key="item.id" class="announcement-text">
          {{ item.content }}
          <span v-if="index < announcements.length - 1" class="separator"> | </span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const announcements = ref([])

onMounted(async () => {
  try {
    const res = await axios.get('/api/announcements')
    announcements.value = res.data
  } catch (e) {
    // ignore
  }
})
</script>

<style scoped>
.announcement-bar {
  background: #fff3cd;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  overflow: hidden;
  font-size: 0.875rem;
}

.label {
  font-weight: bold;
  color: #856404;
  flex-shrink: 0;
}

.marquee {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
}

.marquee-content {
  display: inline-block;
  animation: scroll-left linear infinite;
  color: #856404;
}

@keyframes scroll-left {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(-100%);
  }
}

.announcement-text {
  display: inline;
}

.separator {
  margin: 0 1rem;
}
</style>