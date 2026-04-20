<template>
  <div id="app">
    <header class="header">
      <div class="container">
        <h1 @click="$router.push('/')">查彩网</h1>
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

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f5f5f5;
  color: #333;
  line-height: 1.6;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header .container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  text-align: center;
}

.header h1 {
  font-size: 1.25rem;
  cursor: pointer;
  margin: 0;
}

.main {
  flex: 1;
  padding: 1rem 0;
}

.footer {
  background: #f0f0f0;
  padding: 1rem;
  text-align: center;
  color: #666;
  font-size: 0.75rem;
}
</style>