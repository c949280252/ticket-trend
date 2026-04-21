<template>
  <header class="app-header">
    <div class="header-content">
      <h1 class="site-title">{{ title }}</h1>
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '88开奖网'
  }
})
</script>

<style scoped>
.app-header {
  background: linear-gradient(135deg, #1a56a8 0%, #2569c9 100%);
  padding: 0.75rem 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.site-title {
  color: #fff;
  font-size: 1.25rem;
  font-weight: bold;
  margin: 0;
}
</style>