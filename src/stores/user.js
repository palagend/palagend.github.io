import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { config, userApi, apiClient } from '../api'

export const useUserStore = defineStore('user', () => {
  // ========== 状态 ==========
  const user = ref(null)
  const accessToken = ref(localStorage.getItem('accessToken') || '')
  const refreshToken = ref(localStorage.getItem('refreshToken') || '')
  const isLoading = ref(false)
  const error = ref(null)
  const showLoginModal = ref(false)

  // ========== 计算属性 ==========
  const isLoggedIn = computed(() => {
    if (config.isFrontend) {
      // 前端模式下始终已登录
      return true
    }
    return !!accessToken.value && !!user.value
  })

  // ========== 辅助函数 ==========
  const setTokens = (tokens) => {
    // 前端模式不设置 token
    if (config.isFrontend) {
      return
    }
    accessToken.value = tokens.access_token
    refreshToken.value = tokens.refresh_token
    localStorage.setItem('accessToken', tokens.access_token)
    localStorage.setItem('refreshToken', tokens.refresh_token)
  }

  const clearTokens = () => {
    accessToken.value = ''
    refreshToken.value = ''
    user.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  // ========== 后端模式 API 调用 ==========
  const backendRegister = async (username, email, password) => {
    const response = await apiClient.post('/auth/register', {
      username,
      email,
      password
    })
    user.value = response.data.user
    setTokens(response.data.tokens)
    return { success: true }
  }

  const backendLogin = async (username, password) => {
    const response = await apiClient.post('/auth/login', {
      username,
      password
    })
    user.value = response.data.user
    setTokens(response.data.tokens)
    return { success: true }
  }

  const backendFetchUserInfo = async () => {
    if (!accessToken.value) return
    const response = await apiClient.get('/auth/me')
    user.value = response.data.user
  }

  const backendLogout = async () => {
    if (refreshToken.value) {
      try {
        await apiClient.post('/auth/logout', {
          refresh_token: refreshToken.value
        })
      } catch (err) {
        console.error('Logout error:', err)
      }
    }
    clearTokens()
  }

  const backendLogoutAll = async () => {
    await apiClient.post('/auth/logout-all')
    clearTokens()
    return { success: true }
  }

  const backendChangePassword = async (oldPassword, newPassword) => {
    await apiClient.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword
    })
    return { success: true }
  }

  // ========== 统一的 Actions ==========
  const register = async (username, email, password) => {
    // 前端模式不支持注册
    if (config.isFrontend) {
      return { success: false, error: '前端模式不支持注册' }
    }
    isLoading.value = true
    error.value = null
    try {
      return await backendRegister(username, email, password)
    } catch (err) {
      error.value = err.response?.data?.error || '注册失败'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const login = async (username, password) => {
    // 前端模式不支持登录
    if (config.isFrontend) {
      return { success: false, error: '前端模式不支持登录' }
    }
    isLoading.value = true
    error.value = null
    try {
      return await backendLogin(username, password)
    } catch (err) {
      error.value = err.response?.data?.error || '登录失败'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const fetchUserInfo = async () => {
    if (config.isBackend) {
      await backendFetchUserInfo()
    }
    // 前端模式不需要获取用户信息
  }

  const logout = async () => {
    // 前端模式不支持登出
    if (config.isFrontend) {
      return
    }
    await backendLogout()
  }

  const logoutAll = async () => {
    // 前端模式不支持登出
    if (config.isFrontend) {
      return { success: false, error: '前端模式不支持此操作' }
    }
    try {
      return await backendLogoutAll()
    } catch (err) {
      return { success: false, error: err.response?.data?.error || '登出失败' }
    }
  }

  const changePassword = async (oldPassword, newPassword) => {
    // 前端模式不支持修改密码
    if (config.isFrontend) {
      return { success: false, error: '前端模式不支持修改密码' }
    }
    isLoading.value = true
    error.value = null
    try {
      return await backendChangePassword(oldPassword, newPassword)
    } catch (err) {
      error.value = err.response?.data?.error || '修改密码失败'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const init = async () => {
    if (config.isFrontend) {
      // 前端模式：自动设置本地用户
      user.value = userApi.getUser()
    } else if (accessToken.value) {
      // 后端模式：通过 token 获取用户信息
      await backendFetchUserInfo()
    }
  }

  const openLoginModal = () => {
    // 前端模式不显示登录弹窗
    if (config.isFrontend) {
      return
    }
    showLoginModal.value = true
  }

  const closeLoginModal = () => {
    showLoginModal.value = false
  }

  return {
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,
    isLoggedIn,
    showLoginModal,
    register,
    login,
    logout,
    logoutAll,
    fetchUserInfo,
    changePassword,
    init,
    openLoginModal,
    closeLoginModal,
    setTokens,
    clearTokens
  }
})
