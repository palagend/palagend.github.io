// API 统一入口 - 根据配置自动选择后端或前端模式
import { config } from '../config'
import { backendPortfolioApi } from './portfolio'
import { localPortfolioApi } from './localStorage/portfolio'
import { localUserApi } from './localStorage/user'

// 导出根据模式选择的 portfolioApi
export const portfolioApi = config.isBackend ? backendPortfolioApi : localPortfolioApi

// 导出用户 API（前端模式使用 localStorage 版本）
export const userApi = config.isBackend ? null : localUserApi

// 导出 axios 实例（仅后端模式使用）
export { apiClient } from './axios'

// 导出配置
export { config }
