// 应用配置
export const config = {
  // 运行模式: 'backend' | 'frontend'
  // 'backend' - 使用后端 API 和数据库
  // 'frontend' - 纯前端模式，使用 LocalStorage 存储
  mode: import.meta.env.VITE_APP_MODE || 'frontend',

  // 是否为后端模式
  get isBackend() {
    return this.mode === 'backend'
  },

  // 是否为前端模式
  get isFrontend() {
    return this.mode === 'frontend'
  }
}
