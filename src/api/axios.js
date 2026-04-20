import axios from 'axios'
import { useUserStore } from '../stores/user'
import { config } from '../config'

const API_BASE_URL = '/api'

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 是否正在刷新 token
let isRefreshing = false
// 等待 token 刷新的请求队列
let refreshSubscribers = []

// 订阅 token 刷新
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback)
}

// 通知所有订阅者新 token
function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach(callback => callback(newToken))
  refreshSubscribers = []
}

// 请求拦截器 - 添加 Authorization header
apiClient.interceptors.request.use(
  (requestConfig) => {
    // 前端模式不发送 token
    if (config.isFrontend) {
      return requestConfig
    }
    const userStore = useUserStore()
    if (userStore.accessToken) {
      requestConfig.headers.Authorization = `Bearer ${userStore.accessToken}`
    }
    return requestConfig
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理 token 失效
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    const userStore = useUserStore()

    // 前端模式不处理 token 刷新
    if (config.isFrontend) {
      return Promise.reject(error)
    }

    // 如果不是 401 错误，直接返回错误
    if (error.response?.status !== 401) {
      return Promise.reject(error)
    }

    // 如果没有 refresh token，直接登出
    if (!userStore.refreshToken) {
      userStore.clearTokens()
      userStore.openLoginModal()
      return Promise.reject(error)
    }

    // 如果正在刷新 token，将请求加入队列等待
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          resolve(apiClient(originalRequest))
        })
      })
    }

    // 开始刷新 token
    isRefreshing = true

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refresh_token: userStore.refreshToken
      })

      const newToken = response.data.tokens.access_token
      const newRefreshToken = response.data.tokens.refresh_token

      // 更新 store 中的 token
      userStore.setTokens({
        access_token: newToken,
        refresh_token: newRefreshToken
      })

      // 通知所有等待的请求
      onTokenRefreshed(newToken)

      // 重试原始请求
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      // refresh token 也失效了，清空缓存并提示登录
      userStore.clearTokens()
      userStore.openLoginModal()

      // 可以在这里添加全局提示
      console.error('登录已过期，请重新登录')

      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export { apiClient }
