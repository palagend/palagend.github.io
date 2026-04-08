<template>
  <div class="exchange-rate-container">
    <div class="card">
      <h2>实时汇率换算（含损耗计算）</h2>

      <div class="input-box">
        <label>兑换本金</label>
        <input type="number" v-model.number="amount" placeholder="请输入金额" min="0.01" step="0.01">
      </div>

      <div class="input-box">
        <div class="currency-row">
          <div class="currency-col">
            <span class="currency-label">从</span>
            <select v-model="from">
              <option value="USD">USD 美元</option>
              <option value="CNY">CNY 人民币</option>
              <option value="HKD">HKD 港币</option>
              <option value="EUR">EUR 欧元</option>
              <option value="GBP">GBP 英镑</option>
              <option value="JPY">JPY 日元</option>
              <option value="KRW">KRW 韩元</option>
              <option value="SGD">SGD 新加坡元</option>
              <option value="AUD">AUD 澳元</option>
              <option value="CAD">CAD 加元</option>
              <option value="CHF">CHF 瑞郎</option>
            </select>
          </div>
          <button class="swap-btn" @click="swapCurrency">⇄</button>
          <div class="currency-col">
            <span class="currency-label">到</span>
            <select v-model="to">
              <option value="CNY">CNY 人民币</option>
              <option value="USD">USD 美元</option>
              <option value="HKD">HKD 港币</option>
              <option value="EUR">EUR 欧元</option>
              <option value="GBP">GBP 英镑</option>
              <option value="JPY">JPY 日元</option>
              <option value="KRW">KRW 韩元</option>
              <option value="SGD">SGD 新加坡元</option>
              <option value="AUD">AUD 澳元</option>
              <option value="CAD">CAD 加元</option>
              <option value="CHF">CHF 瑞郎</option>
            </select>
          </div>
        </div>
      </div>

      <button class="btn btn-query" @click="getRate">查询市场中间价</button>

      <div class="result" v-if="result">
        {{ amount }}{{ from }} = <strong>{{ result }}</strong>{{ to }}<br>
        <span style="font-size: 15px; color: #666;">(1{{ from }} = <strong>{{ rateFixed }}</strong>{{ to }})</span>
      </div>
      <div class="time" v-if="updateTime">
        中间价更新时间：{{ updateTime }}
      </div>

      <div class="divider" v-if="result"></div>

      <div v-if="result">
        <div class="input-box">
          <label>实际到账{{ to }}金额</label>
          <input type="number" v-model.number="actualAmount" placeholder="输入实际到账金额" min="0.01" step="0.01">
        </div>
        <button class="btn btn-calc-loss" @click="calcLoss">计算兑换损耗</button>

        <div class="loss-result" v-if="lossData.show">
          <p>本次损耗：{{ lossData.currentLoss.toFixed(4) }} {{ to }}</p>
          <p>每1万{{ from }}损耗：{{ lossData.per10000Loss.toFixed(4) }} {{ to }}</p>
          <p>损耗百分比：<strong>{{ lossData.lossRate.toFixed(2) }}%</strong></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const amount = ref(1)
const from = ref('USD')
const to = ref('CNY')
const result = ref('')
const rateFixed = ref('')
const updateTime = ref('')
const actualAmount = ref('')
const lossData = ref({
  show: false,
  currentLoss: 0,
  per10000Loss: 0,
  lossRate: 0
})

const apiKey = "750a5c496977bdfc9770fa43bd914d07"
const baseUrl = "https://api.exchangerate.host/live"
const targetCurrencies = "USD,EUR,HKD,CNY,GBP,AUD,CHF,CAD,JPY,SGD,SEK,DKK,NOK,MXN,INR,BRL,RUB,KRW,THB"

const swapCurrency = () => {
  [from.value, to.value] = [to.value, from.value]
  clearResult()
}

const clearResult = () => {
  result.value = ''
  rateFixed.value = ''
  updateTime.value = ''
  actualAmount.value = ''
  lossData.value.show = false
}

const getRate = async () => {
  clearResult()
  if (!amount.value || amount.value <= 0) {
    result.value = '请输入大于0的金额'
    return
  }

  try {
    const url = `${baseUrl}?access_key=${apiKey}&source=${from.value}&currencies=${targetCurrencies}`
    const { data } = await axios.get(url)

    if (!data.success) {
      result.value = `接口错误：${data.error?.info || '获取失败'}`
      return
    }

    const rateKey = from.value + to.value
    const rate = data.quotes?.[rateKey]
    if (!rate) {
      result.value = '未查询到该货币对汇率'
      return
    }

    rateFixed.value = rate.toFixed(6)
    result.value = (amount.value * rate).toFixed(4)
    updateTime.value = new Date().toLocaleString()
  } catch (err) {
    result.value = '网络错误，请检查连接'
  }
}

const calcLoss = () => {
  if (!actualAmount.value || actualAmount.value <= 0) {
    alert(`请输入大于0的实际到账${to.value}金额`)
    return
  }
  const currentLoss = result.value - actualAmount.value
  if (currentLoss < 0) {
    alert('实际到账金额不能高于市场中间价')
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
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.exchange-rate-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
  font-size: 18px;
}

.input-box {
  margin-bottom: 16px;
}

label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #666;
}

input, select {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 16px;
  outline: none;
  background: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

input:focus, select:focus {
  border-color: #007aff;
}

.currency-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.currency-col {
  flex: 1;
  position: relative;
}

.currency-label {
  position: absolute;
  top: -5px;
  left: 8px;
  background: #fff;
  padding: 0 4px;
  font-size: 12px;
  color: #007aff;
  font-weight: 500;
  z-index: 1;
}

.swap-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: #f8f9fa;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #007aff;
  flex-shrink: 0;
}

.swap-btn:active {
  background: #eef2f5;
  border-color: #007aff;
}

.btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  cursor: pointer;
  color: white;
}

.btn-query {
  background: #007aff;
}

.btn-query:active {
  background: #0066cc;
}

.btn-calc-loss {
  background: #ffc107;
  color: #212529;
  font-weight: 500;
}

.btn-calc-loss:active {
  background: #ffb300;
}

.result {
  margin-top: 16px;
  padding: 14px;
  background: #f8f9fa;
  border-radius: 12px;
  text-align: center;
  font-size: 17px;
  line-height: 1.4;
}

.result strong {
  color: #007aff;
}

.loss-result {
  margin-top: 16px;
  padding: 14px;
  background: #fff5f5;
  border: 1px solid #ffeeee;
  border-radius: 12px;
  font-size: 15px;
}

.loss-result p {
  margin: 4px 0;
  text-align: center;
}

.loss-result strong {
  color: #e53935;
}

.time {
  font-size: 11px;
  color: #999;
  text-align: center;
  margin-top: 8px;
}

.divider {
  height: 1px;
  background: #eee;
  margin: 20px 0 16px;
}

.btn + .btn {
  margin-top: 10px;
}

select option {
  font-size: 16px;
  padding: 4px;
}
</style>
