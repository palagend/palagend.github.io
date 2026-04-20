<template>
  <div class="user-profile" ref="profileRef">
    <!-- 未登录状态 -->
    <div v-if="!userStore.isLoggedIn" class="auth-buttons">
      <button class="btn-login" @click="userStore.openLoginModal">
        <Icon icon="mdi:login" />
        <span>登录</span>
      </button>
    </div>

    <!-- 已登录状态 -->
    <div v-else class="user-menu">
      <div class="user-avatar" @click.stop="toggleDropdown">
        <div class="avatar-circle">
          <Icon icon="mdi:account" />
        </div>
        <span class="username">{{ userStore.user?.username }}</span>
        <Icon icon="mdi:chevron-down" class="dropdown-icon" :class="{ open: isDropdownOpen }" />
      </div>

      <!-- 下拉菜单 -->
      <Transition name="dropdown">
        <div v-show="isDropdownOpen" class="dropdown-menu">
          <div class="dropdown-header">
            <div class="avatar-large">
              <Icon icon="mdi:account-circle" />
            </div>
            <div class="user-info">
              <span class="user-name">{{ userStore.user?.username }}</span>
              <span class="user-email">{{ userStore.user?.email }}</span>
            </div>
          </div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-items">
            <button class="dropdown-item" @click="openProfileModal">
              <Icon icon="mdi:account-outline" />
              <span>个人资料</span>
            </button>
            <button class="dropdown-item" @click="openPasswordModal">
              <Icon icon="mdi:lock-outline" />
              <span>修改密码</span>
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item logout" @click="handleLogout">
              <Icon icon="mdi:logout" />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 登录/注册模态框 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="userStore.showLoginModal" class="modal-overlay" @click.self="closeLoginModal">
          <div class="modal-container">
            <div class="modal-header">
              <h3>{{ isRegistering ? '注册账号' : '用户登录' }}</h3>
              <button class="btn-close" @click="closeLoginModal">
                <Icon icon="mdi:close" />
              </button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="handleAuthSubmit">
                <div class="form-group">
                  <label>
                    <Icon icon="mdi:account-outline" />
                    用户名
                  </label>
                  <input
                    v-model="authForm.username"
                    type="text"
                    placeholder="请输入用户名"
                    required
                    minlength="3"
                    maxlength="50"
                  />
                </div>
                <div v-if="isRegistering" class="form-group">
                  <label>
                    <Icon icon="mdi:email-outline" />
                    邮箱
                  </label>
                  <input
                    v-model="authForm.email"
                    type="email"
                    placeholder="请输入邮箱"
                    required
                  />
                </div>
                <div class="form-group">
                  <label>
                    <Icon icon="mdi:lock-outline" />
                    密码
                  </label>
                  <div class="password-input">
                    <input
                      v-model="authForm.password"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="请输入密码"
                      required
                      minlength="6"
                    />
                    <button type="button" class="btn-toggle-password" @click="showPassword = !showPassword">
                      <Icon :icon="showPassword ? 'mdi:eye-off' : 'mdi:eye'" />
                    </button>
                  </div>
                </div>
                <div v-if="isRegistering" class="form-group">
                  <label>
                    <Icon icon="mdi:lock-check-outline" />
                    确认密码
                  </label>
                  <input
                    v-model="authForm.confirmPassword"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="请再次输入密码"
                    required
                  />
                </div>
                <div v-if="authError" class="auth-error">
                  <Icon icon="mdi:alert-circle" />
                  <span>{{ authError }}</span>
                </div>
                <button type="submit" class="btn-submit" :disabled="isSubmitting || userStore.isLoading">
                  <Icon v-if="isSubmitting || userStore.isLoading" icon="mdi:loading" class="spin" />
                  <span v-else>{{ isRegistering ? '注册' : '登录' }}</span>
                </button>
              </form>
              <div class="auth-switch">
                <span>{{ isRegistering ? '已有账号？' : '还没有账号？' }}</span>
                <button type="button" class="btn-switch" @click="isRegistering = !isRegistering">
                  {{ isRegistering ? '立即登录' : '立即注册' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 个人资料模态框 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showProfileModal" class="modal-overlay" @click.self="closeProfileModal">
          <div class="modal-container">
            <div class="modal-header">
              <h3>个人资料</h3>
              <button class="btn-close" @click="closeProfileModal">
                <Icon icon="mdi:close" />
              </button>
            </div>
            <div class="modal-body">
              <div class="profile-info">
                <div class="avatar-huge">
                  <Icon icon="mdi:account-circle" />
                </div>
                <div class="info-list">
                  <div class="info-item">
                    <span class="info-label">用户名</span>
                    <span class="info-value">{{ userStore.user?.username }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">邮箱</span>
                    <span class="info-value">{{ userStore.user?.email }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">注册时间</span>
                    <span class="info-value">{{ formatDate(userStore.user?.created_at) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 修改密码模态框 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showPasswordModal" class="modal-overlay" @click.self="closePasswordModal">
          <div class="modal-container">
            <div class="modal-header">
              <h3>修改密码</h3>
              <button class="btn-close" @click="closePasswordModal">
                <Icon icon="mdi:close" />
              </button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="handlePasswordChange">
                <div class="form-group">
                  <label>
                    <Icon icon="mdi:lock-outline" />
                    当前密码
                  </label>
                  <input
                    v-model="passwordForm.oldPassword"
                    type="password"
                    placeholder="请输入当前密码"
                    required
                  />
                </div>
                <div class="form-group">
                  <label>
                    <Icon icon="mdi:lock-plus-outline" />
                    新密码
                  </label>
                  <input
                    v-model="passwordForm.newPassword"
                    type="password"
                    placeholder="请输入新密码（至少6位）"
                    required
                    minlength="6"
                  />
                </div>
                <div class="form-group">
                  <label>
                    <Icon icon="mdi:lock-check-outline" />
                    确认新密码
                  </label>
                  <input
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    placeholder="请再次输入新密码"
                    required
                  />
                </div>
                <div v-if="passwordError" class="auth-error">
                  <Icon icon="mdi:alert-circle" />
                  <span>{{ passwordError }}</span>
                </div>
                <div v-if="passwordSuccess" class="auth-success">
                  <Icon icon="mdi:check-circle" />
                  <span>{{ passwordSuccess }}</span>
                </div>
                <button type="submit" class="btn-submit" :disabled="isChangingPassword || userStore.isLoading">
                  <Icon v-if="isChangingPassword || userStore.isLoading" icon="mdi:loading" class="spin" />
                  <span v-else>确认修改</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const profileRef = ref(null)
const isDropdownOpen = ref(false)
const showProfileModal = ref(false)
const showPasswordModal = ref(false)
const isRegistering = ref(false)
const showPassword = ref(false)
const authError = ref('')
const passwordError = ref('')
const passwordSuccess = ref('')
const isSubmitting = ref(false)
const isChangingPassword = ref(false)

const authForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 点击外部关闭下拉菜单
const handleClickOutside = (event) => {
  if (profileRef.value && !profileRef.value.contains(event.target)) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const closeDropdown = () => {
  isDropdownOpen.value = false
}

const openProfileModal = () => {
  closeDropdown()
  showProfileModal.value = true
}

const openPasswordModal = () => {
  closeDropdown()
  showPasswordModal.value = true
}

const closeLoginModal = () => {
  userStore.closeLoginModal()
  authError.value = ''
  resetAuthForm()
}

const closeProfileModal = () => {
  showProfileModal.value = false
}

const closePasswordModal = () => {
  showPasswordModal.value = false
  passwordError.value = ''
  passwordSuccess.value = ''
  resetPasswordForm()
}

const resetAuthForm = () => {
  authForm.username = ''
  authForm.email = ''
  authForm.password = ''
  authForm.confirmPassword = ''
  isRegistering.value = false
}

const resetPasswordForm = () => {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

const handleAuthSubmit = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  authError.value = ''

  try {
    if (isRegistering.value) {
      if (authForm.password !== authForm.confirmPassword) {
        authError.value = '两次输入的密码不一致'
        return
      }
      const result = await userStore.register(authForm.username, authForm.email, authForm.password)
      if (result.success) {
        closeLoginModal()
      } else {
        authError.value = result.error
      }
    } else {
      const result = await userStore.login(authForm.username, authForm.password)
      if (result.success) {
        closeLoginModal()
      } else {
        authError.value = result.error
      }
    }
  } finally {
    isSubmitting.value = false
  }
}

const handlePasswordChange = async () => {
  if (isChangingPassword.value) return
  isChangingPassword.value = true
  passwordError.value = ''
  passwordSuccess.value = ''

  try {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      passwordError.value = '两次输入的新密码不一致'
      return
    }

    if (passwordForm.newPassword.length < 6) {
      passwordError.value = '新密码长度至少为6位'
      return
    }

    const result = await userStore.changePassword(passwordForm.oldPassword, passwordForm.newPassword)
    if (result.success) {
      passwordSuccess.value = '密码修改成功'
      setTimeout(() => {
        closePasswordModal()
      }, 1500)
    } else {
      passwordError.value = result.error
    }
  } finally {
    isChangingPassword.value = false
  }
}

const handleLogout = async () => {
  closeDropdown()
  await userStore.logout()
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.user-profile {
  position: relative;
}

.auth-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-login {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-login:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.user-menu {
  position: relative;
}

.user-avatar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.user-avatar:hover {
  background: rgba(255, 255, 255, 0.25);
}

.avatar-circle {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.username {
  color: white;
  font-weight: 500;
  font-size: 0.9rem;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  transition: transform 0.3s ease;
}

.dropdown-icon.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 240px;
  background: var(--card-bg, white);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.avatar-large {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.user-name {
  color: white;
  font-weight: 600;
  font-size: 1rem;
}

.user-email {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8rem;
}

.dropdown-divider {
  height: 1px;
  background: var(--border-color, rgba(0, 0, 0, 0.08));
  margin: 0.5rem 0;
}

.dropdown-items {
  padding: 0.5rem;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  width: 100%;
  padding: 0.8rem 1rem;
  border: none;
  background: transparent;
  color: var(--text-primary, #212529);
  font-size: 0.9rem;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background: var(--btn-secondary-bg, #f8f9fa);
}

.dropdown-item.logout {
  color: #dc3545;
}

.dropdown-item.logout:hover {
  background: rgba(220, 53, 69, 0.1);
}

.dropdown-item svg {
  font-size: 1.2rem;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-container {
  background: var(--card-bg, white);
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
}

.modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-primary, #212529);
}

.btn-close {
  background: none;
  border: none;
  color: var(--text-secondary, #6c757d);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.btn-close:hover {
  background: var(--btn-secondary-bg, #f8f9fa);
  color: var(--text-primary, #212529);
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.2rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: var(--text-secondary, #6c757d);
  font-size: 0.85rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.15));
  border-radius: 10px;
  background: var(--input-bg, white);
  color: var(--text-primary, #212529);
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #4361ee;
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
}

.password-input {
  position: relative;
}

.password-input input {
  padding-right: 2.5rem;
}

.btn-toggle-password {
  position: absolute;
  right: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-secondary, #6c757d);
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-error,
.auth-success {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.auth-error {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.auth-success {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.btn-submit {
  width: 100%;
  padding: 0.9rem;
  background: linear-gradient(135deg, #4361ee 0%, #7209b7 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(67, 97, 238, 0.3);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.2rem;
  color: var(--text-secondary, #6c757d);
  font-size: 0.9rem;
}

.btn-switch {
  background: none;
  border: none;
  color: #4361ee;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.btn-switch:hover {
  text-decoration: underline;
}

/* 个人资料样式 */
.profile-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.avatar-huge {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 3.5rem;
}

.info-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1rem;
  background: var(--btn-secondary-bg, #f8f9fa);
  border-radius: 10px;
}

.info-label {
  color: var(--text-secondary, #6c757d);
  font-size: 0.9rem;
}

.info-value {
  color: var(--text-primary, #212529);
  font-weight: 600;
  font-size: 0.95rem;
}

/* 动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
