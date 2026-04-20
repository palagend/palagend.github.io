// LocalStorage 版本的 Portfolio API（纯前端模式）

const STORAGE_KEYS = {
  TRADES: 'portfolio_trades',
  PRICES: 'portfolio_prices',
  USER: 'portfolio_user'
}

// 模拟价格数据
const MOCK_PRICES = {
  BTC: 65000,
  ETH: 3500,
  USDT: 1,
  BNB: 580,
  SOL: 145,
  XRP: 0.62,
  DOGE: 0.16,
  ADA: 0.45
}

// 模拟价格变化（24h）
const MOCK_PRICE_CHANGES = {
  BTC: 2.5,
  ETH: -1.2,
  USDT: 0.01,
  BNB: 3.1,
  SOL: 5.4,
  XRP: -0.8,
  DOGE: 8.2,
  ADA: 1.5
}

// 获取存储的数据
function getStorageData(key, defaultValue = []) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch {
    return defaultValue
  }
}

// 设置存储的数据
function setStorageData(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// 生成唯一 ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 计算持仓数据
function calculatePortfolio(trades) {
  const holdings = {}

  trades.forEach(trade => {
    const { symbol, type, quantity, price } = trade
    if (!holdings[symbol]) {
      holdings[symbol] = { quantity: 0, totalCost: 0, avgPrice: 0 }
    }

    if (type === 'buy') {
      holdings[symbol].totalCost += quantity * price
      holdings[symbol].quantity += quantity
    } else {
      holdings[symbol].quantity -= quantity
    }

    if (holdings[symbol].quantity > 0) {
      holdings[symbol].avgPrice = holdings[symbol].totalCost / holdings[symbol].quantity
    } else {
      delete holdings[symbol]
    }
  })

  return Object.entries(holdings).map(([symbol, data]) => ({
    symbol,
    quantity: data.quantity,
    avg_price: data.avgPrice,
    current_price: MOCK_PRICES[symbol] || 0,
    value: data.quantity * (MOCK_PRICES[symbol] || 0),
    unrealized_pl: data.quantity * ((MOCK_PRICES[symbol] || 0) - data.avgPrice)
  })).filter(item => item.quantity > 0)
}

// 计算统计数据
function calculateStats(trades, portfolio) {
  let realizedPL = 0
  const buyTrades = trades.filter(t => t.type === 'buy')
  const sellTrades = trades.filter(t => t.type === 'sell')

  // 简化计算实现盈亏
  sellTrades.forEach(sell => {
    const matchingBuys = buyTrades.filter(b => b.symbol === sell.symbol && b.quantity >= sell.quantity)
    if (matchingBuys.length > 0) {
      const avgBuyPrice = matchingBuys.reduce((sum, b) => sum + b.price, 0) / matchingBuys.length
      realizedPL += sell.quantity * (sell.price - avgBuyPrice)
    }
  })

  const unrealizedPL = portfolio.reduce((sum, item) => sum + item.unrealized_pl, 0)
  const cryptoValue = portfolio.reduce((sum, item) => sum + item.value, 0)

  // 模拟 USDT 余额（简化处理）
  const usdtBalance = 10000 + realizedPL

  return {
    realized_profit_loss: realizedPL,
    unrealized_profit_loss: unrealizedPL,
    total_profit_loss: realizedPL + unrealizedPL,
    crypto_value: cryptoValue,
    usdt_balance: usdtBalance,
    total_value: cryptoValue + usdtBalance
  }
}

// 模拟 API 响应格式
function mockResponse(data) {
  return Promise.resolve({ data })
}

export const localPortfolioApi = {
  // 获取仪表盘数据
  getDashboard() {
    const trades = getStorageData(STORAGE_KEYS.TRADES)
    const portfolio = calculatePortfolio(trades)
    const stats = calculateStats(trades, portfolio)

    return mockResponse({
      prices: MOCK_PRICES,
      price_changes: MOCK_PRICE_CHANGES,
      portfolio,
      ...stats,
      updated_at: new Date().toISOString()
    })
  },

  // 获取交易记录
  getTrades() {
    const trades = getStorageData(STORAGE_KEYS.TRADES)
    return mockResponse({ trades })
  },

  // 创建交易
  createTrade(trade) {
    const trades = getStorageData(STORAGE_KEYS.TRADES)
    const newTrade = {
      id: generateId(),
      ...trade,
      created_at: new Date().toISOString()
    }
    trades.push(newTrade)
    setStorageData(STORAGE_KEYS.TRADES, trades)
    return mockResponse({ trade: newTrade })
  },

  // 删除交易
  deleteTrade(id) {
    const trades = getStorageData(STORAGE_KEYS.TRADES)
    const filtered = trades.filter(t => t.id !== id)
    setStorageData(STORAGE_KEYS.TRADES, filtered)
    return mockResponse({ success: true })
  },

  // 清空交易
  clearTrades() {
    setStorageData(STORAGE_KEYS.TRADES, [])
    return mockResponse({ success: true })
  },

  // 获取资产价格
  getAssetPrice(symbol) {
    return mockResponse({
      price: MOCK_PRICES[symbol] || 0,
      updated_at: new Date().toISOString()
    })
  },

  // 导出数据
  exportData() {
    const trades = getStorageData(STORAGE_KEYS.TRADES)
    return mockResponse({ data: trades })
  },

  // 导入预览
  importPreview(data) {
    return mockResponse({
      preview: {
        total: data.length,
        valid: data.length,
        conflicts: 0,
        sample: data.slice(0, 3)
      }
    })
  },

  // 确认导入
  importConfirm(data, conflictStrategy = 'skip') {
    const trades = getStorageData(STORAGE_KEYS.TRADES)
    let imported = 0
    let skipped = 0

    data.forEach(item => {
      if (conflictStrategy === 'skip' && trades.some(t => t.id === item.id)) {
        skipped++
      } else {
        trades.push({
          ...item,
          id: item.id || generateId(),
          created_at: item.created_at || new Date().toISOString()
        })
        imported++
      }
    })

    setStorageData(STORAGE_KEYS.TRADES, trades)
    return mockResponse({ imported, skipped })
  }
}
