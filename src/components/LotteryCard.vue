<template>
  <div class="lottery-card" @click="$emit('click', id)">
    <div class="card-header">
      <span class="lottery-name">{{ name }}</span>
      <span class="lottery-issue">第{{ issue }}期</span>
    </div>
    <div class="balls-row">
      <span v-for="(ball, i) in balls" :key="i" class="ball">{{ ball }}</span>
    </div>
    <div class="card-footer">
      <span class="date">{{ formatDate(date) }}</span>
      <span class="arrow">></span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  id: String,
  name: String,
  issue: String,
  date: String,
  balls: {
    type: Array,
    default: () => []
  }
})

defineEmits(['click'])

const formatDate = (date) => {
  if (!date) return ''
  return date.split('T')[0]
}
</script>

<style scoped>
.lottery-card {
  background: #fff;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  cursor: pointer;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.lottery-name {
  color: #e63946;
  font-weight: bold;
  font-size: 1rem;
}

.lottery-issue {
  color: #999;
  font-size: 0.8rem;
}

.balls-row {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.ball {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e63946 0%, #c1121f 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1rem;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.date {
  color: #999;
  font-size: 0.8rem;
}

.arrow {
  color: #ccc;
  font-size: 1rem;
}

@media (min-width: 768px) {
  .ball {
    width: 44px;
    height: 44px;
    font-size: 1.25rem;
  }
  
  .balls-row {
    gap: 0.75rem;
  }
}
</style>