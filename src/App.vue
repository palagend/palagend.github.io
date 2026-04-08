<template>
  <div class="app-container">
    <nav class="navbar">
      <div class="nav-brand">
        <h1>🧰 工具集合</h1>
      </div>
      <div class="nav-menu">
        <router-link to="/" class="nav-link" active-class="active">首页</router-link>
        <router-link to="/exchange-rate" class="nav-link" active-class="active">汇率查询</router-link>
        <router-link to="/calculator" class="nav-link" active-class="active">计算器</router-link>
        <router-link to="/crypto-portfolio" class="nav-link" active-class="active">加密货币追踪</router-link>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.nav-brand h1 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.nav-menu {
  display: flex;
  gap: 30px;
}

.nav-link {
  text-decoration: none;
  color: #666;
  font-size: 16px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.nav-link.active {
  color: #667eea;
  background: rgba(102, 126, 234, 0.2);
}

.main-content {
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
