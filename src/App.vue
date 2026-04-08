<template>
  <div id="app" :class="{ dark: isDark }">
    <nav class="navbar">
      <div class="nav-container">
        <router-link to="/" class="nav-logo">
          🧰 工具集合
        </router-link>
        <ul class="nav-menu">
          <li class="nav-item">
            <router-link to="/" class="nav-link">首页</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/exchange-rate" class="nav-link">汇率查询</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/calculator" class="nav-link">计算器</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/crypto-portfolio" class="nav-link">加密货币投资组合</router-link>
          </li>
        </ul>
        <button class="theme-toggle" @click="toggleTheme">
          {{ isDark ? '☀️' : '🌙' }}
        </button>
      </div>
    </nav>
    <div class="container">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isDark = ref(false)

// 从本地存储加载主题
const loadTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
    document.documentElement.classList.toggle('dark', isDark.value)
  }
}

// 切换主题
const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// 组件加载时调用
onMounted(() => {
  loadTheme()
})
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
  transition: background 0.3s ease, color 0.3s ease;
}

#app {
  min-height: 100vh;
}

.navbar {
  background: #667eea;
  padding: 1rem 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: background 0.3s ease;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo {
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  text-decoration: none;
}

.nav-menu {
  list-style: none;
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: #e0e0e0;
}

.theme-toggle {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.3);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* 深色主题 */
.dark body {
  background: #1a1a1a;
  color: #f5f5f5;
}

.dark .navbar {
  background: #2c3e50;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: 1rem;
  }
  
  .nav-menu {
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }
  
  .container {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .nav-menu {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  
  .nav-link {
    font-size: 0.9rem;
  }
}
</style>
