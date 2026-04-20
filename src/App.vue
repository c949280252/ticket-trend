<template>
  <div id="app">
    <header class="header">
      <div class="container">
        <h1 @click="$router.push('/')">查彩网</h1>
        <nav>
          <router-link to="/">首页</router-link>
        </nav>
      </div>
    </header>
    <main class="main">
      <router-view />
    </main>
    <footer class="footer">
      <p>彩票数据仅供参考，以官方公告为准</p>
    </footer>
  </div>
</template>

<script setup>
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 1rem 0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  cursor: pointer;
}

.header nav a {
  color: #fff;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.3s;
}

.header nav a:hover {
  background: rgba(255,255,255,0.1);
}

.main {
  min-height: calc(100vh - 120px);
}

.footer {
  background: #f5f5f5;
  padding: 1rem;
  text-align: center;
  color: #666;
  font-size: 0.875rem;
}
</style>