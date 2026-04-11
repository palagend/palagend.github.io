<template>
  <div class="crypto-container">
    <div class="container">
      <!-- 主仪表板 -->
      <div class="dashboard">
        <!-- 主要内容区域 -->
        <main class="main-content">
          <!-- 概览卡片 -->
          <section class="overview">
            <div class="overview-card">
              <h3><Icon icon="mdi:wallet" /> 总资产价值</h3>
              <div class="value">${{ formatNumber(totalValue) }}</div>
              <div class="change" :class="getChangeClass(totalValueChange24h)">
                {{ totalValueChange24h >= 0 ? '+' : '' }}{{ totalValueChange24h.toFixed(2) }}% (24h)
              </div>
            </div>
            <div class="overview-card">
              <h3><Icon icon="mdi:trending-up" /> 总盈亏</h3>
              <div class="value" :class="totalProfitLoss >= 0 ? 'positive' : 'negative'">
                {{ totalProfitLoss >= 0 ? '+' : '' }}${{ formatNumber(Math.abs(totalProfitLoss)) }}
              </div>
              <div class="change" :class="totalProfitLoss >= 0 ? 'positive' : 'negative'">
                {{ totalProfitLoss >= 0 ? '+' : '' }}{{ totalProfitLossRate.toFixed(2) }}%
              </div>
            </div>
            <div class="overview-card">
              <h3><Icon icon="mdi:coin" /> 持有资产数量</h3>
              <div class="value">{{ portfolio.length }}</div>
              <div class="change">种加密货币</div>
            </div>
            <div class="overview-card">
              <h3><Icon icon="mdi:percent" /> 投资回报率</h3>
              <div class="value" :class="totalROI >= 0 ? 'positive' : 'negative'">
                {{ totalROI >= 0 ? '+' : '' }}{{ totalROI.toFixed(2) }}%
              </div>
              <div class="change">累计收益</div>
            </div>
          </section>

          <!-- 图表区域 -->
          <section class="chart-section">
            <div class="chart-header">
              <h2 class="chart-title"><Icon icon="mdi:chart-pie" /> 资产分布</h2>
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
              <h3><Icon icon="mdi:plus-circle" /> 添加交易</h3>
            </div>
            <div class="input-row">
              <select v-model="newTrade.symbol">
                <option value="">选择加密货币</option>
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="BNB">Binance Coin (BNB)</option>
                <option value="XRP">Ripple (XRP)</option>
                <option value="ADA">Cardano (ADA)</option>
                <option value="SOL">Solana (SOL)</option>
                <option value="DOGE">Dogecoin (DOGE)</option>
                <option value="TRX">Tron (TRX)</option>
                <option value="AVAX">Avalanche (AVAX)</option>
                <option value="HYPE">Hyperliquid (HYPE)</option>
              </select>
              <select v-model="newTrade.type" class="trade-type">
                <option value="buy">买入</option>
                <option value="sell">卖出</option>
              </select>
              <input
                type="number"
                v-model.number="newTrade.amount"
                placeholder="数量"
                min="0.00000001"
                step="0.00000001"
              >
              <input
                type="number"
                v-model.number="newTrade.price"
                placeholder="价格 (USD)"
                min="0.00000001"
                step="0.00000001"
              >
              <button class="btn-add" @click="addTrade">
                <Icon icon="mdi:plus" /> 添加
              </button>
            </div>
          </section>

          <!-- 错误提示 -->
          <div v-if="errorMessage" class="error-message">
            <div class="error-content">
              <Icon icon="mdi:alert-circle" class="error-icon" />
              <div class="error-text">
                <p class="error-title">提示</p>
                <p class="error-message-text">{{ errorMessage }}</p>
              </div>
            </div>
            <button class="error-close" @click="errorMessage = ''">
              <Icon icon="mdi:close" />
            </button>
          </div>

          <!-- 资产列表 -->
          <section class="assets-section">
            <div class="section-header">
              <h2 class="section-title"><Icon icon="mdi:list" /> 资产详情</h2>
              <div class="section-actions">
                <div class="filter-group">
                  <select v-model="selectedFilter" class="filter-select">
                    <option value="all">全部资产</option>
                    <option value="BTC">Bitcoin (BTC)</option>
                    <option value="ETH">Ethereum (ETH)</option>
                    <option value="BNB">Binance Coin (BNB)</option>
                    <option value="XRP">Ripple (XRP)</option>
                    <option value="ADA">Cardano (ADA)</option>
                    <option value="SOL">Solana (SOL)</option>
                    <option value="DOGE">Dogecoin (DOGE)</option>
                    <option value="TRX">Tron (TRX)</option>
                    <option value="AVAX">Avalanche (AVAX)</option>
                    <option value="HYPE">Hyperliquid (HYPE)</option>
                  </select>
                </div>
                <button class="btn-refresh" @click="refreshPrices" :disabled="refreshing">
                  <Icon icon="mdi:refresh" :class="{ 'spin': refreshing }" />
                  <span>{{ refreshing ? '刷新中...' : '刷新价格' }}</span>
                </button>
                <div class="last-update">
                  <Icon icon="mdi:clock" />
                  <span>{{ lastUpdateTime }}</span>
                </div>
              </div>
            </div>

            <div class="table-wrapper">
              <table class="assets-table">
                <thead>
                  <tr>
                    <th>资产</th>
                    <th>持有量</th>
                    <th>成本均价</th>
                    <th>当前价格</th>
                    <th>当前市值</th>
                    <th>持仓盈亏</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="crypto in filteredPortfolio"
                    :key="crypto.id"
                    class="asset-row"
                  >
                    <td>
                      <div class="asset-info">
                        
                          <Icon width="32" height="32" :icon="getAssetIcon(crypto.symbol)" :style="{ color: getAssetColor(crypto.symbol) }" />
                        
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
                      <button class="btn-delete" @click="deleteCrypto(crypto.id)">
                        <Icon icon="mdi:trash-can" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="filteredPortfolio.length === 0">
                    <td colspan="7" class="empty-state">
                      <Icon icon="mdi:inbox" />
                      <p>暂无资产数据，请添加交易</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- 交易历史 -->
          <section class="trades-section">
            <div class="section-header">
              <h2 class="section-title"><Icon icon="mdi:history" /> 交易历史</h2>
              <div class="section-actions">
                <button class="btn-clear" @click="clearTrades" v-if="trades.length > 0">
                  <Icon icon="mdi:delete-sweep" /> 清空历史
                </button>
              </div>
            </div>

            <div class="table-wrapper">
              <table class="trades-table">
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>资产</th>
                    <th>类型</th>
                    <th>数量</th>
                    <th>价格</th>
                    <th>总金额</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="trade in trades"
                    :key="trade.id"
                    class="trade-row"
                  >
                    <td class="trade-time">{{ formatDate(trade.timestamp) }}</td>
                    <td>
                      <div class="asset-info-small">
                        <Icon width="24" height="24" :icon="getAssetIcon(trade.symbol)" :style="{ color: getAssetColor(trade.symbol) }" />
                        <span>{{ trade.symbol }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="trade-type-badge" :class="trade.type">
                        {{ trade.type === 'buy' ? '买入' : '卖出' }}
                      </span>
                    </td>
                    <td class="trade-amount">{{ formatAmount(trade.amount) }}</td>
                    <td class="trade-price">${{ formatNumber(trade.price) }}</td>
                    <td class="trade-total">${{ formatNumber(trade.amount * trade.price) }}</td>
                    <td>
                      <button class="btn-delete-small" @click="deleteTrade(trade.id)">
                        <Icon icon="mdi:close" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="trades.length === 0">
                    <td colspan="7" class="empty-state">
                      <Icon icon="mdi:clock-outline" />
                      <p>暂无交易历史</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { Icon } from '@iconify/vue'

const portfolio = ref([])
const trades = ref([])
const newTrade = ref({
  symbol: '',
  type: 'buy',
  amount: null,
  price: null
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
  DOGE: '#c2a633',
  TRX: '#eb0029',
  AVAX: '#e84142',
  HYPE: '#89F0E6'
}

const assetIcons = {
  BTC: 'cryptocurrency-color:btc',
  ETH: 'cryptocurrency-color:eth',
  BNB: 'cryptocurrency-color:bnb',
  XRP: 'cryptocurrency-color:xrp',
  ADA: 'cryptocurrency-color:ada',
  SOL: 'cryptocurrency-color:sol',
  DOGE: 'cryptocurrency-color:doge',
  TRX: 'cryptocurrency-color:trx',
  AVAX: 'cryptocurrency-color:avax',
  HYPE: 'token:hyper-evm'
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
  DOGE: 'Dogecoin',
  TRX: 'Tron',
  AVAX: 'Avalanche',
  HYPE: 'Hyperliquid'
}

const loadPortfolio = () => {
  const savedPortfolio = localStorage.getItem('cryptoPortfolio')
  const savedTrades = localStorage.getItem('cryptoTrades')
  
  if (savedPortfolio) {
    const parsed = JSON.parse(savedPortfolio)
    portfolio.value = parsed.map(item => ({
      ...item,
      id: item.id || Date.now() + Math.random()
    }))
  }
  
  if (savedTrades) {
    trades.value = JSON.parse(savedTrades)
  }
}

const savePortfolio = () => {
  localStorage.setItem('cryptoPortfolio', JSON.stringify(portfolio.value))
}

const saveTrades = () => {
  localStorage.setItem('cryptoTrades', JSON.stringify(trades.value))
}

const addTrade = () => {
  if (!newTrade.value.symbol) {
    errorMessage.value = '请选择加密货币'
    setTimeout(() => errorMessage.value = '', 3000)
    return
  }

  if (newTrade.value.amount <= 0) {
    errorMessage.value = '请输入大于 0 的数量'
    setTimeout(() => errorMessage.value = '', 3000)
    return
  }

  if (newTrade.value.price <= 0) {
    errorMessage.value = '请输入大于 0 的价格'
    setTimeout(() => errorMessage.value = '', 3000)
    return
  }

  const trade = {
    id: Date.now(),
    symbol: newTrade.value.symbol,
    type: newTrade.value.type,
    amount: newTrade.value.amount,
    price: newTrade.value.price,
    timestamp: Date.now()
  }

  trades.value.unshift(trade)
  saveTrades()

  if (newTrade.value.type === 'buy') {
    const existingIndex = portfolio.value.findIndex(crypto => crypto.symbol === newTrade.value.symbol)
    
    if (existingIndex !== -1) {
      const existing = portfolio.value[existingIndex]
      const totalAmount = existing.amount + newTrade.value.amount
      const totalCost = (existing.amount * existing.price) + (newTrade.value.amount * newTrade.value.price)
      const averagePrice = totalCost / totalAmount
      
      portfolio.value[existingIndex] = {
        ...existing,
        amount: totalAmount,
        price: averagePrice
      }
    } else {
      portfolio.value.push({
        id: Date.now(),
        symbol: newTrade.value.symbol,
        amount: newTrade.value.amount,
        price: newTrade.value.price,
        currentPrice: 0,
        profitLoss: 0,
        profitLossRate: 0
      })
    }
  } else {
    const existingIndex = portfolio.value.findIndex(crypto => crypto.symbol === newTrade.value.symbol)
    
    if (existingIndex !== -1) {
      const existing = portfolio.value[existingIndex]
      
      if (existing.amount < newTrade.value.amount) {
        errorMessage.value = '卖出数量超过持有量'
        setTimeout(() => errorMessage.value = '', 3000)
        return
      }
      
      existing.amount -= newTrade.value.amount
      
      if (existing.amount === 0) {
        portfolio.value.splice(existingIndex, 1)
      }
    }
  }

  newTrade.value = {
    symbol: '',
    type: 'buy',
    amount: null,
    price: null
  }

  savePortfolio()
  refreshPrices()
}

const deleteTrade = (id) => {
  const index = trades.value.findIndex(trade => trade.id === id)
  if (index !== -1) {
    const trade = trades.value[index]
    
    if (trade.type === 'buy') {
      const portfolioIndex = portfolio.value.findIndex(crypto => crypto.symbol === trade.symbol)
      
      if (portfolioIndex !== -1) {
        const crypto = portfolio.value[portfolioIndex]
        crypto.amount -= trade.amount
        
        if (crypto.amount <= 0) {
          portfolio.value.splice(portfolioIndex, 1)
        }
      }
    }
    
    trades.value.splice(index, 1)
    saveTrades()
    savePortfolio()
    refreshPrices()
  }
}

const deleteCrypto = (id) => {
  const index = portfolio.value.findIndex(crypto => crypto.id === id)
  if (index !== -1) {
    portfolio.value.splice(index, 1)
    savePortfolio()
  }
}

const clearTrades = () => {
  if (confirm('确定要清空所有交易历史吗？')) {
    trades.value = []
    saveTrades()
  }
}

const getAssetName = (symbol) => {
  return assetNames[symbol] || symbol
}

const getAssetColor = (symbol) => {
  return assetColors[symbol] || '#667eea'
}

const getAssetIcon = (symbol) => {
  return assetIcons[symbol] || symbol.charAt(0)
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

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
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
  display: block;
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

.overview-card h3 .iconify {
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

.chart-title .iconify {
  font-size: 20px;
}

.time-filter {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: white;
  color: #212529;
  font-size: 14px;
  cursor: pointer;
}

.dark .time-filter {
  background-color: #1e1e1e;
  border-color: #2d2d2d;
  color: #e9ecef;
}

.chart-container {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  justify-content: center;
}

.chart {
  flex: 1;
  min-width: 280px;
  max-width: 400px;
}

.pie-chart-wrapper {
  position: relative;
  width: 280px;
  height: 280px;
  margin: 0 auto;
}

.pie-chart {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.pie-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #212529;
}

.dark .pie-center {
  color: #e9ecef;
}

.pie-center span:first-child {
  display: block;
  font-size: 24px;
  font-weight: 700;
}

.pie-center span:last-child {
  display: block;
  font-size: 12px;
  color: #6c757d;
}

.dark .pie-center span:last-child {
  color: #adb5bd;
}

.chart-legend {
  flex: 1;
  min-width: 200px;
  max-width: 300px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 14px;
  color: #212529;
}

.dark .legend-item {
  color: #e9ecef;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
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
  font-weight: 600;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 10px;
}

.dark .section-header h3 {
  color: #e9ecef;
}

.section-header h3 .iconify {
  font-size: 18px;
}

.input-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}

.input-row select,
.input-row input {
  padding: 10px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: white;
  color: #212529;
  font-size: 14px;
  min-width: 120px;
}

.dark .input-row select,
.dark .input-row input {
  background-color: #1e1e1e;
  border-color: #2d2d2d;
  color: #e9ecef;
}

.input-row select:focus,
.input-row input:focus {
  outline: none;
  border-color: #4361ee;
}

.input-row .trade-type {
  min-width: 100px;
}

.btn-add {
  padding: 10px 24px;
  background-color: #4361ee;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-add:hover {
  background-color: #3a0ca3;
  transform: translateY(-1px);
}

.btn-add:active {
  transform: translateY(0);
}

.error-message {
  background-color: #fff3cd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  animation: fadeIn 0.3s ease;
}

.dark .error-message {
  background-color: #3d2e18;
}

.error-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.error-icon {
  color: #ffc107;
  flex-shrink: 0;
}

.error-title {
  font-weight: 600;
  color: #212529;
  margin-bottom: 4px;
}

.dark .error-title {
  color: #e9ecef;
}

.error-message-text {
  color: #212529;
  margin: 0;
}

.dark .error-message-text {
  color: #e9ecef;
}

.error-close {
  background: none;
  border: none;
  color: #6c757d;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.error-close:hover {
  background-color: rgba(0, 0, 0, 0.1);
  color: #dc3545;
}

.dark .error-close:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.assets-section,
.trades-section {
  background-color: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}

.dark .assets-section,
.dark .trades-section {
  background-color: #1e1e1e;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.section-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-select {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: white;
  color: #212529;
  font-size: 14px;
  cursor: pointer;
}

.dark .filter-select {
  background-color: #1e1e1e;
  border-color: #2d2d2d;
  color: #e9ecef;
}

.btn-refresh {
  padding: 8px 16px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-refresh:hover:not(:disabled) {
  background-color: #5a6268;
  transform: translateY(-1px);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-refresh.spin .iconify {
  animation: spin 1s linear infinite;
}

.last-update {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6c757d;
}

.dark .last-update {
  color: #adb5bd;
}

.table-wrapper {
  overflow-x: auto;
}

.assets-table,
.trades-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.assets-table th,
.trades-table th {
  background-color: #f8f9fa;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #212529;
  border-bottom: 2px solid #dee2e6;
}

.dark .assets-table th,
.dark .trades-table th {
  background-color: #2d2d2d;
  color: #e9ecef;
}

.assets-table td,
.trades-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #dee2e6;
  color: #212529;
}

.dark .assets-table td,
.dark .trades-table td {
  border-color: #3d3d3d;
  color: #e9ecef;
}

.assets-table tr:last-child td,
.trades-table tr:last-child td {
  border-bottom: none;
}

.assets-table tr:hover,
.trades-table tr:hover {
  background-color: #f8f9fa;
}

.dark .assets-table tr:hover,
.dark .trades-table tr:hover {
  background-color: #2d2d2d;
}

.asset-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.asset-info .iconify {
  border-radius: 50%;
  background-color: #f8f9fa;
  padding: 4px;
}

.dark .asset-info .iconify {
  background-color: #2d2d2d;
}

.asset-name {
  font-weight: 600;
  color: #212529;
}

.dark .asset-name {
  color: #e9ecef;
}

.asset-symbol {
  font-size: 12px;
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

.asset-profit .profit-value {
  font-weight: 600;
  font-size: 15px;
}

.asset-profit .profit-rate {
  font-size: 13px;
}

.asset-profit.positive .profit-value {
  color: #2ecc71;
}

.asset-profit.negative .profit-value {
  color: #e74c3c;
}

.btn-delete {
  background: none;
  border: none;
  color: #6c757d;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.btn-delete:hover {
  background-color: #e74c3c;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 40px 20px !important;
  color: #6c757d;
}

.dark .empty-state {
  color: #adb5bd;
}

.empty-state .iconify {
  display: block;
  font-size: 48px;
  margin-bottom: 12px;
  color: #dee2e6;
}

.dark .empty-state .iconify {
  color: #3d3d3d;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.trades-section {
  margin-top: 30px;
  border-top: 2px solid #f8f9fa;
}

.dark .trades-section {
  border-color: #2d2d2d;
}

.trade-row {
  transition: all 0.3s ease;
}

.trade-type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.trade-type-badge.buy {
  background-color: #d4edda;
  color: #155724;
}

.trade-type-badge.sell {
  background-color: #f8d7da;
  color: #721c24;
}

.dark .trade-type-badge.buy {
  background-color: #155724;
  color: #d4edda;
}

.dark .trade-type-badge.sell {
  background-color: #721c24;
  color: #f8d7da;
}

.trade-time {
  font-size: 13px;
  color: #6c757d;
}

.dark .trade-time {
  color: #adb5bd;
}

.asset-info-small {
  display: flex;
  align-items: center;
  gap: 8px;
}

.asset-info-small .iconify {
  border-radius: 50%;
  background-color: #f8f9fa;
  padding: 3px;
}

.dark .asset-info-small .iconify {
  background-color: #2d2d2d;
}

.asset-info-small span {
  font-weight: 500;
}

.btn-delete-small {
  background: none;
  border: none;
  color: #6c757d;
  font-size: 18px;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.btn-delete-small:hover {
  background-color: #e74c3c;
  color: white;
}

.btn-clear {
  padding: 8px 16px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-clear:hover {
  background-color: #c0392b;
  transform: translateY(-1px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }

  .overview {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .overview-card {
    padding: 16px;
  }

  .overview-card .value {
    font-size: 20px;
  }

  .overview-card h3 {
    font-size: 12px;
  }

  .chart-container {
    flex-direction: column;
    align-items: center;
  }

  .pie-chart-wrapper {
    width: 240px;
    height: 240px;
  }

  .chart-legend {
    max-width: 100%;
  }

  .input-row {
    flex-direction: column;
    align-items: stretch;
  }

  .input-row select,
  .input-row input {
    width: 100%;
    min-width: auto;
  }

  .btn-add {
    width: 100%;
    justify-content: center;
  }

  .section-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    justify-content: space-between;
  }

  .assets-table,
  .trades-table {
    font-size: 12px;
  }

  .assets-table th,
  .assets-table td,
  .trades-table th,
  .trades-table td {
    padding: 8px 12px;
  }

  .asset-info {
    gap: 8px;
  }

  .asset-info .iconify {
    width: 24px;
    height: 24px;
  }

  .asset-name {
    font-size: 13px;
  }

  .asset-symbol {
    font-size: 11px;
  }

  .btn-delete,
  .btn-delete-small {
    padding: 4px;
  }
}

@media (max-width: 480px) {
  .overview {
    grid-template-columns: 1fr;
  }

  .pie-chart-wrapper {
    width: 200px;
    height: 200px;
  }

  .pie-center span:first-child {
    font-size: 20px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .section-actions {
    width: 100%;
  }

  .btn-clear {
    width: 100%;
    justify-content: center;
  }
}
</style>
