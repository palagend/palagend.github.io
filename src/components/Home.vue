<template>
  <div class="home-container">
    <div class="hero-section">
      <h2>欢迎使用工具集合</h2>
      <p>高效、便捷的实用工具平台</p>
    </div>
    
    <div class="tools-grid">
      <router-link to="/exchange-rate" class="tool-card">
        <div class="tool-icon">💱</div>
        <div class="tool-title">实时汇率查询</div>
        <div class="tool-description">
          支持11种主要货币之间的汇率换算，附带损耗计算功能
        </div>
      </router-link>
      
      <router-link to="/calculator" class="tool-card">
        <div class="tool-icon">🧮</div>
        <div class="tool-title">实用计算器</div>
        <div class="tool-description">
          日常数值计算与单位转换，支持多种计算模式
        </div>
      </router-link>
      
      <router-link to="/crypto-portfolio" class="tool-card">
        <div class="tool-icon">💰</div>
        <div class="tool-title">加密货币追踪</div>
        <div class="tool-description">
          实时追踪加密货币投资组合，查看盈亏情况
        </div>
      </router-link>
      
      <div class="tool-card disabled">
        <div class="tool-icon">🚀</div>
        <div class="tool-title">即将上线</div>
        <div class="tool-description">
          持续更新更多实用功能，提升工作效率
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.hero-section {
  text-align: center;
  margin-bottom: 60px;
  color: white;
}

.hero-section h2 {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 20px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.hero-section p {
  font-size: 20px;
  opacity: 0.9;
  margin-bottom: 0;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.tool-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 40px 30px;
  text-decoration: none;
  color: #333;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.tool-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
}

.tool-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tool-card.disabled:hover {
  transform: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.tool-icon {
  font-size: 64px;
  margin-bottom: 20px;
  text-align: center;
}

.tool-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 15px;
  text-align: center;
  color: #667eea;
}

.tool-description {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  text-align: center;
}
</style>
