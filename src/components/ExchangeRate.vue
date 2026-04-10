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
          <input type="number" v-model.number="amount" placeholder="请输入金额" min="0.01" max="99999999" step="0.01" @input="onAmountInput">
          <button v-if="amount" class="clear-btn" @click="clearAmount">
            <Icon icon="fa7-solid:xmark" />
          </button>
        </div>
        <div class="quick-amounts">
          <span class="quick-label">快捷金额：</span>
          <button v-for="amount in quickAmounts" :key="amount" class="quick-btn" @click="setAmount(amount)">
            {{ amount.toLocaleString('zh-CN', {notation: 'compact'}) }}
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
                  {{ currency.flag }} {{ currency.code }} {{ currency.name }}
                </option>
                <optgroup label="其他货币">
                  <option v-for="currency in otherCurrencies" :key="currency.code" :value="currency.code">
                    {{ currency.flag }} {{ currency.code }} {{ currency.name }}
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
                  {{ currency.flag }} {{ currency.code }} {{ currency.name }}
                </option>
                <optgroup label="其他货币">
                  <option v-for="currency in otherCurrencies" :key="currency.code" :value="currency.code">
                    {{ currency.flag }} {{ currency.code }} {{ currency.name }}
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

      <div v-if="message && message.type === 'error'" :class="['message', message.type]">
        <Icon :icon="message.type === 'error' ? 'fa7-solid:circle-exclamation' : 'fa7-solid:circle-info'" />
        <span>{{ message.text }}</span>
      </div>

      <div class="result" v-if="result" @click="copyResult">
        <div class="result-header">
          <Icon icon="fa7-solid:calculator" />
          <span>{{ amount.toLocaleString('zh-CN') }} {{ from }}</span>
          <span class="result-equals">=</span>
          <strong>{{ result.toLocaleString('zh-CN') }}</strong>
          <span class="result-currency">{{ to }}</span>
          <button class="copy-btn" :class="{ copied: copySuccess }" @click.stop="copyResult" aria-label="复制结果">
            <Icon :icon="copySuccess ? 'fa7-solid:check' : 'fa7-solid:copy'" style="color: white" />
          </button>
        </div>
        <div class="result-footer">
          <div class="rate-info">
            <Icon icon="fa7-solid:info-circle" />
            <span>1 {{ from }} = <strong>{{ rateFixed }}</strong> {{ to }}</span>
          </div>
          <div class="source-info">
            <Icon icon="fa7-solid:clock" />
            <span>{{ updateTime ? '更新：' + updateTime : '数据来源: exchangerate.host' }}</span>
          </div>
        </div>
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
                <span class="loss-value">{{ lossData.currentLoss.toLocaleString('zh-CN') }} {{ to }}</span>
              </div>
              <div class="loss-item">
                <span class="loss-label">每1万{{ from }}损耗：</span>
                <span class="loss-value">{{ lossData.per10000Loss.toLocaleString('zh-CN') }} {{ to }}</span>
              </div>
              <div class="loss-item highlight">
                <span class="loss-label">损耗百分比：</span>
                <span class="loss-value"><strong>{{ lossData.lossRate.toFixed(2) }}%</strong></span>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <div v-if="history.length" class="history-section">
        <h3 class="section-subtitle">
          <Icon icon="fa7-solid:history" />
          <span>最近查询</span>
          <button class="clear-history-btn" @click="clearHistory">
            <Icon icon="fa7-solid:trash" />
          </button>
        </h3>
        <div class="history-list">
          <div v-for="(item, index) in history" :key="index" class="history-item" @click="loadHistory(item)">
            <span class="history-amount">{{ item.amount.toLocaleString('zh-CN') }}</span>
            <span class="history-arrow">→</span>
            <span class="history-currency">{{ item.from }} → {{ item.to }}</span>
            <span class="history-rate">{{ item.rate.toLocaleString('zh-CN') }}</span>
            <span class="history-time">{{ item.time }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="toast" :class="{ show: toast.show }">
      <Icon :icon="toast.icon" />
      <span>{{ toast.text }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { Icon } from '@iconify/vue'

const amount = ref(null)
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
const retryCount = ref(0)
const maxRetries = 3

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

const quickAmounts = [100, 200, 1000, 10000, 50000, 100000, 1000000]

const commonCurrencies = ref([
  { code: 'USD', name: '美元', flag: '🇺🇸' },
  { code: 'CNY', name: '人民币', flag: '🇨🇳' },
  { code: 'HKD', name: '港币', flag: '🇭🇰' },
  { code: 'EUR', name: '欧元', flag: '🇪🇺' },
  { code: 'GBP', name: '英镑', flag: '🇬🇧' },
  { code: 'JPY', name: '日元', flag: '🇯🇵' }
])

const otherCurrencies = ref([
  { code: 'KRW', name: '韩元', flag: '🇰🇷' },
  { code: 'SGD', name: '新加坡元', flag: '🇸🇬' },
  { code: 'AUD', name: '澳元', flag: '🇦🇺' },
  { code: 'CAD', name: '加元', flag: '🇨🇦' },
  { code: 'CHF', name: '瑞郎', flag: '🇨🇭' }
])

const apiKey = "750a5c496977bdfc9770fa43bd914d07"
const primaryApiUrl = "https://api.exchangerate.host/live"
const backupApiUrl = "https://cdn.moneyconvert.net/api/latest.json"
const targetCurrencies = "USD,EUR,HKD,CNY,GBP,AUD,CHF,CAD,JPY,SGD,SEK,DKK,NOK,MXN,INR,BRL,RUB,KRW,THB"

const history = ref([])

const loadHistory = (item) => {
  amount.value = item.amount
  from.value = item.from
  to.value = item.to
  clearAll()
  getRate()
}

const saveToHistory = () => {
  if (!result.value || !amount.value) return
  
  const historyItem = {
    amount: amount.value,
    from: from.value,
    to: to.value,
    rate: rateFixed.value,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  
  const existingIndex = history.value.findIndex(item => 
    item.amount === historyItem.amount && 
    item.from === historyItem.from && 
    item.to === historyItem.to
  )
  
  if (existingIndex !== -1) {
    history.value.splice(existingIndex, 1)
  }
  
  history.value.unshift(historyItem)
  
  if (history.value.length > 6) {
    history.value.pop()
  }
  
  localStorage.setItem('exchangeRateHistory', JSON.stringify(history.value))
}

const clearHistory = () => {
  history.value = []
  localStorage.removeItem('exchangeRateHistory')
  showToast('历史记录已清除', 'fa7-solid:trash')
}

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
  retryCount.value = 0
}

const clearAmount = () => {
  amount.value = null
  clearAll()
}

const setAmount = (val) => {
  amount.value = val
  if (amount.value && amount.value > 0) {
    getRate()
  }
}

const onAmountInput = () => {
  if (amount.value && amount.value > 0) {
    if (amount.value > 99999999) {
      showToast('金额过大，请输入小于1亿的金额', 'fa7-solid:circle-exclamation')
      amount.value = 99999999
      return
    }
  }
}

const onCurrencyChange = () => {
  if (amount.value && amount.value > 0) {
    getRate()
  }
}

const toggleLossSection = () => {
  showLossSection.value = !showLossSection.value
}

const showMessage = (text, type = 'info') => {
  if (type === 'error') {
    message.value = { text, type }
    setTimeout(() => {
      message.value = null
    }, 3000)
  }
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
  
  if (amount.value > 99999999) {
    showToast('金额过大，请输入小于1亿的金额', 'fa7-solid:circle-exclamation')
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

    if (!rate && retryCount.value < maxRetries) {
      retryCount.value++
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
        if (retryCount.value < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount.value))
          getRate()
          return
        }
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
    
    saveToHistory()
    showToast('汇率查询成功', 'fa7-solid:check')
  } catch (err) {
    showToast('网络错误，请检查连接', 'fa7-solid:circle-xmark')
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
  const savedHistory = localStorage.getItem('exchangeRateHistory')
  if (savedHistory) {
    history.value = JSON.parse(savedHistory)
  }
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

.quick-amounts {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.quick-amounts::-webkit-scrollbar {
  display: none;
}

.quick-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.quick-btn {
  padding: 4px 12px;
  border: 1px solid rgba(67, 97, 238, 0.2);
  border-radius: 6px;
  background: rgba(67, 97, 238, 0.05);
  color: var(--primary-color);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.quick-btn:hover {
  background: rgba(67, 97, 238, 0.1);
  border-color: var(--primary-color);
  transform: translateY(-1px);
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
  border: 1px solid rgba(67, 97, 238, 0.2);
  background: rgba(67, 97, 238, 0.05);
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
  background: linear-gradient(135deg, #4361ee, #3f37c9);
  color: white;
  box-shadow: 0 4px 15px rgba(67, 97, 238, 0.3);
}

.btn-query:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(67, 97, 238, 0.4);
  background: linear-gradient(135deg, #3f37c9, #3a2db3);
}

.btn-query:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-calc-loss {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
}

.btn-calc-loss:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
  background: linear-gradient(135deg, #ee5a24, #d64520);
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
  padding: 24px;
  background: var(--result-bg);
  border-radius: 14px;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(67, 97, 238, 0.08);
}

.result:hover {
  box-shadow: 0 6px 24px rgba(67, 97, 238, 0.12);
  transform: translateY(-2px);
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 18px;
  color: var(--text-primary);
  margin-bottom: 16px;
  flex-wrap: wrap;
  padding: 8px 16px;
  background: rgba(67, 97, 238, 0.03);
  border-radius: 10px;
}

.result-header svg {
  color: var(--primary-color);
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.result-header span {
  color: var(--text-primary);
}

.result-equals {
  color: var(--primary-color);
  font-weight: 600;
  font-size: 20px;
}

.result-header strong {
  color: var(--primary-color);
  font-size: 28px;
  font-weight: 700;
  margin: 0 4px;
}

.result-currency {
  color: var(--text-secondary);
  font-size: 18px;
}

.copy-btn {
  position: absolute;
  right: 16px;
  top: 16px;
  background: rgba(67, 97, 238, 0.1);
  color: var(--primary-color);
  border: 1px solid rgba(67, 97, 238, 0.2);
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  z-index: 10;
}

.copy-btn:hover {
  background: rgba(67, 97, 238, 0.15);
  border-color: var(--primary-color);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(67, 97, 238, 0.2);
}

.copy-btn.copied {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
  border-color: rgba(40, 167, 69, 0.3);
  transform: scale(0.95);
}

.result-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid rgba(67, 97, 238, 0.1);
}

.rate-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.rate-info svg {
  color: var(--text-muted);
  width: 13px;
  height: 13px;
}

.rate-info strong {
  color: var(--primary-color);
  font-weight: 600;
}

.source-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.source-info svg {
  width: 11px;
  height: 11px;
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
  color: var(--primary-color);
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
  background: rgba(67, 97, 238, 0.1);
  color: var(--primary-color);
}

.clear-history-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  margin-left: auto;
}

.clear-history-btn:hover {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
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

.history-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--btn-secondary-bg);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:hover {
  background: var(--primary-color);
  color: white;
}

.history-amount {
  font-weight: 600;
  font-size: 14px;
}

.history-arrow {
  color: var(--text-muted);
}

.history-currency {
  font-size: 12px;
}

.history-rate {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-secondary);
}

.history-time {
  font-size: 11px;
  color: var(--text-muted);
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

  .result-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }

  .result-header svg {
    width: 20px;
    height: 20px;
  }

  .result-equals {
    font-size: 24px;
  }

  .result-header strong {
    font-size: 26px;
  }

  .result-currency {
    font-size: 16px;
  }

  .copy-btn {
    position: static;
    margin-top: 8px;
    transform: none;
    width: 100%;
  }

  .result-footer {
    flex-direction: column;
    gap: 6px;
    padding-top: 12px;
  }

  .rate-info {
    font-size: 12px;
  }

  .source-info {
    font-size: 10px;
  }

  .btn {
    padding: 12px 16px;
    font-size: 15px;
  }

  .loss-item.highlight {
    margin: 8px -16px;
    border-radius: 8px;
  }

  .quick-amounts {
    flex-direction: column;
    align-items: flex-start;
  }

  .quick-btn {
    width: 100%;
    text-align: center;
  }

  .history-item {
    flex-wrap: wrap;
  }

  .history-rate {
    margin-left: 0;
    width: 100%;
    text-align: right;
  }
}
</style>
