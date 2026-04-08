<template>
  <div class="crypto-container">
    <div class="card">
      <h2>💰 加密货币投资组合追踪器</h2>
      
      <!-- 总资产概览 -->
      <div class="overview">
        <div class="total-value">
          <h3>总资产价值</h3>
          <p class="amount">{{ totalValue.toFixed(2) }} USD</p>
        </div>
        <div class="profit-loss" :class="{ positive: totalProfitLoss >= 0, negative: totalProfitLoss < 0 }">
          <h3>总盈亏</h3>
          <p class="amount">{{ totalProfitLoss >= 0 ? '+' : '' }}{{ totalProfitLoss.toFixed(2) }} USD</p>
          <p class="rate">({{ totalProfitLoss >= 0 ? '+' : '' }}{{ totalProfitLossRate.toFixed(2) }}%)</p>
        </div>
      </div>
      
      <!-- 添加加密货币 -->
      <div class="add-crypto">
        <h3>添加加密货币</h3>
        <div class="input-row">
          <select v-model="newCrypto.symbol">
            <option value="">选择加密货币</option>
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="ETH">Ethereum (ETH)</option>
            <option value="BNB">Binance Coin (BNB)</option>
            <option value="XRP">Ripple (XRP)</option>
            <option value="ADA">Cardano (ADA)</option>
            <option value="SOL">Solana (SOL)</option>
            <option value="DOT">Polkadot (DOT)</option>
            <option value="DOGE">Dogecoin (DOGE)</option>
            <option value="SHIB">Shiba Inu (SHIB)</option>
            <option value="AVAX">Avalanche (AVAX)</option>
          </select>
          <input type="number" v-model.number="newCrypto.amount" placeholder="数量" min="0.00000001" step="0.00000001">
          <input type="number" v-model.number="newCrypto.price" placeholder="买入价格 (USD)" min="0.00000001" step="0.00000001">
          <button class="btn-add" @click="addCrypto">添加</button>
        </div>
      </div>
      
      <!-- 投资组合列表 -->
      <div class="portfolio-list">
        <h3>我的投资组合</h3>
        <div class="table-header">
          <div class="col">加密货币</div>
          <div class="col">数量</div>
          <div class="col">买入价格</div>
          <div class="col">当前价格</div>
          <div class="col">市值</div>
          <div class="col">盈亏</div>
          <div class="col">操作</div>
        </div>
        <div class="table-body">
          <div v-for="(crypto, index) in portfolio" :key="index" class="table-row">
            <div class="col">{{ crypto.symbol }}</div>
            <div class="col">{{ crypto.amount.toFixed(8) }}</div>
            <div class="col">{{ crypto.price.toFixed(2) }} USD</div>
            <div class="col">{{ crypto.currentPrice.toFixed(2) }} USD</div>
            <div class="col">{{ (crypto.amount * crypto.currentPrice).toFixed(2) }} USD</div>
            <div class="col" :class="{ positive: crypto.profitLoss >= 0, negative: crypto.profitLoss < 0 }">
              {{ crypto.profitLoss >= 0 ? '+' : '' }}{{ crypto.profitLoss.toFixed(2) }} USD ({{ crypto.profitLossRate.toFixed(2) }}%)
            </div>
            <div class="col">
              <button class="btn-delete" @click="deleteCrypto(index)">删除</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 刷新按钮 -->
      <div class="refresh-section">
        <button class="btn-refresh" @click="refreshPrices">
          <span v-if="!refreshing">🔄 刷新价格</span>
          <span v-else>⏳ 刷新中...</span>
        </button>
        <div class="last-update">
          <p>最后更新时间：{{ lastUpdateTime }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const portfolio = ref([])
const newCrypto = ref({
  symbol: '',
  amount: 0,
  price: 0
})
const prices = ref({})
const refreshing = ref(false)
const lastUpdateTime = ref('')

// 添加加密货币
const addCrypto = () => {
  if (!newCrypto.value.symbol || newCrypto.value.amount <= 0 || newCrypto.value.price <= 0) {
    alert('请填写完整信息')
    return
  }
  
  portfolio.value.push({
    symbol: newCrypto.value.symbol,
    amount: newCrypto.value.amount,
    price: newCrypto.value.price,
    currentPrice: 0
  })
  
  newCrypto.value = {
    symbol: '',
    amount: 0,
    price: 0
  }
  
  refreshPrices()
}

// 删除加密货币
const deleteCrypto = (index) => {
  portfolio.value.splice(index, 1)
}

// 从coincap获取实时价格
const getPricesFromCoincap = async () => {
  try {
    const response = await axios.get('https://api.coincap.io/v2/assets')
    const data = response.data.data
    
    data.forEach(item => {
      const symbol = item.symbol
      const price = parseFloat(item.priceUsd)
      prices.value[symbol] = price
    })
  } catch (error) {
    console.error('Failed to get prices from coincap:', error)
  }
}

// 从gate.io获取实时价格
const getPricesFromGateio = async () => {
  try {
    const response = await axios.get('https://api.gateio.ws/api/v4/spot/tickers')
    const data = response.data
    
    data.forEach(item => {
      const symbol = item.currency_pair.split('_')[0]
      const price = parseFloat(item.last)
      prices.value[symbol] = price
    })
  } catch (error) {
    console.error('Failed to get prices from gate.io:', error)
  }
}

// 刷新价格
const refreshPrices = async () => {
  refreshing.value = true
  
  await Promise.all([
    getPricesFromCoincap(),
    getPricesFromGateio()
  ])
  
  portfolio.value.forEach(crypto => {
    crypto.currentPrice = prices.value[crypto.symbol] || 0
    crypto.profitLoss = crypto.amount * (crypto.currentPrice - crypto.price)
    crypto.profitLossRate = ((crypto.currentPrice - crypto.price) / crypto.price) * 100
  })
  
  lastUpdateTime.value = new Date().toLocaleString()
  refreshing.value = false
}

// 计算总资产
const totalValue = computed(() => {
  return portfolio.value.reduce((total, crypto) => {
    return total + (crypto.amount * crypto.currentPrice)
  }, 0)
})

// 计算总盈亏
const totalProfitLoss = computed(() => {
  return portfolio.value.reduce((total, crypto) => {
    return total + (crypto.amount * (crypto.currentPrice - crypto.price))
  }, 0)
})

// 计算总盈亏率
const totalProfitLossRate = computed(() => {
  const totalInvestment = portfolio.value.reduce((total, crypto) => {
    return total + (crypto.amount * crypto.price)
  }, 0)
  
  if (totalInvestment === 0) return 0
  return (totalProfitLoss.value / totalInvestment) * 100
})

// 组件挂载时初始化
onMounted(() => {
  refreshPrices()
})
</script>

<style scoped>
.crypto-container {
  max-width: 1200px;
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
  margin-bottom: 30px;
  color: #667eea;
  font-size: 28px;
  font-weight: 600;
}

/* 概览 */
.overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.total-value, .profit-loss {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.total-value h3, .profit-loss h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #666;
  font-weight: 500;
}

.total-value .amount {
  font-size: 28px;
  font-weight: 700;
  color: #667eea;
  margin: 0;
}

.profit-loss .amount {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}

.profit-loss .rate {
  font-size: 14px;
  color: #666;
  margin: 5px 0 0 0;
}

.profit-loss.positive .amount {
  color: #28a745;
}

.profit-loss.negative .amount {
  color: #dc3545;
}

/* 添加加密货币 */
.add-crypto {
  margin-bottom: 30px;
}

.add-crypto h3 {
  margin: 0 0 15px 0;
  font-size: 20px;
  color: #667eea;
  font-weight: 600;
}

.input-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  align-items: end;
}

.input-row select, .input-row input {
  padding: 12px 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 16px;
  outline: none;
}

.btn-add {
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  background: #667eea;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add:hover {
  background: #5568d3;
}

/* 投资组合列表 */
.portfolio-list {
  margin-bottom: 30px;
}

.portfolio-list h3 {
  margin: 0 0 15px 0;
  font-size: 20px;
  color: #667eea;
  font-weight: 600;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  gap: 10px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 12px;
  font-weight: 600;
  color: #666;
  font-size: 14px;
}

.table-body {
  margin-top: 10px;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  gap: 10px;
  padding: 15px;
  background: white;
  border-radius: 12px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.table-row .col {
  font-size: 14px;
  color: #333;
  text-align: center;
}

.table-row .col.positive {
  color: #28a745;
  font-weight: 600;
}

.table-row .col.negative {
  color: #dc3545;
  font-weight: 600;
}

.btn-delete {
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: #dc3545;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-delete:hover {
  background: #c82333;
}

/* 刷新按钮 */
.refresh-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
}

.btn-refresh {
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  background: #667eea;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-refresh:hover {
  background: #5568d3;
}

.last-update {
  font-size: 12px;
  color: #999;
}

.last-update p {
  margin: 0;
}
</style>
