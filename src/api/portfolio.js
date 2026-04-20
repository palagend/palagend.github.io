import { apiClient } from './axios'

export const backendPortfolioApi = {
  // 获取仪表盘聚合数据（价格+持仓+统计）
  getDashboard() {
    return apiClient.get('/portfolio/dashboard')
  },

  // 获取交易记录
  getTrades() {
    return apiClient.get('/portfolio/trades')
  },

  // 创建交易
  createTrade(trade) {
    return apiClient.post('/portfolio/trades', trade)
  },

  // 删除交易记录
  deleteTrade(id) {
    return apiClient.delete(`/portfolio/trades/${id}`)
  },

  // 清空交易记录
  clearTrades() {
    return apiClient.delete('/portfolio/trades')
  },

  // 获取单个资产价格（用于交易时获取最新价）
  getAssetPrice(symbol) {
    return apiClient.get(`/prices/${symbol}`)
  },

  // 导出数据
  exportData() {
    return apiClient.get('/portfolio/export')
  },

  // 导入预览
  importPreview(data) {
    return apiClient.post('/portfolio/import/preview', { data })
  },

  // 确认导入
  importConfirm(data, conflictStrategy = 'skip') {
    return apiClient.post('/portfolio/import/confirm', {
      data,
      conflict_strategy: conflictStrategy
    })
  }
}
