// LocalStorage 版本的 Portfolio API（纯前端模式）
// 按照 Go 后端逻辑实现，使用 CoinCap API 获取真实价格

const STORAGE_KEYS = {
  TRADES: 'portfolio_trades',
  PRICES: 'portfolio_prices',
  PRICE_CACHE_TIME: 'portfolio_price_cache_time'
}

// CoinCap API Key
const COINCAP_API_KEY = 'b617d9cf029dbb40f02b058a0e74919176b768cf36fd1ea6fae55a13a1610f41'

// CoinCap API 基础 URL
const COINCAP_API_BASE = 'https://rest.coincap.io/v3'

// 支持的加密货币列表（不含USDT）
const SUPPORTED_CRYPTOS = {
  BTC: true,
  ETH: true,
  BNB: true,
  XRP: true,
  ADA: true,
  SOL: true,
  DOGE: true,
  TRX: true,
  AVAX: true,
  HYPE: true
}

// CoinCap 资产 ID 映射（symbol -> coincap id）
const COINCAP_ASSET_IDS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binance-coin',
  XRP: 'xrp',
  ADA: 'cardano',
  SOL: 'solana',
  DOGE: 'dogecoin',
  TRX: 'tron',
  AVAX: 'avalanche',
  HYPE: 'hyperliquid'
}

// 默认价格数据（API 失败时使用）
const DEFAULT_PRICES = {
  BTC: 65000,
  ETH: 3500,
  USDT: 1,
  BNB: 580,
  SOL: 145,
  XRP: 0.62,
  DOGE: 0.16,
  ADA: 0.45,
  TRX: 0.12,
  AVAX: 35,
  HYPE: 20
}

// 默认价格变化（API 失败时使用）
const DEFAULT_PRICE_CHANGES = {
  BTC: 0.025,
  ETH: -0.012,
  USDT: 0.0001,
  BNB: 0.031,
  SOL: 0.054,
  XRP: -0.008,
  DOGE: 0.082,
  ADA: 0.015,
  TRX: 0.01,
  AVAX: -0.02,
  HYPE: 0.05
}

// 价格缓存时间（毫秒）- 5分钟
const PRICE_CACHE_DURATION = 5 * 60 * 1000

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

// 从 CoinCap 获取所有资产价格（按照 Go 后端的 fetchPrices）
async function fetchPricesFromCoinCap() {
  try {
    const ids = Object.values(COINCAP_ASSET_IDS).join(',')
    const url = `${COINCAP_API_BASE}/assets?ids=${ids}`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${COINCAP_API_KEY}`
      }
    })

    if (!response.ok) {
      throw new Error(`CoinCap API error: ${response.status}`)
    }

    const result = await response.json()

    const prices = { USDT: 1.0 }
    const priceChanges = { USDT: 0 }
    let updatedAt = Date.now()

    if (result.data && Array.isArray(result.data)) {
      result.data.forEach(item => {
        const symbol = item.symbol
        const price = parseFloat(item.priceUsd) || 0
        const change24hPercent = parseFloat(item.changePercent24Hr) || 0

        prices[symbol] = price
        priceChanges[symbol] = change24hPercent / 100
      })

      if (result.timestamp) {
        updatedAt = result.timestamp
      }
    }

    // 缓存价格数据
    setStorageData(STORAGE_KEYS.PRICES, { prices, priceChanges, updatedAt })
    setStorageData(STORAGE_KEYS.PRICE_CACHE_TIME, Date.now())

    return { prices, priceChanges, updatedAt }
  } catch (error) {
    console.error('获取 CoinCap 价格失败:', error)

    // 尝试使用缓存的价格
    const cached = getStorageData(STORAGE_KEYS.PRICES, null)
    if (cached) {
      return cached
    }

    // 使用默认价格
    return {
      prices: DEFAULT_PRICES,
      priceChanges: DEFAULT_PRICE_CHANGES,
      updatedAt: Date.now()
    }
  }
}

// 从 CoinCap 获取单个资产价格（按照 Go 后端的 GetAssetPrice）
async function fetchAssetPriceFromCoinCap(symbol) {
  try {
    if (symbol === 'USDT') {
      return {
        symbol: symbol,
        price: 1.0,
        updated_at: new Date().toISOString()
      }
    }

    if (!SUPPORTED_CRYPTOS[symbol]) {
      throw new Error('不支持的加密货币')
    }

    const url = `${COINCAP_API_BASE}/price/bysymbol/${symbol}`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${COINCAP_API_KEY}`
      }
    })

    if (!response.ok) {
      throw new Error(`CoinCap API error: ${response.status}`)
    }

    const result = await response.json()

    if (!result.data || result.data.length === 0) {
      throw new Error('价格数据为空')
    }

    const price = parseFloat(result.data[0]) || 0

    return {
      symbol: symbol,
      price: price,
      updated_at: result.timestamp ? new Date(result.timestamp).toISOString() : new Date().toISOString()
    }
  } catch (error) {
    console.error(`获取 ${symbol} 价格失败:`, error)

    // 使用默认价格
    return {
      symbol: symbol,
      price: DEFAULT_PRICES[symbol] || 0,
      updated_at: new Date().toISOString()
    }
  }
}

// 获取价格数据（带缓存）
async function getPrices() {
  const cacheTime = getStorageData(STORAGE_KEYS.PRICE_CACHE_TIME, 0)
  const now = Date.now()

  // 如果缓存未过期，使用缓存数据
  if (now - cacheTime < PRICE_CACHE_DURATION) {
    const cached = getStorageData(STORAGE_KEYS.PRICES, null)
    if (cached) {
      return cached
    }
  }

  // 否则从 API 获取
  return fetchPricesFromCoinCap()
}

// 验证交易请求（按照 Go 后端的 validateTradeRequest）
function validateTradeRequest(trade) {
  const { symbol, type, amount, price } = trade

  switch (type) {
    case 'recharge':
      // 充值必须是USDT
      if (symbol !== 'USDT') {
        throw new Error('充值只支持USDT')
      }
      // 充值时价格和数量应该一致（1:1）
      if (price !== 1) {
        throw new Error('USDT充值价格必须为1')
      }
      break
    case 'buy':
    case 'sell':
      // 买卖不能是USDT
      if (symbol === 'USDT') {
        throw new Error('不能直接买卖USDT，请使用充值功能')
      }
      // 检查是否是支持的加密货币
      if (!SUPPORTED_CRYPTOS[symbol]) {
        throw new Error(`不支持的加密货币: ${symbol}`)
      }
      break
    default:
      throw new Error(`不支持的交易类型: ${type}`)
  }

  if (!amount || amount <= 0) {
    throw new Error('交易数量必须大于0')
  }
  if (!price || price <= 0) {
    throw new Error('交易价格必须大于0')
  }
}

// 计算持仓（模拟 Go 后端的 Holding 表计算）
function calculateHoldings(trades) {
  const holdings = {}

  // 按时间排序交易
  const sortedTrades = [...trades].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  sortedTrades.forEach(trade => {
    const { symbol, type } = trade
    const amount = trade.amount || 0
    const total = trade.total || (amount * trade.price)

    if (!holdings[symbol]) {
      holdings[symbol] = 0
    }

    switch (type) {
      case 'recharge':
        // 充值：增加 USDT 余额
        holdings[symbol] += amount
        break
      case 'buy':
        // 买入：增加加密资产持仓，减少 USDT 余额
        holdings[symbol] += amount
        if (!holdings['USDT']) {
          holdings['USDT'] = 0
        }
        holdings['USDT'] -= total
        break
      case 'sell':
        // 卖出：减少加密资产持仓，增加 USDT 余额
        holdings[symbol] -= amount
        if (!holdings['USDT']) {
          holdings['USDT'] = 0
        }
        holdings['USDT'] += total
        break
    }
  })

  // 过滤掉持仓为0的资产，但保留USDT
  const result = {}
  Object.entries(holdings).forEach(([symbol, amount]) => {
    if (amount !== 0 || symbol === 'USDT') {
      result[symbol] = amount
    }
  })

  return result
}

// 计算投资组合统计（按照 Go 后端的 calculatePortfolioStats）
function calculatePortfolioStats(holdings, trades, prices, priceChanges) {
  const portfolio = []
  let totalValue = 0
  let totalAssetsValue = 0
  let usdtBalance = 0
  let totalUnrealizedPL = 0
  let totalCost = 0
  let weightedChange = 0
  let totalRealizedPL = 0
  let totalHistoricalCost = 0

  // 按时间顺序遍历交易，计算各币种的成本和实现盈亏
  const assetData = {}

  // 初始化 assetData
  Object.keys(SUPPORTED_CRYPTOS).forEach(symbol => {
    assetData[symbol] = {
      amount: 0,
      cost: 0,
      totalIn: 0,
      realizedPL: 0
    }
  })

  // 按时间排序交易
  const sortedTrades = [...trades].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  sortedTrades.forEach(trade => {
    if (trade.symbol === 'USDT') return

    const symbol = trade.symbol
    const amount = trade.amount || 0
    const total = trade.total || (amount * trade.price)

    if (!assetData[symbol]) {
      assetData[symbol] = { amount: 0, cost: 0, totalIn: 0, realizedPL: 0 }
    }

    const d = assetData[symbol]

    switch (trade.type) {
      case 'buy':
        // 增加持仓和成本
        d.amount += amount
        d.cost += total
        d.totalIn += total
        break
      case 'sell':
        // 按比例回收成本，计算实现盈亏
        if (d.amount > 0 && amount > 0) {
          const sellRatio = amount / d.amount
          const costRecovered = d.cost * sellRatio
          const realizedPL = total - costRecovered

          d.realizedPL += realizedPL
          d.cost -= costRecovered
          d.amount -= amount
        }
        break
    }

    assetData[symbol] = d
  })

  // 先计算所有有交易记录的币种的总实现盈亏（包括已清仓的）
  Object.entries(assetData).forEach(([symbol, d]) => {
    if (symbol !== 'USDT') {
      totalRealizedPL += d.realizedPL
      totalHistoricalCost += d.totalIn
    }
  })

  // 构建持仓组合
  Object.entries(holdings).forEach(([symbol, amount]) => {
    if (symbol === 'USDT') {
      usdtBalance = amount
      portfolio.push({
        symbol: symbol,
        amount: amount,
        current_price: 1.00,
        avg_cost: 0,
        market_value: usdtBalance,
        cost: 0,
        profit_loss: 0,
        pl_rate: 0,
        realized_pl: 0,
        realized_pl_rate: 0
      })
      return
    }

    const price = prices[symbol] || 0
    const marketValue = amount * price
    totalAssetsValue += marketValue

    // 从预计算数据获取成本和实现盈亏
    const d = assetData[symbol] || { amount: 0, cost: 0, totalIn: 0, realizedPL: 0 }
    const cost = d.cost
    const realizedPL = d.realizedPL

    // 持仓为0的资产只展示实现盈亏，不参与总市值计算
    if (amount === 0 && realizedPL !== 0) {
      portfolio.push({
        symbol: symbol,
        amount: 0,
        current_price: price,
        avg_cost: 0,
        market_value: 0,
        cost: 0,
        profit_loss: 0,
        pl_rate: 0,
        realized_pl: realizedPL,
        realized_pl_rate: 0
      })
      return
    }

    totalValue += marketValue

    const avgCost = amount !== 0 ? cost / amount : 0
    const profitLoss = marketValue - cost
    const plRate = cost !== 0 ? (profitLoss / cost) * 100 : 0

    totalUnrealizedPL += profitLoss
    totalCost += cost
    weightedChange += marketValue * (priceChanges[symbol] || 0)

    // 计算实现盈亏率
    const realizedPLRate = d.totalIn !== 0 ? (realizedPL / d.totalIn) * 100 : 0

    portfolio.push({
      symbol: symbol,
      amount: amount,
      current_price: price,
      avg_cost: avgCost,
      market_value: marketValue,
      cost: cost,
      profit_loss: profitLoss,
      pl_rate: plRate,
      realized_pl: realizedPL,
      realized_pl_rate: realizedPLRate
    })
  })

  // 计算浮动盈亏率
  const totalUnrealizedPLRate = totalCost !== 0 ? (totalUnrealizedPL / totalCost) * 100 : 0

  // 计算24小时价值变化率
  const totalValueChange24h = totalValue !== 0 ? (weightedChange / totalValue) * 100 : 0

  // 计算实现盈亏率 = 实现盈亏 / 历史总投入成本
  const totalRealizedPLRate = totalHistoricalCost !== 0 ? (totalRealizedPL / totalHistoricalCost) * 100 : 0

  return {
    portfolio,
    totalValue,
    totalAssetsValue,
    usdtBalance,
    totalUnrealizedPL,
    totalUnrealizedPLRate,
    totalRealizedPL,
    totalRealizedPLRate,
    totalValueChange24h
  }
}

// 模拟 API 响应格式
function mockResponse(data) {
  return Promise.resolve({ data })
}

// 模拟错误响应
function mockErrorResponse(error) {
  return Promise.reject({ response: { data: { error } } })
}

export const localPortfolioApi = {
  // 获取仪表盘数据（按照 Go 后端的 GetDashboard）
  async getDashboard() {
    const trades = getStorageData(STORAGE_KEYS.TRADES)
    const holdings = calculateHoldings(trades)

    // 获取真实价格数据
    const { prices, priceChanges, updatedAt } = await getPrices()

    const stats = calculatePortfolioStats(holdings, trades, prices, priceChanges)

    return mockResponse({
      prices: prices,
      price_changes: priceChanges,
      updated_at: new Date(updatedAt).toISOString(),
      portfolio: stats.portfolio,
      crypto_value: stats.totalValue,
      total_assets_value: stats.totalAssetsValue,
      usdt_balance: stats.usdtBalance,
      unrealized_profit_loss: stats.totalUnrealizedPL,
      unrealized_profit_loss_rate: stats.totalUnrealizedPLRate,
      realized_profit_loss: stats.totalRealizedPL,
      realized_profit_loss_rate: stats.totalRealizedPLRate,
      total_profit_loss: stats.totalUnrealizedPL + stats.totalRealizedPL,
      value_change_24h: stats.totalValueChange24h
    })
  },

  // 获取交易记录（按照 Go 后端的 GetTrades）
  getTrades() {
    const trades = getStorageData(STORAGE_KEYS.TRADES)
    // 按时间倒序排列
    const sortedTrades = [...trades].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return mockResponse({ trades: sortedTrades })
  },

  // 创建交易（按照 Go 后端的 CreateTrade）
  createTrade(trade) {
    try {
      // 验证交易请求
      validateTradeRequest(trade)

      const trades = getStorageData(STORAGE_KEYS.TRADES)
      const amount = trade.amount || 0
      const price = trade.price || 0
      const total = amount * price

      // 检查余额是否足够（买入时检查USDT余额，卖出时检查持仓）
      const holdings = calculateHoldings(trades)

      if (trade.type === 'buy') {
        const usdtBalance = holdings['USDT'] || 0
        if (usdtBalance < total) {
          throw new Error('USDT余额不足')
        }
      } else if (trade.type === 'sell') {
        const holdingAmount = holdings[trade.symbol] || 0
        if (holdingAmount < amount) {
          throw new Error('持仓不足')
        }
      }

      const newTrade = {
        id: generateId(),
        symbol: trade.symbol,
        type: trade.type,
        amount: amount,
        price: price,
        total: total,
        created_at: new Date().toISOString()
      }

      trades.push(newTrade)
      setStorageData(STORAGE_KEYS.TRADES, trades)

      return mockResponse({
        trade: {
          id: newTrade.id,
          symbol: newTrade.symbol,
          type: newTrade.type,
          amount: newTrade.amount,
          price: newTrade.price,
          total: newTrade.total,
          created_at: newTrade.created_at
        }
      })
    } catch (error) {
      return mockErrorResponse(error.message)
    }
  },

  // 删除交易（按照 Go 后端的 DeleteTrade，带安全校验）
  deleteTrade(id) {
    const trades = getStorageData(STORAGE_KEYS.TRADES)
    const tradeIndex = trades.findIndex(t => t.id === id)

    if (tradeIndex === -1) {
      return mockErrorResponse('交易记录不存在')
    }

    const trade = trades[tradeIndex]

    // 校验1：只能删除24小时内的交易
    const tradeTime = new Date(trade.created_at)
    const now = new Date()
    const hoursDiff = (now - tradeTime) / (1000 * 60 * 60)

    if (hoursDiff > 24) {
      return mockErrorResponse('只能删除24小时内的交易记录')
    }

    // 校验2：模拟删除后的持仓状态
    const remainingTrades = trades.filter(t => t.id !== id)
    const simulatedHoldings = calculateHoldings(remainingTrades)

    // 校验3：删除后不能导致任何资产负持仓
    for (const [symbol, amount] of Object.entries(simulatedHoldings)) {
      if (amount < 0) {
        return mockErrorResponse(`删除该交易会导致 ${symbol} 持仓为负数(${amount.toFixed(8)})，无法删除`)
      }
    }

    // 执行删除
    trades.splice(tradeIndex, 1)
    setStorageData(STORAGE_KEYS.TRADES, trades)

    return mockResponse({
      success: true,
      message: '交易记录已删除',
      deleted_trade: {
        id: trade.id,
        symbol: trade.symbol,
        type: trade.type,
        amount: trade.amount,
        price: trade.price,
        created_at: trade.created_at
      }
    })
  },

  // 清空交易（按照 Go 后端的 ClearTrades）
  clearTrades() {
    setStorageData(STORAGE_KEYS.TRADES, [])
    setStorageData(STORAGE_KEYS.PRICES, null)
    setStorageData(STORAGE_KEYS.PRICE_CACHE_TIME, 0)
    return mockResponse({ success: true, message: '所有数据已清空' })
  },

  // 获取资产价格（按照 Go 后端的 GetAssetPrice）
  async getAssetPrice(symbol) {
    if (!symbol) {
      return mockErrorResponse('币种代码不能为空')
    }

    if (symbol === 'USDT') {
      return mockResponse({
        symbol: symbol,
        price: 1.0,
        updated_at: new Date().toISOString()
      })
    }

    if (!SUPPORTED_CRYPTOS[symbol]) {
      return mockErrorResponse('不支持的加密货币')
    }

    // 使用 CoinCap API 获取价格
    const result = await fetchAssetPriceFromCoinCap(symbol)
    return mockResponse(result)
  },

  // 导出数据（按照 Go 后端的 ExportDataHandler）
  exportData() {
    const trades = getStorageData(STORAGE_KEYS.TRADES)
    // 按时间正序排列
    const sortedTrades = [...trades].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

    const exportTrades = sortedTrades.map(t => ({
      symbol: t.symbol,
      type: t.type,
      amount: t.amount,
      price: t.price,
      total: t.total,
      created_at: t.created_at
    }))

    const data = {
      version: '1.0',
      export_time: new Date().toISOString(),
      app_name: 'fx-portfolio',
      trades: exportTrades
    }

    return mockResponse({ success: true, data })
  },

  // 导入预览（按照 Go 后端的 ImportPreviewHandler）
  importPreview(data) {
    // 验证版本
    if (data.version !== '1.0') {
      return mockErrorResponse(`不支持的版本: ${data.version}`)
    }

    const existingTrades = getStorageData(STORAGE_KEYS.TRADES)

    // 构建现有交易的时间戳集合（用于快速查找）
    const existingMap = new Set()
    existingTrades.forEach(t => {
      const key = `${t.symbol}_${t.type}_${t.created_at}`
      existingMap.add(key)
    })

    const preview = {
      total_trades: data.trades.length,
      new_trades: 0,
      conflicts: 0,
      conflict_items: []
    }

    // 检查冲突
    data.trades.forEach(trade => {
      // 验证交易数据
      try {
        validateTradeRequest(trade)
      } catch (error) {
        preview.conflicts++
        preview.conflict_items.push({
          trade: trade,
          reason: error.message
        })
        return
      }

      // 检查是否已存在
      const key = `${trade.symbol}_${trade.type}_${trade.created_at}`
      if (existingMap.has(key)) {
        preview.conflicts++
        preview.conflict_items.push({
          trade: trade,
          reason: '交易记录已存在'
        })
      } else {
        preview.new_trades++
      }
    })

    return mockResponse({ success: true, preview })
  },

  // 确认导入（按照 Go 后端的 ImportConfirmHandler）
  importConfirm(data, conflictStrategy = 'skip') {
    // 验证版本
    if (data.version !== '1.0') {
      return mockErrorResponse(`不支持的版本: ${data.version}`)
    }

    const existingTrades = getStorageData(STORAGE_KEYS.TRADES)

    // 构建现有交易的时间戳集合
    const existingMap = new Set()
    existingTrades.forEach(t => {
      const key = `${t.symbol}_${t.type}_${t.created_at}`
      existingMap.add(key)
    })

    let imported = 0
    let skipped = 0
    let overwritten = 0

    data.trades.forEach(trade => {
      // 验证交易数据
      try {
        validateTradeRequest(trade)
      } catch (error) {
        skipped++
        return
      }

      const key = `${trade.symbol}_${trade.type}_${trade.created_at}`

      if (existingMap.has(key)) {
        if (conflictStrategy === 'skip') {
          skipped++
          return
        }
        // overwrite 策略：先删除旧的，再添加新的
        const index = existingTrades.findIndex(t =>
          t.symbol === trade.symbol &&
          t.type === trade.type &&
          t.created_at === trade.created_at
        )
        if (index !== -1) {
          existingTrades.splice(index, 1)
          overwritten++
        }
      } else {
        imported++
      }

      // 添加新交易
      existingTrades.push({
        id: generateId(),
        symbol: trade.symbol,
        type: trade.type,
        amount: trade.amount,
        price: trade.price,
        total: trade.total || (trade.amount * trade.price),
        created_at: trade.created_at
      })
    })

    setStorageData(STORAGE_KEYS.TRADES, existingTrades)

    return mockResponse({
      success: true,
      imported,
      skipped,
      overwritten
    })
  }
}
