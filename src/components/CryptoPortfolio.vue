<template>
  <div class="crypto-container">
    <div class="container">
      <!-- 主仪表板 -->
      <div class="dashboard">
        <!-- 左侧菜单 -->
        <aside class="sidebar">
          <h3 class="menu-title">资产分类</h3>
          <ul class="menu-list">
            <li
              class="menu-item"
              :class="{ active: selectedFilter === 'all' }"
              @click="selectedFilter = 'all'"
            >
              <i class="fas fa-chart-pie"></i>
              <span>全部资产</span>
            </li>
            <li
              class="menu-item"
              :class="{ active: selectedFilter === 'BTC' }"
              @click="selectedFilter = 'BTC'"
            >
              <i class="fab fa-bitcoin"></i>
              <span>比特币 (BTC)</span>
            </li>
            <li
              class="menu-item"
              :class="{ active: selectedFilter === 'ETH' }"
              @click="selectedFilter = 'ETH'"
            >
              <i class="fab fa-ethereum"></i>
              <span>以太坊 (ETH)</span>
            </li>
            <li
              class="menu-item"
              :class="{ active: selectedFilter === 'SOL' }"
              @click="selectedFilter = 'SOL'"
            >
              <i class="fas fa-rocket"></i>
              <span>Solana (SOL)</span>
            </li>
            <li
              class="menu-item"
              :class="{ active: selectedFilter === 'ADA' }"
              @click="selectedFilter = 'ADA'"
            >
              <i class="fas fa-coins"></i>
              <span>Cardano (ADA)</span>
            </li>
            <li
              class="menu-item"
              :class="{ active: selectedFilter === 'DOT' }"
              @click="selectedFilter = 'DOT'"
            >
              <i class="fas fa-gem"></i>
              <span>Polkadot (DOT)</span>
            </li>
          </ul>



          <!-- 自动刷新设置 -->
          <div class="auto-refresh-section">
            <label>
              <input type="checkbox" v-model="autoRefresh" @change="toggleAutoRefresh">
              <i class="fas fa-sync"></i> 自动刷新
            </label>
            <input
              type="number"
              v-model="refreshInterval"
              min="1"
              max="1440"
              :disabled="!autoRefresh"
              placeholder="分钟"
            >
            <span>分钟</span>
          </div>
        </aside>

        <!-- 主要内容区域 -->
        <main class="main-content">
          <!-- 概览卡片 -->
          <section class="overview">
            <div class="overview-card">
              <h3><i class="fas fa-wallet"></i> 总资产价值</h3>
              <div class="value">${{ formatNumber(totalValue) }}</div>
              <div class="change" :class="getChangeClass(totalValueChange24h)">
                {{ totalValueChange24h >= 0 ? '+' : '' }}{{ totalValueChange24h.toFixed(2) }}% (24h)
              </div>
            </div>
            <div class="overview-card">
              <h3><i class="fas fa-chart-line"></i> 总盈亏</h3>
              <div class="value" :class="totalProfitLoss >= 0 ? 'positive' : 'negative'">
                {{ totalProfitLoss >= 0 ? '+' : '' }}${{ formatNumber(Math.abs(totalProfitLoss)) }}
              </div>
              <div class="change" :class="totalProfitLoss >= 0 ? 'positive' : 'negative'">
                {{ totalProfitLoss >= 0 ? '+' : '' }}{{ totalProfitLossRate.toFixed(2) }}%
              </div>
            </div>
            <div class="overview-card">
              <h3><i class="fas fa-coins"></i> 持有资产数量</h3>
              <div class="value">{{ portfolio.length }}</div>
              <div class="change">种加密货币</div>
            </div>
            <div class="overview-card">
              <h3><i class="fas fa-percent"></i> 投资回报率</h3>
              <div class="value" :class="totalROI >= 0 ? 'positive' : 'negative'">
                {{ totalROI >= 0 ? '+' : '' }}{{ totalROI.toFixed(2) }}%
              </div>
              <div class="change">累计收益</div>
            </div>
          </section>

          <!-- 图表区域 -->
          <section class="chart-section">
            <div class="chart-header">
              <h2 class="chart-title"><i class="fas fa-chart-pie"></i> 资产分布</h2>
              <div class="chart-actions">
                <select v-model="chartTimeRange" class="time-filter">
                  <option value="7d">7 天</option>
                  <option value="30d">30 天</option>
                  <option value="90d">90 天</option>
                  <option value="1y">1 年</option>
                </select>
              </div>
            </div>

            <div class="chart-container">
              <!-- 饼图 -->
              <div class="chart">
                <div class="pie-chart-wrapper">
                  <div class="pie-chart" :style="pieChartStyle"></div>
                  <div class="pie-center">
                    <span>${{ formatNumber(totalValue) }}</span>
                    <span>总资产</span>
                  </div>
                </div>
              </div>

              <!-- 图例 -->
              <div class="chart-legend">
                <div
                  v-for="(item, index) in assetAllocation"
                  :key="index"
                  class="legend-item"
                >
                  <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
                  <span>{{ item.name }} ({{ item.percentage }}%)</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 添加加密货币 -->
          <section class="add-crypto-section">
            <div class="section-header">
              <h3><i class="fas fa-plus-circle"></i> 添加加密货币</h3>
            </div>
            <div class="input-row">
              <select v-model="newCrypto.symbol">
                <option value="">选择加密货币</option>
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="BNB">Binance Coin (BNB)</option>
                <option value="XRP">Ripple (XRP)</option>
                <option value="ADA">Cardano (ADA)</option>
                <option value="SOL">Solana (SOL)</option>
                <option value="DOT">Polkadot (DOT)</option>
                <option value="DOGE">Dogecoin (DOGE)</option>
                <option value="SHIB">Shiba Inu (SHIB)</option>
                <option value="AVAX">Avalanche (AVAX)</option>
              </select>
              <input
                type="number"
                v-model.number="newCrypto.amount"
                placeholder="数量"
                min="0.00000001"
                step="0.00000001"
              >
              <input
                type="number"
                v-model.number="newCrypto.price"
                placeholder="买入价格 (USD)"
                min="0.00000001"
                step="0.00000001"
              >
              <button class="btn-add" @click="addCrypto">
                <i class="fas fa-plus"></i> 添加
              </button>
            </div>
          </section>

          <!-- 资产列表 -->
          <section class="assets-section">
            <div class="section-header">
              <h2 class="section-title"><i class="fas fa-list"></i> 资产详情</h2>
              <div class="last-update">
                <i class="fas fa-clock"></i>
                <span>最后更新：{{ lastUpdateTime }}</span>
              </div>
            </div>

            <div class="table-wrapper">
              <table class="assets-table">
                <thead>
                  <tr>
                    <th>资产</th>
                    <th>持有量</th>
                    <th>买入价格</th>
                    <th>当前价格</th>
                    <th>市值</th>
                    <th>盈亏</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(crypto, index) in filteredPortfolio"
                    :key="index"
                    class="asset-row"
                  >
                    <td>
                      <div class="asset-info">
                        <div class="asset-icon" :style="{ backgroundColor: getAssetColor(crypto.symbol) }">
                          {{ crypto.symbol.charAt(0) }}
                        </div>
                        <div>
                          <div class="asset-name">{{ getAssetName(crypto.symbol) }}</div>
                          <div class="asset-symbol">{{ crypto.symbol }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="asset-amount">{{ formatAmount(crypto.amount) }}</td>
                    <td class="asset-price">${{ formatNumber(crypto.price) }}</td>
                    <td class="asset-price">${{ formatNumber(crypto.currentPrice) }}</td>
                    <td class="asset-value">${{ formatNumber(crypto.amount * crypto.currentPrice) }}</td>
                    <td class="asset-profit" :class="{ positive: crypto.profitLoss >= 0, negative: crypto.profitLoss < 0 }">
                      <div class="profit-value">
                        {{ crypto.profitLoss >= 0 ? '+' : '' }}${{ formatNumber(Math.abs(crypto.profitLoss)) }}
                      </div>
                      <div class="profit-rate">
                        {{ crypto.profitLossRate >= 0 ? '+' : '' }}{{ crypto.profitLossRate.toFixed(2) }}%
                      </div>
                    </td>
                    <td>
                      <button class="btn-delete" @click="deleteCrypto(index)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                  <tr v-if="filteredPortfolio.length === 0">
                    <td colspan="7" class="empty-state">
                      <i class="fas fa-inbox"></i>
                      <p>暂无资产数据，请添加加密货币</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- 错误提示 -->
          <div v-if="errorMessage" class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            {{ errorMessage }}
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

const portfolio = ref([])
const newCrypto = ref({
  symbol: '',
  amount: 0,
  price: 0
})
const prices = ref({})
const refreshing = ref(false)
const lastUpdateTime = ref('')

const errorMessage = ref('')
const autoRefresh = ref(false)
const refreshInterval = ref(60)
const selectedFilter = ref('all')
const chartTimeRange = ref('90d')
let refreshTimer = null

const assetColors = {
  BTC: '#f7931a',
  ETH: '#627eea',
  BNB: '#f0b90b',
  XRP: '#0033ad',
  ADA: '#0033ad',
  SOL: '#00ffa3',
  DOT: '#e6007a',
  DOGE: '#c2a633',
  SHIB: '#ffa409',
  AVAX: '#e84142'
}

const chartColors = [
  '#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0',
  '#4ade80', '#facc15', '#f97316', '#ec4899', '#8b5cf6'
]

const assetNames = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  BNB: 'Binance Coin',
  XRP: 'Ripple',
  ADA: 'Cardano',
  SOL: 'Solana',
  DOT: 'Polkadot',
  DOGE: 'Dogecoin',
  SHIB: 'Shiba Inu',
  AVAX: 'Avalanche'
}

const loadPortfolio = () => {
  const savedPortfolio = localStorage.getItem('cryptoPortfolio')
  if (savedPortfolio) {
    portfolio.value = JSON.parse(savedPortfolio)
  }
}

const savePortfolio = () => {
  localStorage.setItem('cryptoPortfolio', JSON.stringify(portfolio.value))
}

const addCrypto = () => {
  if (!newCrypto.value.symbol) {
    errorMessage.value = '请选择加密货币'
    setTimeout(() => errorMessage.value = '', 3000)
    return
  }

  if (newCrypto.value.amount <= 0) {
    errorMessage.value = '请输入大于 0 的数量'
    setTimeout(() => errorMessage.value = '', 3000)
    return
  }

  if (newCrypto.value.price <= 0) {
    errorMessage.value = '请输入大于 0 的买入价格'
    setTimeout(() => errorMessage.value = '', 3000)
    return
  }

  portfolio.value.push({
    symbol: newCrypto.value.symbol,
    amount: newCrypto.value.amount,
    price: newCrypto.value.price,
    currentPrice: 0,
    profitLoss: 0,
    profitLossRate: 0
  })

  newCrypto.value = {
    symbol: '',
    amount: 0,
    price: 0
  }

  savePortfolio()
  refreshPrices()
}

const deleteCrypto = (index) => {
  portfolio.value.splice(index, 1)
  savePortfolio()
}

const getAssetName = (symbol) => {
  return assetNames[symbol] || symbol
}

const getAssetColor = (symbol) => {
  return assetColors[symbol] || '#667eea'
}

const formatNumber = (num) => {
  if (!num && num !== 0) return '0.00'
  return Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatAmount = (amount) => {
  if (!amount) return '0'
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  })
}

const getChangeClass = (change) => {
  if (change > 0) return 'positive'
  if (change < 0) return 'negative'
  return ''
}


const getPricesFromCoincap = async () => {
  try {
    const response = await axios.get('https://rest.coincap.io/v3/assets', {
      headers: {
        'Authorization': 'Bearer b617d9cf029dbb40f02b058a0e74919176b768cf36fd1ea6fae55a13a1610f41'
      }
    })
    const data = response.data.data

    data.forEach(item => {
      const symbol = item.symbol
      const price = parseFloat(item.priceUsd)
      prices.value[symbol] = price
    })

    console.log('Successfully fetched prices from coincap')
  } catch (error) {
    console.error('Failed to get prices from coincap:', error)
    throw error
  }
}

const refreshPrices = async () => {
  refreshing.value = true
  errorMessage.value = ''
  prices.value = {}

  try {
    await getPricesFromCoincap()
  } catch (error) {
    console.error('Failed to fetch prices:', error)
    errorMessage.value = '获取价格失败，请检查网络连接'
  }

  portfolio.value.forEach(crypto => {
    crypto.currentPrice = prices.value[crypto.symbol] || 0
    crypto.profitLoss = crypto.amount * (crypto.currentPrice - crypto.price)
    crypto.profitLossRate = ((crypto.currentPrice - crypto.price) / crypto.price) * 100
  })

  lastUpdateTime.value = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  refreshing.value = false
}

const toggleAutoRefresh = () => {
  if (autoRefresh.value) {
    refreshTimer = setInterval(() => {
      refreshPrices()
    }, refreshInterval.value * 60 * 1000)
  } else {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }
}

const totalValue = computed(() => {
  return portfolio.value.reduce((total, crypto) => {
    return total + (crypto.amount * crypto.currentPrice)
  }, 0)
})

const totalProfitLoss = computed(() => {
  return portfolio.value.reduce((total, crypto) => {
    return total + (crypto.amount * (crypto.currentPrice - crypto.price))
  }, 0)
})

const totalProfitLossRate = computed(() => {
  const totalInvestment = portfolio.value.reduce((total, crypto) => {
    return total + (crypto.amount * crypto.price)
  }, 0)

  if (totalInvestment === 0) return 0
  return (totalProfitLoss.value / totalInvestment) * 100
})

const totalROI = computed(() => {
  return totalProfitLossRate.value
})

const totalValueChange24h = computed(() => {
  return totalProfitLossRate.value / 10
})

const filteredPortfolio = computed(() => {
  if (selectedFilter.value === 'all') {
    return portfolio.value
  }
  return portfolio.value.filter(crypto => crypto.symbol === selectedFilter.value)
})

const assetAllocation = computed(() => {
  if (portfolio.value.length === 0) return []

  const total = totalValue.value
  if (total === 0) return []

  const allocation = portfolio.value.map((crypto, index) => {
    const value = crypto.amount * crypto.currentPrice
    const percentage = ((value / total) * 100).toFixed(1)
    const color = chartColors[index % chartColors.length]

    return {
      name: crypto.symbol,
      percentage: parseFloat(percentage),
      value,
      color
    }
  }).sort((a, b) => b.value - a.value)

  return allocation
})

const pieChartStyle = computed(() => {
  if (assetAllocation.value.length === 0) return {}

  let gradient = 'conic-gradient('
  let startAngle = 0

  assetAllocation.value.forEach((item, index) => {
    const endAngle = startAngle + (item.percentage * 3.6)
    gradient += `${item.color} ${startAngle}deg ${endAngle}deg`
    if (index < assetAllocation.value.length - 1) {
      gradient += ', '
    }
    startAngle = endAngle
  })

  gradient += ')'

  return {
    background: gradient
  }
})

onMounted(() => {
  loadPortfolio()
  refreshPrices()
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.crypto-container {
  min-height: calc(100vh - 120px);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 30px;
}

.sidebar {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  height: fit-content;
}

.dark .sidebar {
  background-color: #1e1e1e;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.menu-title {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.dark .menu-title {
  color: #adb5bd;
}

.menu-list {
  list-style: none;
  padding: 0;
  margin: 0 0 30px 0;
}

.menu-item {
  padding: 12px 15px;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
  color: #212529;
}

.dark .menu-item {
  color: #e9ecef;
}

.menu-item i {
  width: 20px;
  color: #6c757d;
  transition: color 0.3s ease;
}

.dark .menu-item i {
  color: #adb5bd;
}

.menu-item:hover {
  background-color: #4361ee;
  color: white;
}

.menu-item:hover i {
  color: white;
}

.menu-item.active {
  background-color: #4361ee;
  color: white;
}

.menu-item.active i {
  color: white;
}

.auto-refresh-section {
  margin-top: 20px;
  padding: 15px;
  background-color: #f0f2f5;
  border-radius: 8px;
}

.dark .auto-refresh-section {
  background-color: #2d2d2d;
}

.auto-refresh-section label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 8px;
}

.dark .auto-refresh-section label {
  color: #adb5bd;
}

.auto-refresh-section input[type="number"] {
  width: 70px;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: white;
  color: #212529;
  font-size: 14px;
  margin: 0 5px;
}

.dark .auto-refresh-section input[type="number"] {
  background-color: #1e1e1e;
  border-color: #2d2d2d;
  color: #e9ecef;
}

.auto-refresh-section input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.overview-card {
  background-color: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.dark .overview-card {
  background-color: #1e1e1e;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.overview-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.dark .overview-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.overview-card h3 {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dark .overview-card h3 {
  color: #adb5bd;
}

.overview-card h3 i {
  font-size: 16px;
}

.overview-card .value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #212529;
}

.dark .overview-card .value {
  color: #e9ecef;
}

.overview-card .change {
  font-size: 14px;
  color: #6c757d;
}

.change.positive {
  color: #2ecc71;
}

.change.negative {
  color: #e74c3c;
}

.value.positive {
  color: #2ecc71;
}

.value.negative {
  color: #e74c3c;
}

.chart-section {
  background-color: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}

.dark .chart-section {
  background-color: #1e1e1e;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.chart-title {
  font-size: 20px;
  font-weight: 600;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 10px;
}

.dark .chart-title {
  color: #e9ecef;
}

.chart-title i {
  color: #4361ee;
}

.time-filter {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: white;
  color: #212529;
  font-size: 14px;
}

.dark .time-filter {
  background-color: #2d2d2d;
  border-color: #2d2d2d;
  color: #e9ecef;
}

.chart-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.chart {
  display: flex;
  align-items: center;
  justify-content: center;
}

.pie-chart-wrapper {
  position: relative;
  width: 220px;
  height: 220px;
}

.pie-chart {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.pie-center {
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: white;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.dark .pie-center {
  background-color: #2d2d2d;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.pie-center span:first-child {
  font-weight: 700;
  font-size: 18px;
  color: #212529;
}

.dark .pie-center span:first-child {
  color: #e9ecef;
}

.pie-center span:last-child {
  font-size: 12px;
  color: #6c757d;
}

.dark .pie-center span:last-child {
  color: #adb5bd;
}

.chart-legend {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #212529;
}

.dark .legend-item {
  color: #e9ecef;
}

.legend-color {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
}

.add-crypto-section {
  background-color: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}

.dark .add-crypto-section {
  background-color: #1e1e1e;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  font-size: 18px;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dark .section-header h3 {
  color: #e9ecef;
}

.section-header h3 i {
  color: #4361ee;
}

.input-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 12px;
  align-items: end;
}

.input-row select,
.input-row input {
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  background-color: #f0f2f5;
  color: #212529;
  transition: all 0.3s ease;
}

.dark .input-row select,
.dark .input-row input {
  background-color: #2d2d2d;
  border-color: #2d2d2d;
  color: #e9ecef;
}

.input-row select:focus,
.input-row input:focus {
  outline: none;
  border-color: #4361ee;
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
}

.btn-add {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #4361ee, #3a0ca3);
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.assets-section {
  background-color: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.dark .assets-section {
  background-color: #1e1e1e;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 10px;
}

.dark .section-title {
  color: #e9ecef;
}

.section-title i {
  color: #4361ee;
}

.last-update {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6c757d;
}

.dark .last-update {
  color: #adb5bd;
}

.last-update i {
  font-size: 14px;
}

.table-wrapper {
  overflow-x: auto;
  margin-top: 20px;
}

.assets-table {
  width: 100%;
  border-collapse: collapse;
}

.assets-table th {
  text-align: left;
  padding: 16px;
  border-bottom: 2px solid #e0e0e0;
  color: #6c757d;
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dark .assets-table th {
  border-bottom-color: #2d2d2d;
  color: #adb5bd;
}

.assets-table td {
  padding: 18px 16px;
  border-bottom: 1px solid #e0e0e0;
  color: #212529;
}

.dark .assets-table td {
  border-bottom-color: #2d2d2d;
  color: #e9ecef;
}

.asset-row:hover {
  background-color: #f0f2f5;
}

.dark .asset-row:hover {
  background-color: #2d2d2d;
}

.asset-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.asset-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}

.asset-name {
  font-weight: 600;
  color: #212529;
}

.dark .asset-name {
  color: #e9ecef;
}

.asset-symbol {
  font-size: 13px;
  color: #6c757d;
}

.dark .asset-symbol {
  color: #adb5bd;
}

.asset-amount,
.asset-price,
.asset-value {
  font-weight: 500;
}

.asset-profit {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profit-value {
  font-weight: 600;
}

.profit-rate {
  font-size: 13px;
}

.asset-profit.positive .profit-value,
.asset-profit.positive .profit-rate {
  color: #2ecc71;
}

.asset-profit.negative .profit-value,
.asset-profit.negative .profit-rate {
  color: #e74c3c;
}

.btn-delete {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background-color: transparent;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dark .btn-delete {
  color: #adb5bd;
}

.btn-delete:hover {
  background-color: #e74c3c;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 60px 20px !important;
  color: #6c757d;
}

.dark .empty-state {
  color: #adb5bd;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
}

.error-message {
  margin-top: 20px;
  padding: 16px 20px;
  background-color: rgba(231, 76, 60, 0.1);
  border: 1px solid #e74c3c;
  border-radius: 8px;
  color: #e74c3c;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: slideIn 0.3s ease;
}

.dark .error-message {
  background-color: rgba(231, 76, 60, 0.2);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1200px) {
  .dashboard {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }

  .menu-list {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .menu-item {
    margin: 0;
  }

  .auto-refresh-section {
    margin: 0;
  }
}

@media (max-width: 992px) {
  .chart-container {
    grid-template-columns: 1fr;
  }

  .chart-legend {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .crypto-container {
    padding: 0;
  }

  .dashboard {
    gap: 20px;
  }

  .sidebar {
    padding: 15px;
  }

  .overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .input-row {
    grid-template-columns: 1fr;
  }

  .assets-table {
    font-size: 14px;
  }

  .assets-table th,
  .assets-table td {
    padding: 12px 8px;
  }
}

@media (max-width: 576px) {
  .overview {
    grid-template-columns: 1fr;
  }

  .overview-card {
    padding: 16px;
  }

  .overview-card .value {
    font-size: 24px;
  }

  .chart-section,
  .add-crypto-section,
  .assets-section {
    padding: 16px;
  }

  .chart-title,
  .section-title {
    font-size: 16px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .table-wrapper {
    font-size: 12px;
  }

  .assets-table th,
  .assets-table td {
    padding: 10px 6px;
    white-space: nowrap;
  }

  .asset-icon {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .asset-info {
    gap: 8px;
  }

  .asset-name {
    font-size: 13px;
  }

  .asset-symbol {
    font-size: 11px;
  }

  .profit-rate {
    font-size: 11px;
  }
}
</style>
