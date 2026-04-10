<template>
  <div class="exchange-rate-container">
    <div class="card">
      <h2 class="page-title">
        <Icon icon="fa7-solid:exchange-alt" />
        <span>实时汇率换算（含损耗计算）</span>
      </h2>

      <div class="input-box">
        <label><Icon icon="fa7-solid:coins" /> 兑换本金</label>
        <div class="input-with-clear">
          <input type="number" v-model.number="amount" placeholder="请输入金额" min="0.01" step="0.01" @input="onAmountInput">
          <button v-if="amount" class="clear-btn" @click="clearAmount">
            <Icon icon="fa7-solid:xmark" />
          </button>
        </div>
      </div>

      <div class="input-box">
        <div class="currency-row">
          <div class="currency-col">
            <span class="currency-label">从</span>
            <div class="currency-select-wrapper">
              <select v-model="from" @change="onCurrencyChange">
                <option v-for="currency in commonCurrencies" :key="currency.code" :value="currency.code">
                  {{ currency.code }} {{ currency.name }}
                </option>
                <optgroup label="其他货币">
                  <option v-for="currency in otherCurrencies" :key="currency.code" :value="currency.code">
                    {{ currency.code }} {{ currency.name }}
                  </option>
                </optgroup>
              </select>
              <Icon icon="fa7-solid:chevron-down" class="select-icon" />
            </div>
          </div>
          <button class="swap-btn" @click="swapCurrency">
            <Icon icon="fa7-solid:exchange-alt" />
          </button>
          <div class="currency-col">
            <span class="currency-label">到</span>
            <div class="currency-select-wrapper">
              <select v-model="to" @change="onCurrencyChange">
                <option v-for="currency in commonCurrencies" :key="currency.code" :value="currency.code">
                  {{ currency.code }} {{ currency.name }}
                </option>
                <optgroup label="其他货币">
                  <option v-for="currency in otherCurrencies" :key="currency.code" :value="currency.code">
                    {{ currency.code }} {{ currency.name }}
                  </option>
                </optgroup>
              </select>
              <Icon icon="fa7-solid:chevron-down" class="select-icon" />
            </div>
          </div>
        </div>
      </div>

      <button class="btn btn-query" @click="getRate" :disabled="loading">
        <Icon :icon="loading ? 'fa7-solid:spinner' : 'fa7-solid:search'" />
        <span>{{ loading ? '查询中...' : '查询市场中间价' }}</span>
      </button>

      <div v-if="message" :class="['message', message.type]">
        <Icon :icon="message.type === 'error' ? 'fa7-solid:circle-exclamation' : 'fa7-solid:circle-info'" />
        <span>{{ message.text }}</span>
      </div>

      <div class="result" v-if="result" @click="copyResult">
        <div class="result-main">
          <Icon icon="fa7-solid:calculator" />
          <span>{{ amount }}{{ from }} = <strong>{{ result }}</strong>{{ to }}</span>
          <button class="copy-btn" :class="{ copied: copySuccess }" @click.stop="copyResult">
            <Icon :icon="copySuccess ? 'fa7-solid:check' : 'fa7-solid:copy'" style="color: white"/>
          </button>
        </div>
        <div class="result-sub">
          <Icon icon="fa7-solid:info-circle" />
          <span>(1{{ from }} = <strong>{{ rateFixed }}</strong>{{ to }})</span>
        </div>
      </div>
      
      <div class="time" v-if="updateTime">
        <Icon icon="fa7-solid:clock" />
        <span>中间价更新时间：{{ updateTime }}</span>
      </div>
      <div class="time" v-if="!loading && !updateTime && result">
        <Icon icon="fa7-solid:info-circle" />
        <span>数据来源: exchangerate.host</span>
      </div>

      <div class="divider" v-if="result"></div>

      <div v-if="result" class="loss-section">
        <h3 class="section-subtitle">
          <Icon icon="fa7-solid:percentage" />
          <span>兑换损耗计算</span>
          <button class="toggle-btn" @click="toggleLossSection">
            <Icon :icon="showLossSection ? 'fa7-solid:chevron-up' : 'fa7-solid:chevron-down'" />
          </button>
        </h3>
        
        <transition name="expand">
          <div v-show="showLossSection" class="loss-content">
            <div class="input-box">
              <label><Icon icon="fa7-solid:hand-holding-usd" /> 实际到账{{ to }}金额</label>
              <input type="number" v-model.number="actualAmount" placeholder="输入实际到账金额" min="0.01" step="0.01">
            </div>
            <button class="btn btn-calc-loss" @click="calcLoss">
              <Icon icon="fa7-solid:calculator" />
              <span>计算兑换损耗</span>
            </button>

            <div class="loss-result" v-if="lossData.show">
              <div class="loss-item">
                <span class="loss-label">本次损耗：</span>
                <span class="loss-value">{{ lossData.currentLoss.toFixed(4) }} {{ to }}</span>
              </div>
              <div class="loss-item">
                <span class="loss-label">每1万{{ from }}损耗：</span>
                <span class="loss-value">{{ lossData.per10000Loss.toFixed(4) }} {{ to }}</span>
              </div>
              <div class="loss-item highlight">
                <span class="loss-label">损耗百分比：</span>
                <span class="loss-value"><strong>{{ lossData.lossRate.toFixed(2) }}%</strong></span>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <div class="toast" :class="{ show: toast.show }">
      <Icon :icon="toast.icon" />
      <span>{{ toast.text }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { Icon } from '@iconify/vue'

const amount = ref(1)
const from = ref('USD')
const to = ref('CNY')
const result = ref('')
const rateFixed = ref('')
const updateTime = ref('')
const actualAmount = ref('')
const loading = ref(false)
const showLossSection = ref(true)
const copySuccess = ref(false)
const message = ref(null)

const lossData = ref({
  show: false,
  currentLoss: 0,
  per10000Loss: 0,
  lossRate: 0
})

const toast = ref({
  show: false,
  text: '',
  icon: 'fa7-solid:check'
})

const commonCurrencies = ref([
  { code: 'USD', name: '美元' },
  { code: 'CNY', name: '人民币' },
  { code: 'HKD', name: '港币' },
  { code: 'EUR', name: '欧元' },
  { code: 'GBP', name: '英镑' },
  { code: 'JPY', name: '日元' }
])

const otherCurrencies = ref([
  { code: 'KRW', name: '韩元' },
  { code: 'SGD', name: '新加坡元' },
  { code: 'AUD', name: '澳元' },
  { code: 'CAD', name: '加元' },
  { code: 'CHF', name: '瑞郎' }
])

const apiKey = "750a5c496977bdfc9770fa43bd914d07"
const primaryApiUrl = "https://api.exchangerate.host/live"
const backupApiUrl = "https://cdn.moneyconvert.net/api/latest.json"
const targetCurrencies = "USD,EUR,HKD,CNY,GBP,AUD,CHF,CAD,JPY,SGD,SEK,DKK,NOK,MXN,INR,BRL,RUB,KRW,THB"

const swapCurrency = () => {
  [from.value, to.value] = [to.value, from.value]
  clearAll()
}

const clearAll = () => {
  result.value = ''
  rateFixed.value = ''
  updateTime.value = ''
  actualAmount.value = ''
  lossData.value.show = false
  message.value = null
}

const clearAmount = () => {
  amount.value = null
  clearAll()
}

const onAmountInput = () => {
  if (amount.value && amount.value > 0) {
    debouncedQuery()
  } else {
    clearAll()
  }
}

const onCurrencyChange = () => {
  if (amount.value && amount.value > 0) {
    debouncedQuery()
  }
}

let queryTimer = null
const debouncedQuery = () => {
  if (queryTimer) {
    clearTimeout(queryTimer)
  }
  queryTimer = setTimeout(() => {
    getRate()
  }, 500)
}

const toggleLossSection = () => {
  showLossSection.value = !showLossSection.value
}

const showMessage = (text, type = 'info') => {
  message.value = { text, type }
  setTimeout(() => {
    message.value = null
  }, 3000)
}

const showToast = (text, icon = 'fa7-solid:check') => {
  toast.value = { show: true, text, icon }
  setTimeout(() => {
    toast.value.show = false
  }, 2000)
}

const copyResult = async () => {
  if (!result.value) return
  
  try {
    const text = `${amount.value} ${from.value} = ${result.value} ${to.value}`
    await navigator.clipboard.writeText(text)
    copySuccess.value = true
    showToast('结果已复制到剪贴板', 'fa7-solid:check')
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    showToast('复制失败，请重试', 'fa7-solid:xmark')
  }
}

const getRate = async () => {
  clearAll()
  
  if (!amount.value || amount.value <= 0) {
    showMessage('请输入大于 0 的金额', 'error')
    return
  }

  loading.value = true

  try {
    let data = null
    let rate = null
    let apiTime = null

    try {
      const primaryUrl = `${primaryApiUrl}?access_key=${apiKey}&source=${from.value}&currencies=${targetCurrencies}`
      const response = await axios.get(primaryUrl)
      data = response.data

      if (data.success) {
        const rateKey = from.value + to.value
        rate = data.quotes?.[rateKey]
        apiTime = data.timestamp
      }
    } catch (primaryError) {
      console.log('Primary API failed, trying backup API:', primaryError.message)
    }

    if (!rate) {
      try {
        const backupResponse = await axios.get(backupApiUrl)
        const backupData = backupResponse.data

        if (backupData.rates) {
          const fromRate = backupData.rates[from.value] || 1
          const toRate = backupData.rates[to.value]

          if (fromRate && toRate) {
            rate = toRate / fromRate
            apiTime = backupData.ts
          }
        }
      } catch (backupError) {
        console.error('Backup API also failed:', backupError.message)
        throw new Error('Both APIs failed')
      }
    }

    if (!rate) {
      showMessage('未查询到该货币对汇率', 'error')
      return
    }

    rateFixed.value = rate.toFixed(6)
    result.value = (amount.value * rate).toFixed(4)
    
    if (apiTime) {
      updateTime.value = new Date(apiTime).toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      updateTime.value = new Date().toLocaleString()
    }
    
    showMessage('汇率查询成功', 'success')
  } catch (err) {
    showMessage('网络错误，请检查连接', 'error')
  } finally {
    loading.value = false
  }
}

const calcLoss = () => {
  if (!actualAmount.value || actualAmount.value <= 0) {
    showToast(`请输入大于0的实际到账${to.value}金额`, 'fa7-solid:circle-exclamation')
    return
  }
  
  const currentLoss = result.value - actualAmount.value
  if (currentLoss < 0) {
    showToast('实际到账金额不能高于市场中间价', 'fa7-solid:circle-xmark')
    return
  }
  
  const lossRate = (currentLoss / result.value) * 100
  const per10000Loss = (currentLoss / amount.value) * 10000

  lossData.value = {
    show: true,
    currentLoss,
    per10000Loss,
    lossRate
  }
  
  showToast('损耗计算完成', 'fa7-solid:percent')
}

onMounted(() => {
  getRate()
})
</script>

<style scoped>
.exchange-rate-container {
  max-width: 600px;
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
  font-size: 20px;
  font-weight: 600;
}

.page-title svg {
  color: var(--primary-color);
  width: 24px;
  height: 24px;
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
  width: 12px;
  height: 12px;
}

.input-with-clear {
  position: relative;
}

.input-with-clear input {
  padding-right: 36px;
}

.clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

input, select {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 16px;
  outline: none;
  background: var(--input-bg);
  color: var(--text-primary);
  transition: all 0.3s ease;
}

input:focus, select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.15);
}

.currency-select-wrapper {
  position: relative;
}

.select-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
  width: 16px;
  height: 16px;
}

select {
  appearance: none;
  background-image: none;
}

select::-ms-expand {
  display: none;
}

.currency-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.currency-col {
  flex: 1;
  position: relative;
}

.currency-label {
  position: absolute;
  top: -6px;
  left: 10px;
  background: var(--card-bg);
  padding: 0 6px;
  font-size: 11px;
  color: var(--primary-color);
  font-weight: 600;
  z-index: 1;
  transition: background 0.3s ease;
}

.swap-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--btn-secondary-bg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.swap-btn svg {
  width: 16px;
  height: 16px;
}

.swap-btn:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.btn {
  width: 100%;
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
}

.btn svg {
  width: 16px;
  height: 16px;
}

.btn-query {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  box-shadow: 0 4px 15px rgba(67, 97, 238, 0.3);
}

.btn-query:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(67, 97, 238, 0.4);
}

.btn-query:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-calc-loss {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: white;
  box-shadow: 0 4px 15px rgba(245, 87, 108, 0.3);
}

.btn-calc-loss:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 87, 108, 0.4);
}

.message {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.message.error {
  background: rgba(245, 87, 108, 0.1);
  color: #f5576c;
  border: 1px solid rgba(245, 87, 108, 0.2);
}

.message.success {
  background: rgba(67, 97, 238, 0.1);
  color: var(--primary-color);
  border: 1px solid rgba(67, 97, 238, 0.2);
}

.message.info {
  background: rgba(240, 147, 251, 0.1);
  color: #f093fb;
  border: 1px solid rgba(240, 147, 251, 0.2);
}

.message svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.result {
  margin-top: 20px;
  padding: 20px;
  background: var(--result-bg);
  border-radius: 14px;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.result:hover {
  box-shadow: 0 4px 20px rgba(67, 97, 238, 0.15);
}

.result-main {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 20px;
  color: var(--text-primary);
  margin-bottom: 8px;
  position: relative;
}

.result-main svg {
  color: var(--primary-color);
  width: 20px;
  height: 20px;
}

.result-main strong {
  color: var(--primary-color);
  font-size: 24px;
}

.result-sub {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.result-sub svg {
  color: var(--text-muted);
  width: 14px;
  height: 14px;
}

.copy-btn {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: var(--secondary-color);
}

.copy-btn.copied {
  background: #28a745;
}

.loss-section {
  margin-top: 20px;
}

.section-subtitle {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 600;
}

.section-subtitle svg {
  color: #f5576c;
  width: 16px;
  height: 16px;
}

.toggle-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  margin-left: auto;
}

.toggle-btn:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

.loss-content {
  overflow: hidden;
}

.expand-enter-active,
.expand-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease;
  max-height: 500px;
  opacity: 1;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.loss-result {
  margin-top: 16px;
  padding: 16px;
  background: var(--loss-bg);
  border-radius: 14px;
  transition: all 0.3s ease;
  border: 1px solid var(--loss-border);
}

.loss-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
}

.loss-item:last-child {
  border-bottom: none;
}

.loss-item.highlight {
  background: linear-gradient(135deg, rgba(245, 87, 108, 0.1), rgba(240, 147, 251, 0.1));
  margin: 8px -16px -16px;
  padding: 12px 16px;
  border-radius: 0 0 14px 14px;
  border-bottom: none;
}

.loss-label {
  color: var(--text-secondary);
  font-size: 14px;
}

.loss-value {
  color: var(--text-primary);
  font-weight: 600;
}

.loss-item.highlight .loss-value {
  color: #f5576c;
  font-size: 18px;
}

.time {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 12px;
}

.time svg {
  width: 12px;
  height: 12px;
}

.divider {
  height: 1px;
  background: var(--border-color);
  margin: 24px 0;
}

.toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.toast.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

.toast svg {
  width: 18px;
  height: 18px;
}

@media (max-width: 480px) {
  .exchange-rate-container {
    padding: 12px;
  }

  .card {
    padding: 20px;
    border-radius: 12px;
  }

  .page-title {
    font-size: 18px;
    gap: 8px;
  }

  .page-title svg {
    width: 20px;
    height: 20px;
  }

  .currency-row {
    flex-direction: column;
    gap: 12px;
  }

  .currency-col {
    width: 100%;
  }

  .swap-btn {
    width: 100%;
    height: 36px;
  }

  .result-main {
    font-size: 18px;
    flex-direction: column;
    gap: 4px;
  }

  .result-main strong {
    font-size: 22px;
  }

  .btn {
    padding: 12px 16px;
    font-size: 15px;
  }

  .copy-btn {
    position: static;
    margin-left: 8px;
    transform: none;
  }

  .loss-item.highlight {
    margin: 8px -16px;
    border-radius: 8px;
  }
}
</style>
