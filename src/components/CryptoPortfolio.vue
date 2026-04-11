<template>
  <div class="crypto-container">
    <div class="container">
      <div class="dashboard">
        <main class="main-content">
          <section class="overview">
            <div class="overview-card">
              <h3><Icon icon="mdi:wallet" /> 总资产价值</h3>
              <div class="value">${{ formatNumber(totalValue) }}</div>
              <div class="change" :class="getChangeClass(totalValueChange24h)">
                {{ totalValueChange24h >= 0 ? '+' : '-' }}{{ Math.abs(totalValueChange24h).toFixed(2) }}% (24h)
              </div>
            </div>
            <div class="overview-card">
              <h3><Icon icon="mdi:trending-up" /> 浮动盈亏</h3>
              <div class="value" :class="unrealizedProfitLoss >= 0 ? 'positive' : 'negative'">
                {{ unrealizedProfitLoss >= 0 ? '+' : '-' }}${{ formatNumber(Math.abs(unrealizedProfitLoss)) }}
              </div>
              <div class="change" :class="unrealizedProfitLoss >= 0 ? 'positive' : 'negative'">
                {{ unrealizedProfitLossRate >= 0 ? '+' : '-' }}{{ Math.abs(unrealizedProfitLossRate).toFixed(2) }}%
              </div>
            </div>
            <div class="overview-card">
              <h3><Icon icon="mdi:cash-multiple" /> 实现盈亏</h3>
              <div class="value" :class="realizedProfitLoss >= 0 ? 'positive' : 'negative'">
                {{ realizedProfitLoss >= 0 ? '+' : '-' }}${{ formatNumber(Math.abs(realizedProfitLoss)) }}
              </div>
              <div class="change" :class="realizedProfitLossRate >= 0 ? 'positive' : 'negative'">
                {{ realizedProfitLossRate >= 0 ? '+' : '-' }}{{ Math.abs(realizedProfitLossRate).toFixed(2) }}%
              </div>
            </div>
            <div class="overview-card usdt-card">
              <h3><Icon icon="mdi:cash-usd" /> USDT余额</h3>
              <div class="value">${{ formatNumber(usdtBalance) }}</div>
              <button class="btn-recharge" @click="showRechargeModal = true">
                <Icon icon="mdi:plus" /> 充值
              </button>
            </div>
          </section>

          <section class="chart-section">
            <div class="chart-header">
              <h2 class="chart-title"><Icon icon="mdi:chart-pie" /> 资产分布</h2>
            </div>

            <div class="chart-container">
              <div class="chart">
                <div class="pie-chart-wrapper">
                  <div class="pie-chart" :style="pieChartStyle"></div>
                  <div class="pie-center">
                    <span>${{ formatNumber(totalValue) }}</span>
                    <span>总资产</span>
                  </div>
                </div>
              </div>

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

          <section class="add-crypto-section">
            <div class="section-header">
              <h3><Icon icon="mdi:swap-horizontal" /> 交易</h3>
            </div>
            <div class="input-row">
              <select v-model="newTrade.symbol" @change="onSymbolChange" ref="symbolSelect">
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
              <div class="input-group">
                <input
                  type="number"
                  v-model.number="newTrade.amount"
                  placeholder="数量"
                  min="0.00001"
                  step="0.00001"
                  ref="amountInput"
                >
              </div>
              <input
                type="number"
                v-model.number="newTrade.price"
                placeholder="价格 (USD)"
                min="0.00001"
                step="0.00001"
              >
              <button class="btn-add" @click="addTrade" :disabled="!isFormValid">
                <Icon icon="mdi:check" /> 确认
              </button>
            </div>
            <div class="trade-summary" v-if="newTrade.symbol && newTrade.amount && newTrade.price">
              <div class="summary-item">
                <span class="label">预计总金额：</span>
                <span class="value">${{ formatNumber(newTrade.amount * newTrade.price) }}</span>
              </div>
              <div class="summary-item" v-if="newTrade.type === 'buy'">
                <span class="label">USDT余额：</span>
                <span class="value" :class="usdtBalance >= newTrade.amount * newTrade.price ? '' : 'warning'">
                  ${{ formatNumber(usdtBalance) }}
                </span>
              </div>
              <div class="summary-item" v-if="newTrade.type === 'sell'">
                <span class="label">持有量：</span>
                <span class="value" :class="getHoldingAmount(newTrade.symbol) >= newTrade.amount ? '' : 'warning'">
                  {{ formatAmount(getHoldingAmount(newTrade.symbol)) }}
                </span>
              </div>
              <div class="summary-item" v-if="newTrade.type === 'buy' && portfolio.find(c => c.symbol === newTrade.symbol)">
                <span class="label">摊薄成本：</span>
                <span class="value" :class="getAvgCostClass(newTrade.symbol, newTrade.price)">
                  ${{ formatNumber(calculateAvgCost(newTrade.symbol, newTrade.price)) }}
                </span>
              </div>
              <div class="summary-item" v-if="newTrade.type === 'sell' && portfolio.find(c => c.symbol === newTrade.symbol)">
                <span class="label">预计实现盈亏：</span>
                <span class="value" :class="calculateEstimatedRealizedPL() >= 0 ? 'positive' : 'negative'">
                  {{ calculateEstimatedRealizedPL() >= 0 ? '+' : '-' }}${{ formatNumber(Math.abs(calculateEstimatedRealizedPL())) }}
                </span>
              </div>
            </div>
          </section>

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
                    <th>浮动盈亏</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="crypto in filteredPortfolio"
                    :key="crypto.id"
                    class="asset-row"
                    :class="{ 'selected': selectedAsset === crypto.symbol }"
                    @click="selectAsset(crypto.symbol)"
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
                        {{ crypto.profitLoss >= 0 ? '+' : '-' }}${{ formatNumber(Math.abs(crypto.profitLoss)) }}
                      </div>
                      <div class="profit-rate">
                        {{ crypto.profitLossRate >= 0 ? '+' : '-' }}{{ Math.abs(crypto.profitLossRate).toFixed(2) }}%
                      </div>
                    </td>
                    <td class="action-cell">
                      <button class="btn-action btn-sell" @click.stop="quickSell(crypto)" title="快速卖出">
                        <Icon icon="mdi:sell" />
                      </button>
                      <button class="btn-action btn-buy" @click.stop="quickBuy(crypto)" title="快速买入">
                        <Icon icon="mdi:shopping" />
                      </button>
                      <button class="btn-delete" @click.stop="deleteCrypto(crypto.id)" title="删除">
                        <Icon icon="mdi:trash-can" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="filteredPortfolio.length === 0">
                    <td colspan="7" class="empty-state">
                      <Icon icon="mdi:inbox" />
                      <p>暂无资产数据，请充值USDT后开始交易</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="trades-section">
            <div class="section-header">
              <h2 class="section-title"><Icon icon="mdi:history" /> 交易历史</h2>
              <div class="section-actions">
                <div class="protect-switch" @click="toggleProtectHistory">
                  <Icon :icon="protectHistory ? 'mdi:shield-check' : 'mdi:shield-off'" />
                  <span class="switch-label">保护</span>
                  <div class="switch" :class="{ 'on': protectHistory }">
                    <div class="switch-handle"></div>
                  </div>
                </div>
                <div class="filter-group">
                  <select v-model="tradeFilter" class="filter-select">
                    <option value="all">全部交易</option>
                    <option value="buy">买入</option>
                    <option value="sell">卖出</option>
                    <option value="recharge">充值</option>
                  </select>
                </div>
                <button class="btn-clear" @click="clearTrades" v-if="filteredTrades.length > 0 && !protectHistory">
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
                    <th>实现盈亏</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="trade in filteredTrades"
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
                        {{ getTradeTypeText(trade.type) }}
                      </span>
                    </td>
                    <td class="trade-amount">{{ formatAmount(trade.amount) }}</td>
                    <td class="trade-price">{{ trade.type === 'recharge' ? '-' : '$' + formatNumber(trade.price) }}</td>
                    <td class="trade-total">${{ formatNumber(trade.total) }}</td>
                    <td class="trade-pl" :class="{ positive: trade.realizedPL > 0, negative: trade.realizedPL < 0 }">
                      {{ trade.realizedPL !== undefined ? (trade.realizedPL >= 0 ? '+' : '-') + '$' + formatNumber(Math.abs(trade.realizedPL)) : '-' }}
                    </td>
                    <td>
                      <button v-if="!protectHistory" class="btn-delete-small" @click="deleteTrade(trade.id)">
                        <Icon icon="mdi:close" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="filteredTrades.length === 0">
                    <td colspan="8" class="empty-state">
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

    <div v-if="showRechargeModal" class="modal-overlay" @click.self="showRechargeModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3><Icon icon="mdi:cash-plus" /> USDT充值</h3>
          <button class="modal-close" @click="showRechargeModal = false">
            <Icon icon="mdi:close" />
          </button>
        </div>
        <div class="modal-body">
          <div class="input-group">
            <label>充值金额 (USDT)</label>
            <input
              type="number"
              v-model.number="rechargeAmount"
              placeholder="请输入充值金额"
              min="0.01"
              step="0.01"
              @keyup.enter="rechargeUSDT"
            >
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showRechargeModal = false">取消</button>
          <button class="btn-confirm" @click="rechargeUSDT" :disabled="!rechargeAmount || rechargeAmount <= 0">
            确认充值
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import axios from 'axios'
import { Icon } from '@iconify/vue'

const portfolio = ref([])
const trades = ref([])
const realizedProfitLoss = ref(0)
const newTrade = ref({
  symbol: '',
  type: 'buy',
  amount: null,
  price: null
})
const tradeFilter = ref('all')
const prices = ref({})
const priceChanges24h = ref({})
const refreshing = ref(false)
const lastUpdateTime = ref('')
const errorMessage = ref('')
const autoRefresh = ref(false)
const refreshInterval = ref(60)
const selectedFilter = ref('all')
const selectedAsset = ref(null)
const symbolSelect = ref(null)
const amountInput = ref(null)
const showRechargeModal = ref(false)
const rechargeAmount = ref(null)
const protectHistory = ref(false)
let refreshTimer = null

const assetColors = {
  USDT: '#26a17b',
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
  USDT: 'cryptocurrency-color:usdt',
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
  '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e',
  '#fb7185', '#fda4af', '#fca5a5', '#f87171', '#fb923c'
]

const assetNames = {
  USDT: 'Tether',
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
  const savedRealizedPL = localStorage.getItem('cryptoRealizedPL')
  const savedProtectHistory = localStorage.getItem('cryptoProtectHistory')
  
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

  if (savedRealizedPL) {
    realizedProfitLoss.value = parseFloat(savedRealizedPL)
  }

  if (savedProtectHistory) {
    protectHistory.value = JSON.parse(savedProtectHistory)
  }
}

const savePortfolio = () => {
  localStorage.setItem('cryptoPortfolio', JSON.stringify(portfolio.value))
}

const saveTrades = () => {
  localStorage.setItem('cryptoTrades', JSON.stringify(trades.value))
}

const saveRealizedPL = () => {
  localStorage.setItem('cryptoRealizedPL', realizedProfitLoss.value.toString())
}

const saveProtectHistory = () => {
  localStorage.setItem('cryptoProtectHistory', JSON.stringify(protectHistory.value))
}

const toggleProtectHistory = () => {
  protectHistory.value = !protectHistory.value
  saveProtectHistory()
}

const usdtBalance = computed(() => {
  const usdt = portfolio.value.find(c => c.symbol === 'USDT')
  return usdt ? usdt.amount : 0
})

const onSymbolChange = () => {
  if (newTrade.value.symbol && prices.value[newTrade.value.symbol]) {
    newTrade.value.price = prices.value[newTrade.value.symbol]
  }
  nextTick(() => {
    if (amountInput.value) {
      amountInput.value.focus()
    }
  })
}

const isFormValid = computed(() => {
  return newTrade.value.symbol && 
         newTrade.value.amount && 
         newTrade.value.amount > 0 && 
         newTrade.value.price && 
         newTrade.value.price > 0
})

const getHoldingAmount = (symbol) => {
  const asset = portfolio.value.find(c => c.symbol === symbol)
  return asset ? asset.amount : 0
}

const calculateAvgCost = (symbol, newPrice) => {
  const existing = portfolio.value.find(c => c.symbol === symbol)
  if (!existing) return newPrice
  
  const totalAmount = existing.amount + newTrade.value.amount
  const totalCost = (existing.amount * existing.price) + (newTrade.value.amount * newPrice)
  return totalCost / totalAmount
}

const getAvgCostClass = (symbol, newPrice) => {
  const existing = portfolio.value.find(c => c.symbol === symbol)
  if (!existing) return ''
  
  const avgCost = calculateAvgCost(symbol, newPrice)
  if (newPrice < existing.price) return 'better'
  if (newPrice > existing.price) return 'worse'
  return ''
}

const calculateEstimatedRealizedPL = () => {
  if (newTrade.value.type !== 'sell') return 0
  const existing = portfolio.value.find(c => c.symbol === newTrade.value.symbol)
  if (!existing) return 0
  return (newTrade.value.price - existing.price) * newTrade.value.amount
}

const getTradeTypeText = (type) => {
  const map = {
    buy: '买入',
    sell: '卖出',
    recharge: '充值'
  }
  return map[type] || type
}

const rechargeUSDT = () => {
  if (!rechargeAmount.value || rechargeAmount.value <= 0) {
    errorMessage.value = '请输入有效的充值金额'
    setTimeout(() => errorMessage.value = '', 3000)
    return
  }

  const trade = {
    id: Date.now(),
    symbol: 'USDT',
    type: 'recharge',
    amount: rechargeAmount.value,
    price: 1,
    total: rechargeAmount.value,
    timestamp: Date.now()
  }

  trades.value.unshift(trade)

  const existingIndex = portfolio.value.findIndex(c => c.symbol === 'USDT')
  if (existingIndex !== -1) {
    portfolio.value[existingIndex].amount += rechargeAmount.value
  } else {
    portfolio.value.push({
      id: Date.now(),
      symbol: 'USDT',
      amount: rechargeAmount.value,
      price: 1,
      currentPrice: 1,
      profitLoss: 0,
      profitLossRate: 0
    })
  }

  saveTrades()
  savePortfolio()

  rechargeAmount.value = null
  showRechargeModal.value = false
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

  const totalAmount = newTrade.value.amount * newTrade.value.price
  let realizedPL = 0

  if (newTrade.value.type === 'buy') {
    const usdtIndex = portfolio.value.findIndex(c => c.symbol === 'USDT')
    if (usdtIndex === -1 || portfolio.value[usdtIndex].amount < totalAmount) {
      errorMessage.value = 'USDT余额不足，请先充值'
      setTimeout(() => errorMessage.value = '', 3000)
      return
    }

    portfolio.value[usdtIndex].amount -= totalAmount
    if (portfolio.value[usdtIndex].amount === 0) {
      portfolio.value.splice(usdtIndex, 1)
    }

    const existingIndex = portfolio.value.findIndex(crypto => crypto.symbol === newTrade.value.symbol)
    
    if (existingIndex !== -1) {
      const existing = portfolio.value[existingIndex]
      const totalAmountHeld = existing.amount + newTrade.value.amount
      const totalCost = (existing.amount * existing.price) + (newTrade.value.amount * newTrade.value.price)
      const averagePrice = totalCost / totalAmountHeld
      
      portfolio.value[existingIndex] = {
        ...existing,
        amount: totalAmountHeld,
        price: averagePrice
      }
    } else {
      portfolio.value.push({
        id: Date.now(),
        symbol: newTrade.value.symbol,
        amount: newTrade.value.amount,
        price: newTrade.value.price,
        currentPrice: prices.value[newTrade.value.symbol] || 0,
        profitLoss: 0,
        profitLossRate: 0
      })
    }
  } else {
    const existingIndex = portfolio.value.findIndex(crypto => crypto.symbol === newTrade.value.symbol)
    
    if (existingIndex === -1) {
      errorMessage.value = '未持有该资产'
      setTimeout(() => errorMessage.value = '', 3000)
      return
    }

    const existing = portfolio.value[existingIndex]
    
    if (existing.amount < newTrade.value.amount) {
      errorMessage.value = '卖出数量超过持有量'
      setTimeout(() => errorMessage.value = '', 3000)
      return
    }

    realizedPL = (newTrade.value.price - existing.price) * newTrade.value.amount
    realizedProfitLoss.value += realizedPL

    existing.amount -= newTrade.value.amount
    
    if (existing.amount === 0) {
      portfolio.value.splice(existingIndex, 1)
    }

    const usdtIndex = portfolio.value.findIndex(c => c.symbol === 'USDT')
    if (usdtIndex !== -1) {
      portfolio.value[usdtIndex].amount += totalAmount
    } else {
      portfolio.value.push({
        id: Date.now(),
        symbol: 'USDT',
        amount: totalAmount,
        price: 1,
        currentPrice: 1,
        profitLoss: 0,
        profitLossRate: 0
      })
    }
  }

  const trade = {
    id: Date.now(),
    symbol: newTrade.value.symbol,
    type: newTrade.value.type,
    amount: newTrade.value.amount,
    price: newTrade.value.price,
    total: totalAmount,
    realizedPL: newTrade.value.type === 'sell' ? realizedPL : undefined,
    timestamp: Date.now()
  }

  trades.value.unshift(trade)
  saveTrades()
  savePortfolio()
  saveRealizedPL()
  refreshPrices()

  newTrade.value = {
    symbol: '',
    type: 'buy',
    amount: null,
    price: null
  }
}

const deleteTrade = (id) => {
  if (protectHistory.value) {
    errorMessage.value = '保护开关已开启，禁止删除交易历史'
    setTimeout(() => errorMessage.value = '', 3000)
    return
  }
  if (!confirm('确认删除该交易？该操作将同步更新资产详情中的持仓量和成本价。')) {
    return
  }
  
  const index = trades.value.findIndex(trade => trade.id === id)
  if (index !== -1) {
    const trade = trades.value[index]
    
    if (trade.type === 'buy') {
      const usdtIndex = portfolio.value.findIndex(c => c.symbol === 'USDT')
      if (usdtIndex !== -1) {
        portfolio.value[usdtIndex].amount += trade.total
      } else {
        portfolio.value.push({
          id: Date.now(),
          symbol: 'USDT',
          amount: trade.total,
          price: 1,
          currentPrice: 1,
          profitLoss: 0,
          profitLossRate: 0
        })
      }

      const portfolioIndex = portfolio.value.findIndex(crypto => crypto.symbol === trade.symbol)
      
      if (portfolioIndex !== -1) {
        const crypto = portfolio.value[portfolioIndex]
        crypto.amount -= trade.amount
        
        if (crypto.amount <= 0) {
          portfolio.value.splice(portfolioIndex, 1)
        } else {
          recalculateCostBasis(trade.symbol)
        }
      }
    } else if (trade.type === 'sell') {
      if (trade.realizedPL !== undefined) {
        realizedProfitLoss.value -= trade.realizedPL
      }

      const usdtIndex = portfolio.value.findIndex(c => c.symbol === 'USDT')
      if (usdtIndex !== -1) {
        portfolio.value[usdtIndex].amount -= trade.total
        if (portfolio.value[usdtIndex].amount <= 0) {
          portfolio.value.splice(usdtIndex, 1)
        }
      }

      const portfolioIndex = portfolio.value.findIndex(crypto => crypto.symbol === trade.symbol)
      
      if (portfolioIndex !== -1) {
        const crypto = portfolio.value[portfolioIndex]
        crypto.amount += trade.amount
      } else {
        portfolio.value.push({
          id: Date.now(),
          symbol: trade.symbol,
          amount: trade.amount,
          price: trade.price,
          currentPrice: prices.value[trade.symbol] || 0,
          profitLoss: 0,
          profitLossRate: 0
        })
        recalculateCostBasis(trade.symbol)
      }
    } else if (trade.type === 'recharge') {
      const usdtIndex = portfolio.value.findIndex(c => c.symbol === 'USDT')
      if (usdtIndex !== -1) {
        portfolio.value[usdtIndex].amount -= trade.amount
        if (portfolio.value[usdtIndex].amount <= 0) {
          portfolio.value.splice(usdtIndex, 1)
        }
      }
    }
    
    trades.value.splice(index, 1)
    saveTrades()
    savePortfolio()
    saveRealizedPL()
    refreshPrices()
  }
}

const recalculateCostBasis = (symbol) => {
  const symbolTrades = trades.value
    .filter(t => (t.symbol === symbol && t.type === 'buy') || (t.symbol === 'USDT' && t.type === 'recharge'))
    .sort((a, b) => a.timestamp - b.timestamp)
  
  let totalAmount = 0
  let totalCost = 0
  
  symbolTrades.forEach(trade => {
    if (trade.type === 'buy') {
      totalAmount += trade.amount
      totalCost += trade.amount * trade.price
    }
  })

  const existingIndex = portfolio.value.findIndex(c => c.symbol === symbol)
  if (existingIndex !== -1 && totalAmount > 0) {
    portfolio.value[existingIndex].price = totalCost / totalAmount
  }
}

const deleteCrypto = (id) => {
  if (!confirm('确认删除该资产？这不会删除相关交易记录。')) {
    return
  }
  const index = portfolio.value.findIndex(crypto => crypto.id === id)
  if (index !== -1) {
    portfolio.value.splice(index, 1)
    savePortfolio()
  }
}

const clearTrades = () => {
  if (protectHistory.value) {
    errorMessage.value = '保护开关已开启，禁止删除交易历史'
    setTimeout(() => errorMessage.value = '', 3000)
    return
  }
  if (confirm('确认清空所有交易历史？此操作将重置所有数据。')) {
    trades.value = []
    portfolio.value = []
    realizedProfitLoss.value = 0
    saveTrades()
    savePortfolio()
    saveRealizedPL()
  }
}

const selectAsset = (symbol) => {
  selectedAsset.value = selectedAsset.value === symbol ? null : symbol
  if (selectedAsset.value) {
    selectedFilter.value = symbol
  }
}

const quickSell = (crypto) => {
  newTrade.value.symbol = crypto.symbol
  newTrade.value.type = 'sell'
  newTrade.value.amount = crypto.amount
  newTrade.value.price = crypto.currentPrice || crypto.price
}

const quickBuy = (crypto) => {
  newTrade.value.symbol = crypto.symbol
  newTrade.value.type = 'buy'
  newTrade.value.price = crypto.currentPrice || crypto.price
  nextTick(() => {
    if (amountInput.value) {
      amountInput.value.focus()
    }
  })
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
  if (!num && num !== 0) return '0.0000'
  return Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  })
}

const formatAmount = (amount) => {
  if (!amount) return '0.0000'
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
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
      const change24h = parseFloat(item.changePercent24Hr) || 0
      prices.value[symbol] = price
      priceChanges24h.value[symbol] = change24h
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
    if (crypto.symbol === 'USDT') {
      crypto.currentPrice = 1
      crypto.profitLoss = 0
      crypto.profitLossRate = 0
    } else {
      crypto.currentPrice = prices.value[crypto.symbol] || crypto.currentPrice || 0
      crypto.profitLoss = crypto.amount * (crypto.currentPrice - crypto.price)
      crypto.profitLossRate = crypto.price > 0 ? ((crypto.currentPrice - crypto.price) / crypto.price) * 100 : 0
    }
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
    return total + (crypto.amount * (crypto.currentPrice || crypto.price))
  }, 0)
})

const unrealizedProfitLoss = computed(() => {
  return portfolio.value.reduce((total, crypto) => {
    if (crypto.symbol === 'USDT') return total
    return total + (crypto.amount * ((crypto.currentPrice || crypto.price) - crypto.price))
  }, 0)
})

const unrealizedProfitLossRate = computed(() => {
  const totalInvestment = portfolio.value.reduce((total, crypto) => {
    if (crypto.symbol === 'USDT') return total
    return total + (crypto.amount * crypto.price)
  }, 0)

  if (totalInvestment === 0) return 0
  return (unrealizedProfitLoss.value / totalInvestment) * 100
})

const realizedProfitLossRate = computed(() => {
  const totalInvestment = portfolio.value.reduce((total, crypto) => {
    if (crypto.symbol === 'USDT') return total
    return total + (crypto.amount * crypto.price)
  }, 0)

  if (totalInvestment === 0) return 0
  return (realizedProfitLoss.value / totalInvestment) * 100
})

const totalValueChange24h = computed(() => {
  let currentTotalValue = 0
  let value24hAgo = 0

  portfolio.value.forEach(crypto => {
    if (crypto.symbol === 'USDT') return

    const currentPrice = crypto.currentPrice || crypto.price
    const currentValue = crypto.amount * currentPrice
    currentTotalValue += currentValue

    const change24h = priceChanges24h.value[crypto.symbol] || 0
    const price24hAgo = currentPrice / (1 + change24h / 100)
    const value24hAgoForAsset = crypto.amount * price24hAgo
    value24hAgo += value24hAgoForAsset
  })

  if (value24hAgo === 0) return 0

  return ((currentTotalValue - value24hAgo) / value24hAgo) * 100
})

const filteredPortfolio = computed(() => {
  const nonUSDT = portfolio.value.filter(c => c.symbol !== 'USDT')
  if (selectedFilter.value === 'all') {
    return nonUSDT
  }
  return nonUSDT.filter(crypto => crypto.symbol === selectedFilter.value)
})

const filteredTrades = computed(() => {
  if (tradeFilter.value === 'all') {
    return trades.value
  }
  return trades.value.filter(trade => trade.type === tradeFilter.value)
})

const assetAllocation = computed(() => {
  if (portfolio.value.length === 0) return []

  const total = totalValue.value
  if (total === 0) return []

  const allocation = portfolio.value.map((crypto, index) => {
    const value = crypto.amount * (crypto.currentPrice || crypto.price)
    const percentage = ((value / total) * 100).toFixed(1)
    const color = assetColors[crypto.symbol] || chartColors[index % chartColors.length]

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
  color: #00c853;
  font-weight: 600;
}

.change.negative {
  color: #ff1744;
  font-weight: 600;
}

.value.positive {
  color: #00c853;
  font-weight: 600;
}

.value.negative {
  color: #ff1744;
  font-weight: 600;
}

.dark .change.positive,
.dark .value.positive {
  color: #69f0ae;
}

.dark .change.negative,
.dark .value.negative {
  color: #ff5252;
}

.usdt-card {
  position: relative;
}

.btn-recharge {
  position: absolute;
  bottom: 24px;
  right: 24px;
  padding: 8px 16px;
  background-color: #26a17b;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.btn-recharge:hover {
  background-color: #1e8462;
  transform: translateY(-1px);
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
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 10px;
}

.dark .chart-title {
  color: #f1f5f9;
}

.chart-title .iconify {
  font-size: 20px;
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
  color: #1e293b;
}

.dark .pie-center {
  color: #f1f5f9;
}

.pie-center span:first-child {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.dark .pie-center span:first-child {
  color: #f1f5f9;
}

.pie-center span:last-child {
  display: block;
  font-size: 12px;
  color: #64748b;
}

.dark .pie-center span:last-child {
  color: #94a3b8;
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
  color: #1e293b;
}

.dark .legend-item {
  color: #f1f5f9;
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

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-group input {
  flex: 1;
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

.btn-add:hover:not(:disabled) {
  background-color: #3a0ca3;
  transform: translateY(-1px);
}

.btn-add:active:not(:disabled) {
  transform: translateY(0);
}

.btn-add:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  background-color: #4361ee;
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
  background-color: #3a0ca3;
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

.asset-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.asset-row.selected {
  background-color: #eef2ff;
}

.dark .asset-row.selected {
  background-color: #2a2d4e;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.protect-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: #f8f9fa;
  transition: all 0.3s ease;
  user-select: none;
}

.dark .protect-switch {
  background-color: #2d2d2d;
}

.protect-switch:hover {
  background-color: #e9ecef;
}

.dark .protect-switch:hover {
  background-color: #3d3d3d;
}

.switch-label {
  font-size: 13px;
  font-weight: 500;
  color: #495057;
}

.dark .switch-label {
  color: #adb5bd;
}

.switch {
  position: relative;
  width: 40px;
  height: 22px;
  background-color: #adb5bd;
  border-radius: 11px;
  transition: all 0.3s ease;
}

.switch.on {
  background-color: #26a17b;
}

.switch-handle {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background-color: white;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.switch.on .switch-handle {
  transform: translateX(18px);
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
  color: #00c853;
  font-weight: 700;
}

.asset-profit.negative .profit-value {
  color: #ff1744;
  font-weight: 700;
}

.asset-profit.positive .profit-rate {
  color: #00c853;
  font-weight: 600;
}

.asset-profit.negative .profit-rate {
  color: #ff1744;
  font-weight: 600;
}

.dark .asset-profit.positive .profit-value {
  color: #69f0ae;
}

.dark .asset-profit.negative .profit-value {
  color: #ff5252;
}

.dark .asset-profit.positive .profit-rate {
  color: #69f0ae;
}

.dark .asset-profit.negative .profit-rate {
  color: #ff5252;
}

.action-cell {
  display: flex;
  gap: 8px;
}

.btn-action {
  background: none;
  border: none;
  color: #4361ee;
  font-size: 18px;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.btn-action:hover {
  background-color: rgba(67, 97, 238, 0.1);
}

.btn-sell {
  color: #e74c3c;
}

.btn-sell:hover {
  background-color: rgba(231, 76, 60, 0.1);
}

.btn-delete {
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.btn-delete:hover {
  background-color: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
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

.trade-type-badge.recharge {
  background-color: #d1ecf1;
  color: #0c5460;
}

.dark .trade-type-badge.buy {
  background-color: #155724;
  color: #d4edda;
}

.dark .trade-type-badge.sell {
  background-color: #721c24;
  color: #f8d7da;
}

.dark .trade-type-badge.recharge {
  background-color: #0c5460;
  color: #d1ecf1;
}

.trade-pl {
  font-weight: 600;
}

.trade-pl.positive {
  color: #00c853;
}

.trade-pl.negative {
  color: #ff1744;
}

.dark .trade-pl.positive {
  color: #69f0ae;
}

.dark .trade-pl.negative {
  color: #ff5252;
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
  color: #e74c3c;
  font-size: 18px;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.btn-delete-small:hover {
  background-color: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
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

.trade-summary {
  margin-top: 12px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.dark .trade-summary {
  background-color: #2d2d2d;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.summary-item .label {
  color: #6c757d;
}

.dark .summary-item .label {
  color: #adb5bd;
}

.summary-item .value {
  font-weight: 600;
  color: #212529;
}

.dark .summary-item .value {
  color: #e9ecef;
}

.summary-item .value.better {
  color: #2ecc71;
}

.summary-item .value.worse {
  color: #e74c3c;
}

.summary-item .value.warning {
  color: #ff9800;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.dark .modal {
  background-color: #1e1e1e;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.dark .modal-header {
  border-color: #3d3d3d;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #212529;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dark .modal-header h3 {
  color: #e9ecef;
}

.modal-close {
  background: none;
  border: none;
  color: #6c757d;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background-color: rgba(0, 0, 0, 0.1);
  color: #e74c3c;
}

.dark .modal-close:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.modal-body {
  padding: 20px;
}

.modal-body .input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-body label {
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
}

.dark .modal-body label {
  color: #adb5bd;
}

.modal-body input {
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
}

.dark .modal-body input {
  background-color: #1e1e1e;
  border-color: #2d2d2d;
  color: #e9ecef;
}

.modal-body input:focus {
  outline: none;
  border-color: #4361ee;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e9ecef;
  justify-content: flex-end;
}

.dark .modal-footer {
  border-color: #3d3d3d;
}

.btn-cancel {
  padding: 10px 24px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background-color: #5a6268;
}

.btn-confirm {
  padding: 10px 24px;
  background-color: #26a17b;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-confirm:hover:not(:disabled) {
  background-color: #1e8462;
  transform: translateY(-1px);
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
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
    gap: 8px;
  }

  .protect-switch {
    justify-content: space-between;
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

  .trade-summary {
    padding: 8px;
    gap: 12px;
  }

  .summary-item {
    flex: 1;
    min-width: 120px;
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

  .btn-recharge {
    position: static;
    margin-top: 12px;
    width: 100%;
    justify-content: center;
  }
}
</style>
