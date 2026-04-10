<template>
  <div id="app" :class="{ dark: isDark }">
    <nav class="navbar">
      <div class="nav-container">
        <router-link to="/" class="nav-logo">
          <Icon icon="fa7-solid:tools" />
          <span>工具集合</span>
        </router-link>
        <ul class="nav-menu">
          <li class="nav-item">
            <router-link to="/" class="nav-link">
              <Icon icon="fa7-solid:home" />
              <span>首页</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/exchange-rate" class="nav-link">
              <Icon icon="fa7-solid:exchange-alt" />
              <span>汇率查询</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/calculator" class="nav-link">
              <Icon icon="fa7-solid:calculator" />
              <span>计算器</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/crypto-portfolio" class="nav-link">
              <Icon icon="fa7-solid:wallet" />
              <span>加密资产组合</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/qrcode-generator" class="nav-link">
              <Icon icon="fa7-solid:qrcode" />
              <span>二维码生成器</span>
            </router-link>
          </li>
        </ul>
        <div class="nav-toggle" @click="toggleMenu">
          <span class="hamburger"></span>
        </div>
        <div class="theme-toggle" @click="toggleTheme">
          <Icon icon="fa7-solid:sun" />
          <Icon icon="fa7-solid:moon" />
          <div class="toggle-circle"></div>
        </div>
      </div>
    </nav>
    <div class="container">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

const isDark = ref(false)

const loadTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
    document.documentElement.classList.toggle('dark', isDark.value)
  }
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
  const navMenu = document.querySelector('.nav-menu')
  if (navMenu) {
    navMenu.classList.toggle('open', isMenuOpen.value)
  }
}

onMounted(() => {
  loadTheme()
})
</script>

<style>
:root {
  --card-bg: rgba(255, 255, 255, 0.98);
  --shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  --border-color: rgba(0, 0, 0, 0.08);
  --text-primary: #212529;
  --text-secondary: #6c757d;
  --text-muted: #adb5bd;
  --primary-color: #4361ee;
  --secondary-color: #7209b7;
  --input-bg: #ffffff;
  --btn-secondary-bg: #f8f9fa;
  --result-bg: #f8f9fa;
  --success-color: #28a745;
  --loss-bg: rgba(245, 87, 108, 0.08);
  --loss-border: rgba(245, 87, 108, 0.2);
}

.dark {
  --card-bg: rgba(30, 30, 30, 0.98);
  --shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  --border-color: rgba(255, 255, 255, 0.12);
  --text-primary: #e9ecef;
  --text-secondary: #adb5bd;
  --text-muted: #6c757d;
  --primary-color: #4a90e2;
  --secondary-color: #7b68ee;
  --input-bg: #2d2d2d;
  --btn-secondary-bg: #3d3d3d;
  --result-bg: #2d2d2d;
  --success-color: #3ddc84;
  --loss-bg: rgba(245, 87, 108, 0.15);
  --loss-border: rgba(245, 87, 108, 0.3);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f0f2f5;
  color: #212529;
  transition: background 0.3s ease, color 0.3s ease;
}

#app {
  min-height: 100vh;
}

.navbar {
  background: #4361ee;
  padding: 1rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: background 0.3s ease;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo {
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-logo svg {
  width: 1.3rem;
  height: 1.3rem;
}

.nav-logo span {
  color: white;
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
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
}

.nav-link svg {
  width: 1rem;
  height: 1rem;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.theme-toggle {
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
  width: 50px;
  height: 28px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}

.theme-toggle svg {
  width: 12px;
  height: 12px;
  z-index: 1;
  color: white;
}

.theme-toggle .toggle-circle {
  position: absolute;
  left: 3px;
  width: 22px;
  height: 22px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.dark .theme-toggle .toggle-circle {
  transform: translateX(22px);
}

.dark .theme-toggle i {
  color: white;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.dark body {
  background: #121212;
  color: #e9ecef;
}

.dark .navbar {
  background: #1e1e1e;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.dark .nav-link {
  color: rgba(255, 255, 255, 0.85);
}

.dark .nav-link:hover,
.dark .nav-link.router-link-active {
  color: white;
}

.nav-toggle {
  display: none;
  flex-direction: column;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.3s ease;
}

.nav-toggle:hover {
  background: rgba(255, 255, 255, 0.15);
}

.hamburger {
  width: 24px;
  height: 2px;
  background-color: white;
  position: relative;
  transition: all 0.3s ease;
}

.hamburger::before,
.hamburger::after {
  content: '';
  position: absolute;
  width: 24px;
  height: 2px;
  background-color: white;
  transition: all 0.3s ease;
}

.hamburger::before {
  top: -8px;
}

.hamburger::after {
  top: 8px;
}

.nav-menu.open {
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 1rem 0;
  z-index: 100;
}

.dark .nav-menu.open {
  background: rgba(30, 30, 30, 0.98);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.nav-menu.open .nav-item {
  width: 100%;
  text-align: center;
}

.nav-menu.open .nav-link {
  width: 100%;
  justify-content: center;
}

@media (min-width: 993px) {
  .nav-menu {
    display: flex;
  }

  .nav-menu.open {
    display: flex;
    position: static;
    box-shadow: none;
    padding: 0;
  }

  .nav-menu.open .nav-item {
    width: auto;
  }

  .nav-menu.open .nav-link {
    width: auto;
  }

  .nav-toggle {
    display: none;
  }
}

@media (max-width: 576px) {
  .nav-menu:not(.open) {
    display: none;
  }
}

@media (min-width: 577px) and (max-width: 992px) {
  .nav-menu {
    display: none;
  }

  .nav-menu.open {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 1rem 0;
    z-index: 100;
  }

  .dark .nav-menu.open {
    background: rgba(30, 30, 30, 0.98);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .nav-menu.open .nav-item {
    width: 100%;
    text-align: center;
  }

  .nav-menu.open .nav-link {
    width: 100%;
    justify-content: center;
  }

  .nav-toggle {
    display: flex;
  }
}

@media (max-width: 992px) {
  .nav-container {
    flex-direction: column;
    gap: 1rem;
    padding: 0 1rem;
  }

  .nav-logo {
    font-size: 1.3rem;
  }

  .nav-menu {
    display: none;
  }

  .nav-menu.open {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 1rem 0;
    z-index: 100;
  }

  .dark .nav-menu.open {
    background: rgba(30, 30, 30, 0.98);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .nav-menu.open .nav-item {
    width: 100%;
    text-align: center;
  }

  .nav-menu.open .nav-link {
    width: 100%;
    justify-content: center;
  }

  .nav-link {
    padding: 0.5rem 0.8rem;
    font-size: 0.9rem;
  }

  .nav-link span {
    display: none;
  }

  .container {
    padding: 1rem;
  }
}

@media (min-width: 993px) {
  .nav-toggle {
    display: none;
  }
}

@media (max-width: 576px) {
  .navbar {
    padding: 0.8rem 0;
  }

  .nav-logo {
    font-size: 1.1rem;
  }

  .nav-logo span {
    display: inline;
  }

  .nav-menu {
    gap: 0.3rem;
  }

  .nav-link i {
    font-size: 1.1rem;
  }

  .theme-toggle {
    width: 44px;
    height: 26px;
  }

  .theme-toggle .toggle-circle {
    width: 20px;
    height: 20px;
  }

  .dark .theme-toggle .toggle-circle {
    transform: translateX(18px);
  }

  .nav-toggle {
    display: none;
    flex-direction: column;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    transition: background 0.3s ease;
  }

  .nav-toggle:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .hamburger {
    width: 24px;
    height: 2px;
    background-color: white;
    position: relative;
    transition: all 0.3s ease;
  }

  .hamburger::before,
  .hamburger::after {
    content: '';
    position: absolute;
    width: 24px;
    height: 2px;
    background-color: white;
    transition: all 0.3s ease;
  }

  .hamburger::before {
    top: -8px;
  }

  .hamburger::after {
    top: 8px;
  }

  .nav-menu.open {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 1rem 0;
    z-index: 100;
  }

  .dark .nav-menu.open {
    background: rgba(30, 30, 30, 0.98);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .nav-menu.open .nav-item {
    width: 100%;
    text-align: center;
  }

  .nav-menu.open .nav-link {
    width: 100%;
    justify-content: center;
  }

  .nav-menu:not(.open) {
    display: none;
  }

  @media (min-width: 577px) {
    .nav-menu.open {
      display: flex;
      position: static;
      box-shadow: none;
      padding: 0;
    }

    .nav-menu.open .nav-item {
      width: auto;
    }

    .nav-menu.open .nav-link {
      width: auto;
    }

    .nav-toggle {
      display: none;
    }
  }

  .container {
    padding: 0.8rem;
  }
}
</style>
