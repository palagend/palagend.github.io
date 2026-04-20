// LocalStorage 版本的用户 API（纯前端模式）
// 简化版本：前端模式下自动使用本地用户，无需登录

const STORAGE_KEY = 'local_user'

// 默认本地用户
const DEFAULT_USER = {
  id: 'local_user',
  username: '本地用户',
  email: 'local@example.com',
  created_at: new Date().toISOString()
}

/**
 * 获取或创建本地用户
 */
function getOrCreateUser() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    return JSON.parse(stored)
  }
  // 首次使用，创建默认用户
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USER))
  return DEFAULT_USER
}

export const localUserApi = {
  /**
   * 获取当前用户（前端模式下始终返回本地用户）
   */
  getCurrentUser() {
    return getOrCreateUser()
  },

  /**
   * 检查是否已登录（前端模式下始终返回 true）
   */
  isLoggedIn() {
    return true
  },

  /**
   * 获取本地用户
   */
  getUser() {
    return getOrCreateUser()
  }
}
