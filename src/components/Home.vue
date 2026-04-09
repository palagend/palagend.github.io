<template>
  <div class="home-container">
    <div class="hero-section">
      <h2 class="hero-title">
        <Icon icon="fa7-solid:tools" />
        <span>欢迎使用工具集合</span>
      </h2>
      <p class="hero-subtitle">高效、便捷的实用工具平台</p>
    </div>

    <div class="tools-grid">
      <router-link to="/exchange-rate" class="tool-card">
        <div class="tool-icon">
          <Icon icon="fa7-solid:exchange-alt" />
        </div>
        <div class="tool-title">实时汇率查询</div>
        <div class="tool-description">
          支持11种主要货币之间的汇率换算，附带损耗计算功能
        </div>
        <div class="tool-arrow">
          <Icon icon="fa7-solid:arrow-right" />
        </div>
      </router-link>

      <router-link to="/calculator" class="tool-card">
        <div class="tool-icon">
          <Icon icon="fa7-solid:calculator" />
        </div>
        <div class="tool-title">实用计算器</div>
        <div class="tool-description">
          日常数值计算与单位转换，支持多种计算模式
        </div>
        <div class="tool-arrow">
          <Icon icon="fa7-solid:arrow-right" />
        </div>
      </router-link>

      <router-link to="/crypto-portfolio" class="tool-card">
        <div class="tool-icon">
          <Icon icon="fa7-solid:wallet" />
        </div>
        <div class="tool-title">加密货币追踪</div>
        <div class="tool-description">
          实时追踪加密货币投资组合，查看盈亏情况
        </div>
        <div class="tool-arrow">
          <Icon icon="fa7-solid:arrow-right" />
        </div>
      </router-link>

      <div class="tool-card disabled">
        <div class="tool-icon">
          <Icon icon="fa7-solid:rocket" />
        </div>
        <div class="tool-title">即将上线</div>
        <div class="tool-description">
          持续更新更多实用功能，提升工作效率
        </div>
        <div class="tool-badge">
          <Icon icon="fa7-solid:clock" />
          <span>敬请期待</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.hero-section {
  text-align: center;
  margin-bottom: 50px;
  color: var(--text-primary);
}

.hero-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.hero-title svg {
  color: var(--primary-color);
  width: 48px;
  height: 48px;
}

.hero-subtitle {
  font-size: 18px;
  color: var(--text-secondary);
  margin-bottom: 0;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.tool-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 32px 28px;
  text-decoration: none;
  color: var(--text-primary);
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.tool-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.tool-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.tool-card:hover::before {
  opacity: 1;
}

.tool-card:hover .tool-arrow {
  transform: translateX(4px);
  opacity: 1;
}

.tool-card.disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.tool-card.disabled:hover {
  transform: none;
  box-shadow: var(--shadow);
}

.tool-icon {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  box-shadow: 0 8px 24px rgba(67, 97, 238, 0.25);
}

.tool-icon svg {
  width: 32px;
  height: 32px;
  color: white;
}

.tool-card.disabled .tool-icon {
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
  box-shadow: 0 8px 24px rgba(149, 165, 166, 0.25);
}

.tool-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.tool-description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
}

.tool-arrow {
  position: absolute;
  bottom: 28px;
  right: 28px;
  color: var(--primary-color);
}

.tool-arrow svg {
  width: 18px;
  height: 18px;
}

.tool-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--result-bg);
  border-radius: 20px;
  font-size: 12px;
  color: var(--text-muted);
}

.tool-badge svg {
  width: 12px;
  height: 12px;
}

@media (max-width: 768px) {
  .home-container {
    padding: 30px 16px;
  }

  .hero-section {
    margin-bottom: 36px;
  }

  .hero-title {
    font-size: 28px;
    gap: 10px;
    flex-direction: column;
  }

  .hero-title i {
    font-size: 36px;
  }

  .hero-subtitle {
    font-size: 15px;
  }

  .tools-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .tool-card {
    padding: 24px 20px;
  }

  .tool-icon {
    width: 60px;
    height: 60px;
    margin-bottom: 16px;
  }

  .tool-icon i {
    font-size: 26px;
  }

  .tool-title {
    font-size: 18px;
  }

  .tool-description {
    font-size: 13px;
  }

  .tool-arrow {
    display: none;
  }
}
</style>
