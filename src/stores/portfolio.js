import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { portfolioApi } from '../api'
import { useUserStore } from './user'

export const usePortfolioStore = defineStore('portfolio', () => {
  const userStore = useUserStore()

  // ========== 状态 ==========
  const dashboardData = ref(null)
  const trades = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // ========== 计算属性 - 价格数据 ==========
  const prices = computed(() => dashboardData.value?.prices || {})
  const priceChanges = computed(() => dashboardData.value?.price_changes || {})

  // ========== 计算属性 - 持仓数据 ==========
  const portfolio = computed(() => dashboardData.value?.portfolio || [])

  // ========== 计算属性 - 资产价值 ==========
  const cryptoAssetsValue = computed(() => dashboardData.value?.crypto_value || 0)
  const cashBalance = computed(() => dashboardData.value?.usdt_balance || 0)
  const totalAssetsValue = computed(() => cryptoAssetsValue.value + cashBalance.value)

  // ========== 计算属性 - 盈亏数据 ==========
  const unrealizedPL = computed(() => dashboardData.value?.unrealized_profit_loss || 0)
  const realizedPL = computed(() => dashboardData.value?.realized_profit_loss || 0)
  const totalPL = computed(() => unrealizedPL.value + realizedPL.value)

  // ========== 计算属性 - 盈亏率（后端已计算好） ==========
  const unrealizedPLRate = computed(() => dashboardData.value?.unrealized_profit_loss_rate || 0)
  const realizedPLRate = computed(() => dashboardData.value?.realized_profit_loss_rate || 0)

  // ========== 计算属性 - 24小时变化 ==========
  const cryptoValueChange24h = computed(() => dashboardData.value?.value_change_24h || 0)

  // ========== Actions ==========

  // 获取仪表盘聚合数据
  async function fetchDashboard() {
    if (!userStore.isLoggedIn) {
      dashboardData.value = null
      trades.value = []
      return { success: false, error: '请先登录' }
    }

    isLoading.value = true
    error.value = null

    try {
      const [dashboardRes, tradesRes] = await Promise.all([
        portfolioApi.getDashboard(),
        portfolioApi.getTrades()
      ])

      dashboardData.value = dashboardRes.data
      trades.value = tradesRes.data.trades || []

      return {
        success: true,
        updatedAt: dashboardRes.data.updated_at
      }
    } catch (err) {
      error.value = err.response?.data?.error || '获取数据失败'
      console.error('获取仪表盘数据失败:', err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // 获取单个资产价格
  async function fetchAssetPrice(symbol) {
    try {
      const response = await portfolioApi.getAssetPrice(symbol)
      if (dashboardData.value) {
        dashboardData.value.prices = {
          ...dashboardData.value.prices,
          [symbol]: response.data.price
        }
      }
      return {
        success: true,
        price: response.data.price,
        updatedAt: response.data.updated_at
      }
    } catch (err) {
      console.error(`获取${symbol}价格失败:`, err)
      return { success: false, error: err.response?.data?.error || '获取价格失败' }
    }
  }

  // 创建交易
  async function createTrade(trade) {
    if (!userStore.isLoggedIn) {
      return { success: false, error: '请先登录' }
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await portfolioApi.createTrade(trade)
      await fetchDashboard()
      return { success: true, data: response.data }
    } catch (err) {
      error.value = err.response?.data?.error || '交易失败'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // 删除交易
  async function deleteTrade(id) {
    if (!userStore.isLoggedIn) {
      return { success: false, error: '请先登录' }
    }

    try {
      await portfolioApi.deleteTrade(id)
      await fetchDashboard()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || '删除失败' }
    }
  }

  // 清空所有交易
  async function clearAllTrades() {
    if (!userStore.isLoggedIn) {
      return { success: false, error: '请先登录' }
    }

    isLoading.value = true
    error.value = null

    try {
      await portfolioApi.clearTrades()
      await fetchDashboard()
      return { success: true }
    } catch (err) {
      error.value = err.response?.data?.error || '清空交易记录失败'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // 导出数据
  async function exportData() {
    if (!userStore.isLoggedIn) {
      return { success: false, error: '请先登录' }
    }

    error.value = null

    try {
      const response = await portfolioApi.exportData()
      return { success: true, data: response.data.data }
    } catch (err) {
      error.value = err.response?.data?.error || '导出数据失败'
      return { success: false, error: error.value }
    }
  }

  // 导入预览
  async function importPreview(data) {
    if (!userStore.isLoggedIn) {
      return { success: false, error: '请先登录' }
    }

    error.value = null

    try {
      const response = await portfolioApi.importPreview(data)
      return { success: true, preview: response.data.preview }
    } catch (err) {
      error.value = err.response?.data?.error || '预览导入数据失败'
      return { success: false, error: error.value }
    }
  }

  // 确认导入
  async function importConfirm(data, conflictStrategy = 'skip') {
    if (!userStore.isLoggedIn) {
      return { success: false, error: '请先登录' }
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await portfolioApi.importConfirm(data, conflictStrategy)
      return {
        success: true,
        imported: response.data.imported,
        skipped: response.data.skipped,
        overwritten: response.data.overwritten
      }
    } catch (err) {
      error.value = err.response?.data?.error || '导入数据失败'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  return {
    // 状态
    dashboardData,
    trades,
    isLoading,
    error,
    // 价格
    prices,
    priceChanges,
    // 持仓组合
    portfolio,
    // 资产价值
    cryptoAssetsValue,
    cashBalance,
    totalAssetsValue,
    // 盈亏
    unrealizedPL,
    realizedPL,
    totalPL,
    unrealizedPLRate,
    realizedPLRate,
    // 变化率
    cryptoValueChange24h,
    // Actions
    fetchDashboard,
    fetchAssetPrice,
    createTrade,
    deleteTrade,
    clearAllTrades,
    exportData,
    importPreview,
    importConfirm
  }
})
