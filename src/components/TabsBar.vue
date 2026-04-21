<template>
  <div class="tabs-bar">
    <div class="tabs">
      <span 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab', { active: activeTab === tab.id }]"
        @click="$emit('change', tab.id)"
      >
        {{ tab.name }}
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  tabs: {
    type: Array,
    default: () => [
      { id: 'result', name: '开奖结果' },
      { id: 'trend', name: '走势图' },
      { id: 'filter', name: '过滤工具' }
    ]
  },
  activeTab: {
    type: String,
    default: 'result'
  }
})

defineEmits(['change'])
</script>

<style scoped>
.tabs-bar {
  background: #f5f5f5;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e0e0e0;
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.tab {
  color: #666;
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  position: relative;
}

.tab.active {
  color: #1a56a8;
  font-weight: bold;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -0.5rem;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 2px;
  background: #1a56a8;
}
</style>