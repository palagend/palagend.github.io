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
  price: number // 成本价（平均成本）
  currentPrice: number
  profitLoss: number
  profitLossRate: number
  // 兼容属性（用于 CryptoPortfolio 组件）
  avg_cost: number
  current_price: number
  market_value: number
  cost: number
  realized_pl: number
  realized_pl_rate: number
}

export interface AssetMetrics {
  symbol: string
  amount: number
  cost: number // 当前成本
  costPrice: number // 成本价
  currentPrice: number
  marketValue: number // 市值
  unrealizedPL: number // 浮动盈亏
  unrealizedPLRate: number // 浮动盈亏率
  realizedPL: number // 实现盈亏
}

// ==================== 常量配置 ====================

const STORAGE_KEYS = {
  TRADES: 'cryptoTrades',
  PROTECT_HISTORY: 'cryptoProtectHistory'
}

export const ASSET_CONFIG: { COLORS: Record<string, string>; ICONS: Record<string, string>; NAMES: Record<string, string> } = {
  COLORS: {
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
  },
  ICONS: {
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
  },
  NAMES: {
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
}

export const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e',
  '#fb7185', '#fda4af', '#fca5a5', '#f87171', '#fb923c'
]

// ==================== Store 定义 ====================

export const useCryptoStore = defineStore('crypto', () => {
  // ==================== State ====================
  const trades = ref<Trade[]>([])
  const prices = ref<Record<string, number>>({})
  const priceChanges24h = ref<Record<string, number>>({})
  const protectHistory = ref(false)
  const lastUpdateTime = ref('')
  const refreshing = ref(false)
  const errorMessage = ref('')

  // ==================== Getters (Computed) ====================

  /**
   * 根据交易记录计算所有持仓
   * 按照calculations.md文档的加权平均法计算成本
   */
  const holdings = computed((): Holding[] => {
    const holdingsMap = new Map<string, { amount: number; cost: number }>()

    // 按时间顺序遍历交易记录
    const sortedTrades = [...trades.value].sort((a, b) => a.timestamp - b.timestamp)

    for (const trade of sortedTrades) {
      if (trade.type === 'recharge') {
        // 充值USDT
        const current = holdingsMap.get('USDT') || { amount: 0, cost: 0 }
        holdingsMap.set('USDT', {
          amount: current.amount + trade.amount,
          cost: current.cost + trade.total
        })
      } else if (trade.type === 'buy') {
        // 买入：累加持仓和成本
        const current = holdingsMap.get(trade.symbol) || { amount: 0, cost: 0 }
        holdingsMap.set(trade.symbol, {
          amount: current.amount + trade.amount,
          cost: current.cost + trade.total
        })

        // 扣除USDT
        const usdt = holdingsMap.get('USDT') || { amount: 0, cost: 0 }
        holdingsMap.set('USDT', {
          amount: usdt.amount - trade.total,
          cost: usdt.cost // USDT成本不变
        })
      } else if (trade.type === 'sell') {
        // 卖出：按比例回收成本
        const current = holdingsMap.get(trade.symbol)
        if (current && current.amount > 0) {
          const sellRatio = trade.amount / current.amount
          const recoveredCost = current.cost * sellRatio

          holdingsMap.set(trade.symbol, {
            amount: current.amount - trade.amount,
            cost: current.cost - recoveredCost
          })
        }

        // 增加USDT
        const usdt = holdingsMap.get('USDT') || { amount: 0, cost: 0 }
        holdingsMap.set('USDT', {
          amount: usdt.amount + trade.total,
          cost: usdt.cost
        })
      }
    }

    // 转换为Holding数组（添加兼容属性）
    const result: any[] = []
    holdingsMap.forEach((data, symbol) => {
      if (data.amount > 0) {
        const currentPrice = prices.value[symbol] || (symbol === 'USDT' ? 1 : 0)
        const costPrice = data.amount > 0 ? data.cost / data.amount : 0
        const marketValue = data.amount * currentPrice
        const unrealizedPL = marketValue - data.cost
        const unrealizedPLRate = data.cost > 0 ? (unrealizedPL / data.cost) * 100 : 0

        // 计算该资产的实现盈亏
        let realizedPL = 0
        trades.value.forEach(trade => {
          if (trade.type === 'sell' && trade.symbol === symbol && trade.realizedPL !== undefined) {
            realizedPL += trade.realizedPL
          }
        })
        const realizedPLRate = data.cost > 0 ? (realizedPL / data.cost) * 100 : 0

        result.push({
          id: symbol === 'USDT' ? 0 : Date.now() + Math.random(),
          symbol,
          amount: data.amount,
          price: costPrice,
          currentPrice,
          profitLoss: unrealizedPL,
          profitLossRate: unrealizedPLRate,
          // 兼容属性（用于 CryptoPortfolio 组件）
          avg_cost: costPrice,
          current_price: currentPrice,
          market_value: marketValue,
          cost: data.cost,
          realized_pl: realizedPL,
          realized_pl_rate: realizedPLRate
        })
      }
    })

    return result
  })

  /**
   * 获取非USDT持仓
   */
  const cryptoHoldings = computed(() => {
    return holdings.value.filter(h => h.symbol !== 'USDT')
  })

  /**
   * USDT余额
   */
  const usdtBalance = computed(() => {
    const usdt = holdings.value.find(h => h.symbol === 'USDT')
    return usdt ? usdt.amount : 0
  })

  /**
   * 计算各资产的实现盈亏
   */
  const realizedPLBySymbol = computed((): Record<string, number> => {
    const result: Record<string, number> = {}

    trades.value.forEach(trade => {
      if (trade.type === 'sell' && trade.realizedPL !== undefined) {
        result[trade.symbol] = (result[trade.symbol] || 0) + trade.realizedPL
      }
    })

    return result
  })

  /**
   * 总实现盈亏
   */
  const totalRealizedPL = computed(() => {
    return Object.values(realizedPLBySymbol.value).reduce((sum, pl) => sum + pl, 0)
  })

  /**
   * 总浮动盈亏
   */
  const totalUnrealizedPL = computed(() => {
    return cryptoHoldings.value.reduce((sum, h) => sum + h.profitLoss, 0)
  })

  /**
   * 总成本（所有加密资产的历史总投入）
   */
  const totalCost = computed(() => {
    return cryptoHoldings.value.reduce((sum, h) => {
      const cost = h.amount * h.price
      return sum + cost
    }, 0)
  })

  /**
   * 加密资产总市值
   */
  const cryptoMarketValue = computed(() => {
    return cryptoHoldings.value.reduce((sum, h) => sum + h.amount * h.currentPrice, 0)
  })

  /**
   * 总资产价值（加密资产 + USDT）
   */
  const totalValue = computed(() => {
    return cryptoMarketValue.value + usdtBalance.value
  })

  /**
   * 浮动盈亏率
   */
  const unrealizedPLRate = computed(() => {
    return totalCost.value > 0 ? (totalUnrealizedPL.value / totalCost.value) * 100 : 0
  })

  /**
   * 实现盈亏率（相对于历史总投入）
   */
  const realizedPLRate = computed(() => {
    // 计算历史总投入
    let totalInvestment = 0
    trades.value.forEach(trade => {
      if (trade.type === 'buy') {
        totalInvestment += trade.total
      }
    })
    return totalInvestment > 0 ? (totalRealizedPL.value / totalInvestment) * 100 : 0
  })

  /**
   * 总盈亏
   */
  const totalProfitLoss = computed(() => {
    return totalUnrealizedPL.value + totalRealizedPL.value
  })

  /**
   * 24小时价值变化率（市值加权平均）
   */
  const totalValueChange24h = computed(() => {
    let value24hAgo = 0
    let currentValue = 0

    cryptoHoldings.value.forEach(h => {
      const change24h = priceChanges24h.value[h.symbol] || 0
      const price24hAgo = h.currentPrice / (1 + change24h / 100)
      value24hAgo += h.amount * price24hAgo
      currentValue += h.amount * h.currentPrice
    })

    return value24hAgo > 0 ? ((currentValue - value24hAgo) / value24hAgo) * 100 : 0
  })

  /**
   * 资产分布（用于饼图）
   */
  const assetAllocation = computed(() => {
    const total = totalValue.value
    if (total === 0) return []

    const allocation = holdings.value.map((h, index) => {
      const value = h.amount * h.currentPrice
      const percentage = ((value / total) * 100).toFixed(1)
      const color = ASSET_CONFIG.COLORS[h.symbol] || CHART_COLORS[index % CHART_COLORS.length]

      return {
        name: h.symbol,
        percentage: parseFloat(percentage),
        value,
        color
      }
    }).sort((a, b) => b.value - a.value)

    return allocation
  })

  /**
   * 获取特定资产的持仓量
   */
  function getHoldingAmount(symbol: string): number {
    const holding = holdings.value.find(h => h.symbol === symbol)
    return holding ? holding.amount : 0
  }

  /**
   * 获取特定资产的成本价
   */
  function getCostPrice(symbol: string): number {
    const holding = holdings.value.find(h => h.symbol === symbol)
    return holding ? holding.price : 0
  }

  /**
   * 计算预计平均成本（用于买入预览）
   */
  function calculateEstimatedAvgCost(symbol: string, newAmount: number, newPrice: number): number {
    const current = holdings.value.find(h => h.symbol === symbol)
    if (!current) return newPrice

    const totalAmount = current.amount + newAmount
    const totalCost = current.amount * current.price + newAmount * newPrice
    return totalAmount > 0 ? totalCost / totalAmount : 0
  }

  /**
   * 计算预计实现盈亏（用于卖出预览）
   */
  function calculateEstimatedRealizedPL(symbol: string, amount: number, price: number): number {
    const current = holdings.value.find(h => h.symbol === symbol)
    if (!current || current.amount === 0) return 0

    return (price - current.price) * amount
  }

  // ==================== Actions ====================

  /**
   * 从localStorage加载数据
   */
  function loadFromStorage() {
    const savedTrades = localStorage.getItem(STORAGE_KEYS.TRADES)
    const savedProtectHistory = localStorage.getItem(STORAGE_KEYS.PROTECT_HISTORY)

    if (savedTrades) {
      try {
        trades.value = JSON.parse(savedTrades)
      } catch (e) {
        console.error('Failed to parse trades from localStorage:', e)
        trades.value = []
      }
    }

    if (savedProtectHistory) {
      try {
        protectHistory.value = JSON.parse(savedProtectHistory)
      } catch (e) {
        protectHistory.value = false
      }
    }
  }

  /**
   * 保存数据到localStorage
   */
  function saveToStorage() {
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades.value))
    localStorage.setItem(STORAGE_KEYS.PROTECT_HISTORY, JSON.stringify(protectHistory.value))
  }

  /**
   * 切换保护开关
   */
  function toggleProtectHistory() {
    protectHistory.value = !protectHistory.value
    saveToStorage()
  }

  /**
   * 充值USDT
   */
  function rechargeUSDT(amount: number): boolean {
    if (!amount || amount <= 0) {
      errorMessage.value = '请输入有效的充值金额'
      return false
    }

    const trade: Trade = {
      id: Date.now(),
      symbol: 'USDT',
      type: 'recharge',
      amount,
      price: 1,
      total: amount,
      timestamp: Date.now()
    }

    trades.value.unshift(trade)
    saveToStorage()
    return true
  }

  /**
   * 执行买入交易
   */
  function executeBuy(symbol: string, amount: number, price: number): { success: boolean; error?: string } {
    const total = amount * price

    // 检查USDT余额
    if (usdtBalance.value < total) {
      return { success: false, error: 'USDT余额不足，请先充值' }
    }

    const trade: Trade = {
      id: Date.now(),
      symbol,
      type: 'buy',
      amount,
      price,
      total,
      timestamp: Date.now()
    }

    trades.value.unshift(trade)
    saveToStorage()
    return { success: true }
  }

  /**
   * 执行卖出交易
   */
  function executeSell(symbol: string, amount: number, price: number): { success: boolean; error?: string; realizedPL?: number } {
    const holding = holdings.value.find(h => h.symbol === symbol)

    if (!holding || holding.amount < amount) {
      return { success: false, error: '卖出数量超过持有量' }
    }

    const total = amount * price
    const realizedPL = (price - holding.price) * amount

    const trade: Trade = {
      id: Date.now(),
      symbol,
      type: 'sell',
      amount,
      price,
      total,
      realizedPL,
      timestamp: Date.now()
    }

    trades.value.unshift(trade)
    saveToStorage()
    return { success: true, realizedPL }
  }

  /**
   * 删除交易记录
   */
  function deleteTrade(id: number): { success: boolean; error?: string } {
    if (protectHistory.value) {
      return { success: false, error: '保护开关已开启，禁止删除交易历史' }
    }

    const index = trades.value.findIndex(t => t.id === id)
    if (index === -1) {
      return { success: false, error: '交易记录不存在' }
    }

    trades.value.splice(index, 1)
    saveToStorage()
    return { success: true }
  }

  /**
   * 清空所有数据
   */
  function clearAllData(): { success: boolean; error?: string } {
    if (protectHistory.value) {
      return { success: false, error: '保护开关已开启，禁止清空数据' }
    }

    trades.value = []
    saveToStorage()
    return { success: true }
  }

  /**
   * 从CoinCap获取价格
   */
  async function fetchPrices(): Promise<boolean> {
    if (refreshing.value) return false

    refreshing.value = true
    errorMessage.value = ''

    try {
      const response = await axios.get('https://rest.coincap.io/v3/assets', {
        headers: {
          'Authorization': 'Bearer b617d9cf029dbb40f02b058a0e74919176b768cf36fd1ea6fae55a13a1610f41'
        }
      })

      const data = response.data.data
      const serverTimestamp = response.data.timestamp

      data.forEach((item: any) => {
        const symbol = item.symbol
        const price = parseFloat(item.priceUsd)
        const change24h = parseFloat(item.changePercent24Hr) || 0
        prices.value[symbol] = price
        priceChanges24h.value[symbol] = change24h
      })

      lastUpdateTime.value = new Date(serverTimestamp).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })

      return true
    } catch (error) {
      console.error('Failed to fetch prices:', error)
      errorMessage.value = '获取价格失败，请检查网络连接'
      return false
    } finally {
      refreshing.value = false
    }
  }

  /**
   * 导出数据
   */
  function exportData(): object {
    return {
      version: '2.0',
      exportTime: new Date().toISOString(),
      trades: trades.value,
      protectHistory: protectHistory.value
    }
  }

  /**
   * 导入数据
   */
  function importData(data: any): { success: boolean; error?: string } {
    try {
      if (!data.trades || !Array.isArray(data.trades)) {
        return { success: false, error: '无效的数据格式' }
      }

      trades.value = data.trades
      if (data.protectHistory !== undefined) {
        protectHistory.value = data.protectHistory
      }

      saveToStorage()
      return { success: true }
    } catch (e) {
      return { success: false, error: '导入失败，数据格式无效' }
    }
  }

  /**
   * 清除错误信息
   */
  function clearError() {
    errorMessage.value = ''
  }

  /**
   * 设置错误信息
   */
  function setError(message: string) {
    errorMessage.value = message
  }

  // ==================== 兼容层（用于 CryptoPortfolio 组件）====================

  /**
   * 创建交易（统一入口）
   */
  async function createTrade(tradeData: { symbol: string; type: string; amount: number; price: number }): Promise<{ success: boolean; error?: string }> {
    const { symbol, type, amount, price } = tradeData

    if (type === 'buy') {
      const result = executeBuy(symbol, amount, price)
      return result
    } else if (type === 'sell') {
      const result = executeSell(symbol, amount, price)
      return { success: result.success, error: result.error }
    } else if (type === 'recharge') {
      const success = rechargeUSDT(amount)
      return { success, error: success ? undefined : '充值失败' }
    }

    return { success: false, error: '无效的交易类型' }
  }

  /**
   * 获取仪表盘数据（获取价格）
   */
  async function fetchDashboard(): Promise<{ success: boolean; error?: string; updatedAt?: string }> {
    const success = await fetchPrices()
    return {
      success,
      error: errorMessage.value || undefined,
      updatedAt: lastUpdateTime.value
    }
  }

  /**
   * 获取单个资产价格
   */
  async function fetchAssetPrice(symbol: string): Promise<{ success: boolean; price: number }> {
    // 如果 prices 中已有该资产价格，直接返回
    if (prices.value[symbol]) {
      return { success: true, price: prices.value[symbol] }
    }

    // 否则尝试获取所有价格
    await fetchPrices()

    if (prices.value[symbol]) {
      return { success: true, price: prices.value[symbol] }
    }

    return { success: false, price: 0 }
  }

  /**
   * 清空所有交易
   */
  async function clearAllTrades(): Promise<{ success: boolean; error?: string }> {
    return clearAllData()
  }

  /**
   * 导入预览（简化版）
   */
  async function importPreview(data: any): Promise<{ success: boolean; preview?: any; error?: string }> {
    if (!data.trades || !Array.isArray(data.trades)) {
      return { success: false, error: '无效的数据格式' }
    }

    // 简化的预览逻辑
    const preview = {
      total_trades: data.trades.length,
      new_trades: data.trades.length,
      conflicts: 0,
      conflict_items: []
    }

    return { success: true, preview }
  }

  /**
   * 确认导入
   */
  async function importConfirm(data: any, strategy: string): Promise<{ success: boolean; imported?: number; skipped?: number; overwritten?: number; error?: string }> {
    const result = importData(data)

    if (result.success) {
      return {
        success: true,
        imported: data.trades?.length || 0,
        skipped: 0,
        overwritten: 0
      }
    }

    return { success: false, error: result.error }
  }

  // ==================== 初始化 ====================

  loadFromStorage()

  // ==================== 返回值 ====================

  return {
    // State
    trades,
    prices,
    priceChanges24h,
    protectHistory,
    lastUpdateTime,
    refreshing,
    errorMessage,

    // Getters
    holdings,
    cryptoHoldings,
    usdtBalance,
    realizedPLBySymbol,
    totalRealizedPL,
    totalUnrealizedPL,
    totalCost,
    cryptoMarketValue,
    totalValue,
    unrealizedPLRate,
    realizedPLRate,
    totalProfitLoss,
    totalValueChange24h,
    assetAllocation,

    // Functions
    getHoldingAmount,
    getCostPrice,
    calculateEstimatedAvgCost,
    calculateEstimatedRealizedPL,

    // Actions
    loadFromStorage,
    saveToStorage,
    toggleProtectHistory,
    rechargeUSDT,
    executeBuy,
    executeSell,
    deleteTrade,
    clearAllData,
    fetchPrices,
    exportData,
    importData,
    clearError,
    setError,

    // 兼容层方法
    createTrade,
    fetchDashboard,
    fetchAssetPrice,
    clearAllTrades,
    importPreview,
    importConfirm
  }
})
