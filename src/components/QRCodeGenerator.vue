<template>
  <div class="qrcode-container">
    <div class="card">
      <h2 class="page-title">
        <Icon icon="fa7-solid:qrcode" />
        <span>二维码生成器</span>
      </h2>

      <div class="input-section">
        <div class="input-box">
          <label><Icon icon="fa7-solid:text-height" /> 内容</label>
          <textarea
            v-model="content"
            placeholder="请输入要生成二维码的内容（文本、URL 等）"
            maxlength="512"
          ></textarea>
          <div class="char-count">
            <span :class="{ warning: content.length > 256 }">{{ content.length }}</span>/512
          </div>
        </div>

        <div class="options-row">
          <div class="option-box">
            <label><Icon icon="fa7-solid:image" /> 尺寸</label>
            <select v-model="size">
              <option v-for="s in sizes" :key="s" :value="s">{{ s }}px</option>
            </select>
          </div>

          <div class="option-box">
            <label><Icon icon="fa7-solid:pencil-alt" /> 纠错级别</label>
            <select v-model="errorLevel">
              <option v-for="level in errorLevels" :key="level.value" :value="level.value">
                {{ level.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="preview-section">
        <div class="qrcode-wrapper" v-if="content" @click="randomizeColors">
          <QRCodeVue
            :value="content"
            :size="size"
            :level="errorLevel"
            :color="fgColor"
            :background="bgColor"
            :margin="20"
            class="qrcode-image"
          />
          <div class="qrcode-overlay">
            <Icon icon="fa7-solid:sync-alt" />
            <span>点击随机换色</span>
          </div>
        </div>
        <div class="empty-state" v-else>
          <Icon icon="fa7-solid:qrcode" />
          <p>请输入内容生成二维码</p>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-download" @click="downloadQRCode" :disabled="!content">
          <Icon icon="fa7-solid:download" />
          <span>下载二维码</span>
        </button>
        <button class="btn btn-random" @click="randomizeColors" :disabled="!content">
          <Icon icon="fa7-solid:sync-alt" />
          <span>随机换色</span>
        </button>
        <button class="btn btn-reset" @click="reset">
          <Icon icon="fa7-solid:trash-alt" />
          <span>清空</span>
        </button>
      </div>

      <div class="tips">
        <Icon icon="fa7-solid:info-circle" />
        <span>提示：点击二维码或按钮可随机更换颜色，支持文本、URL、联系方式等内容</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import QRCodeVue from 'qrcode.vue'

const content = ref('')
const size = ref(200)
const errorLevel = ref('M')
const fgColor = ref('#000000')
const bgColor = ref('#07C160')

const sizes = [200, 250, 300, 350, 400, 450, 500]
const errorLevels = [
  { value: 'L', label: 'L 级 (7%)' },
  { value: 'M', label: 'M 级 (15%)' },
  { value: 'Q', label: 'Q 级 (25%)' },
  { value: 'H', label: 'H 级 (30%)' }
]

const getRandomHex = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
}

const randomizeColors = () => {
  if (!content.value) return
  fgColor.value = getRandomHex()
  bgColor.value = getRandomHex()
}

const downloadQRCode = () => {
  if (!content.value) return

  const canvas = document.querySelector('.qrcode-image canvas')
  if (!canvas) return

  const link = document.createElement('a')
  link.download = `qrcode-${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

const reset = () => {
  content.value = ''
  fgColor.value = '#000000'
  bgColor.value = '#07C160'
}
</script>

<style scoped>
.qrcode-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 30px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.page-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 600;
}

.page-title svg {
  color: var(--primary-color);
  width: 28px;
  height: 28px;
}

.input-section {
  margin-bottom: 24px;
}

.input-box {
  margin-bottom: 16px;
}

.input-box label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.input-box label svg {
  color: var(--primary-color);
  width: 14px;
  height: 14px;
}

.input-box textarea {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 16px;
  outline: none;
  background: var(--input-bg);
  color: var(--text-primary);
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  transition: all 0.3s ease;
}

.input-box textarea:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.15);
}

.char-count {
  display: flex;
  justify-content: flex-end;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 6px;
}

.char-count.warning {
  color: var(--warning-color);
}

.options-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.option-box {
  margin-bottom: 0;
}

.option-box label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.option-box label svg {
  color: var(--primary-color);
  width: 14px;
  height: 14px;
}

.option-box select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  outline: none;
  background: var(--input-bg);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.option-box select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.15);
}

.preview-section {
  margin-bottom: 24px;
  text-align: center;
}

.qrcode-wrapper {
  display: inline-block;
  position: relative;
  padding: 16px;
  background: bgColor;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.3s ease;
}

.qrcode-wrapper:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
  transform: scale(1.02);
}

.qrcode-wrapper:hover .qrcode-overlay {
  opacity: 1;
}

.qrcode-image {
  display: block;
  border-radius: 4px;
}

.qrcode-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: all 0.3s ease;
  gap: 8px;
}

.qrcode-overlay svg {
  width: 32px;
  height: 32px;
}

.empty-state {
  padding: 60px 20px;
  color: var(--text-muted);
}

.empty-state svg {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 16px;
  color: var(--text-secondary);
}

.actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.btn {
  flex: 1;
  padding: 14px 16px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn svg {
  width: 16px;
  height: 16px;
}

.btn-download {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  box-shadow: 0 4px 15px rgba(67, 97, 238, 0.3);
}

.btn-download:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(67, 97, 238, 0.4);
}

.btn-download:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-random {
  background: linear-gradient(135deg, #16a085, #1abc9c);
  color: white;
  box-shadow: 0 4px 15px rgba(22, 160, 133, 0.3);
}

.btn-random:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(22, 160, 133, 0.4);
}

.btn-random:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-reset {
  background: var(--btn-secondary-bg);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-reset:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

.tips {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: var(--result-bg);
  border-radius: 12px;
  font-size: 14px;
  color: var(--text-secondary);
}

.tips svg {
  color: var(--primary-color);
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .qrcode-container {
    padding: 16px;
  }

  .card {
    padding: 20px;
    border-radius: 12px;
  }

  .page-title {
    font-size: 20px;
    gap: 8px;
  }

  .page-title svg {
    width: 22px;
    height: 22px;
  }

  .options-row {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .input-box textarea {
    min-height: 100px;
  }

  .qrcode-wrapper {
    padding: 12px;
  }

  .qrcode-overlay svg {
    width: 24px;
    height: 24px;
  }

  .btn {
    padding: 12px 14px;
    font-size: 14px;
  }

  .btn svg {
    width: 14px;
    height: 14px;
  }
}
</style>
