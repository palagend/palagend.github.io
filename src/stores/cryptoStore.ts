import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

// ==================== 类型定义 ====================

export type TradeType = 'buy' | 'sell' | 'recharge'

export interface Trade {
  id: number
  symbol: string
  type: TradeType
  amount: number
  price: number
  total: number
  realizedPL?: number
  timestamp: number
}

export interface Holding {
  id: number
  symbol: string
  amount: number
  price: number
  currentPrice: number
  profitLoss: number
  profitLossRate: number
  // 组件兼容属性
  avg_cost: number
  current_price: number
  market_value: number
  cost: number
  realized_pl: number
  realized_pl_rate: number
}

// ==================== 常量配置 ====================

const STORAGE_KEY = 'crypto_trades'

export const ASSET_CONFIG = {
  COLORS: {
    USDT: '#26a17b', BTC: '#f7931a', ETH: '#627eea', BNB: '#f0b90b',
    XRP: '#0033ad', ADA: '#0033ad', SOL: '#00ffa3', DOGE: '#c2a633',
    TRX: '#eb0029', AVAX: '#e84142', HYPE: '#89F0E6'
  },
  ICONS: {
    USDT: 'cryptocurrency-color:usdt', BTC: 'cryptocurrency-color:btc',
    ETH: 'cryptocurrency-color:eth', BNB: 'cryptocurrency-color:bnb',
    XRP: 'cryptocurrency-color:xrp', ADA: 'cryptocurrency-color:ada',
    SOL: 'cryptocurrency-color:sol', DOGE: 'cryptocurrency-color:doge',
    TRX: 'cryptocurrency-color:trx', AVAX: 'cryptocurrency-color:avax',
    HYPE: 'token:hyper-evm'
  },
  NAMES: {
    USDT: 'Tether', BTC: 'Bitcoin', ETH: 'Ethereum', BNB: 'Binance Coin',
    XRP: 'Ripple', ADA: 'Cardano', SOL: 'Solana', DOGE: 'Dogecoin',
    TRX: 'Tron', AVAX: 'Avalanche', HYPE: 'Hyperliquid'
  }
}

// ==================== Store ====================

export const useCryptoStore = defineStore('crypto', () => {
  // State
  const trades = ref<Trade[]>([])
  const prices = ref<Record<string, number>>({})
  const priceChanges24h = ref<Record<string, number>>({})
  const protectHistory = ref(false)
  const lastUpdateTime = ref('')
  const refreshing = ref(false)
  const errorMessage = ref('')

  // 从 localStorage 加载
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const data = JSON.parse(saved)
      trades.value = data.trades || []
      protectHistory.value = data.protectHistory || false
    } catch {
      trades.value = []
    }
  }

  // 保存到 localStorage
  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      trades: trades.value,
      protectHistory: protectHistory.value
    }))
  }

  // ==================== Computed ====================

  // 所有持仓（核心计算）
  const holdings = computed<Holding[]>(() => {
    const map = new Map<string, { amount: number; cost: number }>()

    // 按时间顺序处理交易
    const sorted = [...trades.value].sort((a, b) => a.timestamp - b.timestamp)

    for (const t of sorted) {
      if (t.type === 'recharge') {
        const cur = map.get('USDT') || { amount: 0, cost: 0 }
        map.set('USDT', { amount: cur.amount + t.amount, cost: cur.cost + t.total })
      } else if (t.type === 'buy') {
        const cur = map.get(t.symbol) || { amount: 0, cost: 0 }
        map.set(t.symbol, { amount: cur.amount + t.amount, cost: cur.cost + t.total })
        // 扣除 USDT
        const usdt = map.get('USDT') || { amount: 0, cost: 0 }
        map.set('USDT', { amount: usdt.amount - t.total, cost: usdt.cost })
      } else if (t.type === 'sell') {
        const cur = map.get(t.symbol)
        if (cur && cur.amount > 0) {
          const ratio = t.amount / cur.amount
          map.set(t.symbol, {
            amount: cur.amount - t.amount,
            cost: cur.cost - cur.cost * ratio
          })
        }
        // 增加 USDT
        const usdt = map.get('USDT') || { amount: 0, cost: 0 }
        map.set('USDT', { amount: usdt.amount + t.total, cost: usdt.cost })
      }
    }

    // 转换为 Holding 数组
    const result: Holding[] = []
    map.forEach((data, symbol) => {
      if (data.amount <= 0) return

      const currentPrice = prices.value[symbol] || (symbol === 'USDT' ? 1 : 0)
      const avgCost = data.cost / data.amount
      const marketValue = data.amount * currentPrice
      const unrealizedPL = marketValue - data.cost
      const unrealizedPLRate = data.cost > 0 ? (unrealizedPL / data.cost) * 100 : 0

      // 计算实现盈亏
      let realizedPL = 0
      for (const t of trades.value) {
        if (t.type === 'sell' && t.symbol === symbol && t.realizedPL) {
          realizedPL += t.realizedPL
        }
      }

      result.push({
        id: Date.now() + Math.random(),
        symbol,
        amount: data.amount,
        price: avgCost,
        currentPrice,
        profitLoss: unrealizedPL,
        profitLossRate: unrealizedPLRate,
        avg_cost: avgCost,
        current_price: currentPrice,
        market_value: marketValue,
        cost: data.cost,
        realized_pl: realizedPL,
        realized_pl_rate: data.cost > 0 ? (realizedPL / data.cost) * 100 : 0
      })
    })

    return result
  })

  // 非 USDT 持仓
  const cryptoHoldings = computed(() => holdings.value.filter(h => h.symbol !== 'USDT'))

  // USDT 余额
  const usdtBalance = computed(() => holdings.value.find(h => h.symbol === 'USDT')?.amount || 0)

  // 加密资产市值
  const cryptoMarketValue = computed(() =>
    cryptoHoldings.value.reduce((sum, h) => sum + h.market_value, 0)
  )

  // 总成本
  const totalCost = computed(() =>
    cryptoHoldings.value.reduce((sum, h) => sum + h.cost, 0)
  )

  // 浮动盈亏
  const totalUnrealizedPL = computed(() =>
    cryptoHoldings.value.reduce((sum, h) => sum + h.profitLoss, 0)
  )

  // 浮动盈亏率
  const unrealizedPLRate = computed(() =>
    totalCost.value > 0 ? (totalUnrealizedPL.value / totalCost.value) * 100 : 0
  )

  // 实现盈亏
  const totalRealizedPL = computed(() =>
    cryptoHoldings.value.reduce((sum, h) => sum + h.realized_pl, 0)
  )

  // 实现盈亏率
  const realizedPLRate = computed(() => {
    const investment = trades.value
      .filter(t => t.type === 'buy')
      .reduce((sum, t) => sum + t.total, 0)
    return investment > 0 ? (totalRealizedPL.value / investment) * 100 : 0
  })

  // 总盈亏
  const totalProfitLoss = computed(() => totalUnrealizedPL.value + totalRealizedPL.value)

  // 24小时变化率
  const totalValueChange24h = computed(() => {
    let before = 0, after = 0
    for (const h of cryptoHoldings.value) {
      const change = priceChanges24h.value[h.symbol] || 0
      const priceBefore = h.currentPrice / (1 + change / 100)
      before += h.amount * priceBefore
      after += h.amount * h.currentPrice
    }
    return before > 0 ? ((after - before) / before) * 100 : 0
  })

  // ==================== Actions ====================

  // 获取价格
  async function fetchPrices(): Promise<boolean> {
    if (refreshing.value) return false
    refreshing.value = true
    errorMessage.value = ''

    try {
      const res = await axios.get('https://rest.coincap.io/v3/assets', {
        headers: {
          'Authorization': 'Bearer b617d9cf029dbb40f02b058a0e74919176b768cf36fd1ea6fae55a13a1610f41'
        }
      })

      for (const item of res.data.data) {
        prices.value[item.symbol] = parseFloat(item.priceUsd)
        priceChanges24h.value[item.symbol] = parseFloat(item.changePercent24Hr) || 0
      }

      lastUpdateTime.value = new Date(res.data.timestamp).toLocaleString('zh-CN')
      return true
    } catch {
      errorMessage.value = '获取价格失败'
      return false
    } finally {
      refreshing.value = false
    }
  }

  // 创建交易
  async function createTrade(data: { symbol: string; type: string; amount: number; price: number }) {
    const { symbol, type, amount, price } = data
    const total = amount * price

    if (type === 'buy') {
      if (usdtBalance.value < total) {
        return { success: false, error: 'USDT余额不足' }
      }
      trades.value.unshift({
        id: Date.now(), symbol, type: 'buy', amount, price, total, timestamp: Date.now()
      })
    } else if (type === 'sell') {
      const holding = holdings.value.find(h => h.symbol === symbol)
      if (!holding || holding.amount < amount) {
        return { success: false, error: '持仓不足' }
      }
      const realizedPL = (price - holding.price) * amount
      trades.value.unshift({
        id: Date.now(), symbol, type: 'sell', amount, price, total,
        realizedPL, timestamp: Date.now()
      })
    } else if (type === 'recharge') {
      trades.value.unshift({
        id: Date.now(), symbol: 'USDT', type: 'recharge', amount, price: 1,
        total: amount, timestamp: Date.now()
      })
    }

    save()
    return { success: true }
  }

  // 删除交易
  function deleteTrade(id: number) {
    if (protectHistory.value) return { success: false, error: '保护开关已开启' }
    const idx = trades.value.findIndex(t => t.id === id)
    if (idx === -1) return { success: false, error: '交易不存在' }
    trades.value.splice(idx, 1)
    save()
    return { success: true }
  }

  // 清空数据
  function clearAllData() {
    if (protectHistory.value) return { success: false, error: '保护开关已开启' }
    trades.value = []
    save()
    return { success: true }
  }

  // 导出数据
  function exportData() {
    return {
      version: '2.0',
      exportTime: new Date().toISOString(),
      trades: trades.value,
      protectHistory: protectHistory.value
    }
  }

  // 导入数据
  function importData(data: any) {
    if (!data.trades?.length) return { success: false, error: '无效数据' }
    trades.value = data.trades
    if (data.protectHistory !== undefined) protectHistory.value = data.protectHistory
    save()
    return { success: true }
  }

  // 切换保护开关
  function toggleProtectHistory() {
    protectHistory.value = !protectHistory.value
    save()
  }

  // ==================== 兼容方法 ====================

  const fetchDashboard = async () => {
    const success = await fetchPrices()
    return { success, updatedAt: lastUpdateTime.value }
  }

  const fetchAssetPrice = async (symbol: string) => {
    if (!prices.value[symbol]) await fetchPrices()
    return { success: !!prices.value[symbol], price: prices.value[symbol] || 0 }
  }

  const clearAllTrades = clearAllData

  const importPreview = async (data: any) => ({
    success: true,
    preview: { total_trades: data.trades?.length || 0, new_trades: data.trades?.length || 0, conflicts: 0, conflict_items: [] }
  })

  const importConfirm = async (data: any) => {
    const result = importData(data)
    return result.success
      ? { success: true, imported: data.trades.length, skipped: 0, overwritten: 0 }
      : { success: false, error: result.error }
  }

  // ==================== Return ====================

  return {
    // State
    trades, prices, protectHistory, lastUpdateTime, refreshing, errorMessage,

    // Computed
    holdings, cryptoHoldings, usdtBalance, cryptoMarketValue,
    totalUnrealizedPL, unrealizedPLRate, totalRealizedPL, realizedPLRate,
    totalProfitLoss, totalValueChange24h, totalCost,

    // Actions
    fetchPrices, createTrade, deleteTrade, clearAllData,
    exportData, importData, toggleProtectHistory,

    // 兼容方法
    fetchDashboard, fetchAssetPrice, clearAllTrades, importPreview, importConfirm
  }
})
