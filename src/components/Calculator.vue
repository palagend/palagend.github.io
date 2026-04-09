<template>
  <div class="calculator-container">
    <div class="card">
      <h2 class="page-title">
        <Icon icon="fa7-solid:calculator" />
        <span>实用计算器</span>
      </h2>

      <div class="tabs">
        <button class="tab-btn" :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">
          <Icon icon="fa7-solid:calculator" />
          <span>基础计算</span>
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'unit' }" @click="activeTab = 'unit'">
          <Icon icon="fa7-solid:exchange-alt" />
          <span>单位转换</span>
        </button>
      </div>

      <div v-if="activeTab === 'basic'" class="calculator">
        <div class="display">
          <div class="history">{{ history }}</div>
          <div class="input">{{ input || '0' }}</div>
        </div>

        <div class="buttons">
          <button class="btn btn-clear" @click="clear">
            <Icon icon="fa7-solid:trash-alt" />
          </button>
          <button class="btn btn-operator" @click="append('%')">%</button>
          <button class="btn btn-operator" @click="append('/')">
            <Icon icon="fa7-solid:divide" />
          </button>
          <button class="btn btn-operator" @click="append('×')">
            <Icon icon="fa7-solid:times" />
          </button>

          <button class="btn btn-number" @click="append('7')">7</button>
          <button class="btn btn-number" @click="append('8')">8</button>
          <button class="btn btn-number" @click="append('9')">9</button>
          <button class="btn btn-operator" @click="append('-')">
            <Icon icon="fa7-solid:minus" />
          </button>

          <button class="btn btn-number" @click="append('4')">4</button>
          <button class="btn btn-number" @click="append('5')">5</button>
          <button class="btn btn-number" @click="append('6')">6</button>
          <button class="btn btn-operator" @click="append('+')">
            <Icon icon="fa7-solid:plus" />
          </button>

          <button class="btn btn-number" @click="append('1')">1</button>
          <button class="btn btn-number" @click="append('2')">2</button>
          <button class="btn btn-number" @click="append('3')">3</button>
          <button class="btn btn-equals" @click="calculate" rowspan="2">
            <Icon icon="fa7-solid:equals" />
          </button>

          <button class="btn btn-zero" @click="append('0')">0</button>
          <button class="btn btn-number" @click="append('.')">
            <Icon icon="fa7-solid:circle" />
          </button>
        </div>
      </div>

      <div v-if="activeTab === 'unit'" class="unit-converter">
        <div class="input-box">
          <label><Icon icon="fa7-solid:cog" /> 转换类型</label>
          <select v-model="unitType">
            <option value="length">长度</option>
            <option value="weight">重量</option>
            <option value="temperature">温度</option>
            <option value="volume">体积</option>
          </select>
        </div>

        <div class="input-box">
          <label><Icon icon="fa7-solid:keyboard" /> 输入数值</label>
          <input type="number" v-model.number="unitValue" placeholder="请输入数值">
        </div>

        <div class="unit-row">
          <div class="unit-col">
            <span class="unit-label">从</span>
            <select v-model="fromUnit">
              <option v-for="unit in units[unitType]" :key="unit.value" :value="unit.value">{{ unit.label }}</option>
            </select>
          </div>

          <button class="swap-btn" @click="swapUnits">
            <Icon icon="fa7-solid:exchange-alt" />
          </button>

          <div class="unit-col">
            <span class="unit-label">到</span>
            <select v-model="toUnit">
              <option v-for="unit in units[unitType]" :key="unit.value" :value="unit.value">{{ unit.label }}</option>
            </select>
          </div>
        </div>

        <button class="btn btn-convert" @click="convertUnit">
          <Icon icon="fa7-solid:sync-alt" />
          <span>转换</span>
        </button>

        <div class="result" v-if="unitResult">
          <div class="result-main">
            <Icon icon="fa7-solid:check-circle" />
            <span>{{ unitValue }}{{ fromUnit }} = <strong>{{ unitResult }}</strong>{{ toUnit }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'

const activeTab = ref('basic')
const input = ref('')
const history = ref('')

const unitType = ref('length')
const fromUnit = ref('m')
const toUnit = ref('km')
const unitValue = ref(0)
const unitResult = ref('')

const units = {
  length: [
    { value: 'm', label: '米' },
    { value: 'km', label: '千米' },
    { value: 'cm', label: '厘米' },
    { value: 'mm', label: '毫米' },
    { value: 'in', label: '英寸' },
    { value: 'ft', label: '英尺' },
    { value: 'yd', label: '码' }
  ],
  weight: [
    { value: 'kg', label: '千克' },
    { value: 'g', label: '克' },
    { value: 'mg', label: '毫克' },
    { value: 'lb', label: '磅' },
    { value: 'oz', label: '盎司' }
  ],
  temperature: [
    { value: 'c', label: '摄氏度' },
    { value: 'f', label: '华氏度' },
    { value: 'k', label: '开尔文' }
  ],
  volume: [
    { value: 'l', label: '升' },
    { value: 'ml', label: '毫升' },
    { value: 'gal', label: '加仑' },
    { value: 'qt', label: '夸脱' },
    { value: 'pt', label: '品脱' }
  ]
}

const append = (value) => {
  if (value === '×') {
    input.value += '*'
  } else {
    input.value += value
  }
}

const clear = () => {
  input.value = ''
  history.value = ''
}

const calculate = () => {
  try {
    const expression = input.value.replace('×', '*').replace('÷', '/')
    const result = new Function('return ' + expression)()
    history.value = `${input.value} = ${result}`
    input.value = result.toString()
  } catch (error) {
    input.value = 'Error'
  }
}

const swapUnits = () => {
  const temp = fromUnit.value
  fromUnit.value = toUnit.value
  toUnit.value = temp
  if (unitResult.value) {
    convertUnit()
  }
}

const convertUnit = () => {
  try {
    let result

    switch (unitType.value) {
      case 'length':
        result = convertLength(unitValue.value, fromUnit.value, toUnit.value)
        break
      case 'weight':
        result = convertWeight(unitValue.value, fromUnit.value, toUnit.value)
        break
      case 'temperature':
        result = convertTemperature(unitValue.value, fromUnit.value, toUnit.value)
        break
      case 'volume':
        result = convertVolume(unitValue.value, fromUnit.value, toUnit.value)
        break
    }
    
    unitResult.value = result.toFixed(4)
  } catch (error) {
    unitResult.value = 'Error'
  }
}

const convertLength = (value, from, to) => {
  const meters = {
    m: value,
    km: value * 1000,
    cm: value / 100,
    mm: value / 1000,
    in: value * 0.0254,
    ft: value * 0.3048,
    yd: value * 0.9144
  }[from]
  
  return {
    m: meters,
    km: meters / 1000,
    cm: meters * 100,
    mm: meters * 1000,
    in: meters / 0.0254,
    ft: meters / 0.3048,
    yd: meters / 0.9144
  }[to]
}

const convertWeight = (value, from, to) => {
  const kg = {
    kg: value,
    g: value / 1000,
    mg: value / 1000000,
    lb: value * 0.453592,
    oz: value * 0.0283495
  }[from]
  
  return {
    kg: kg,
    g: kg * 1000,
    mg: kg * 1000000,
    lb: kg / 0.453592,
    oz: kg / 0.0283495
  }[to]
}

const convertTemperature = (value, from, to) => {
  if (from === to) return value
  
  let celsius
  if (from === 'c') celsius = value
  if (from === 'f') celsius = (value - 32) * 5/9
  if (from === 'k') celsius = value - 273.15
  
  if (to === 'c') return celsius
  if (to === 'f') return celsius * 9/5 + 32
  if (to === 'k') return celsius + 273.15
}

const convertVolume = (value, from, to) => {
  const liters = {
    l: value,
    ml: value / 1000,
    gal: value * 3.78541,
    qt: value * 0.946353,
    pt: value * 0.473176
  }[from]
  
  return {
    l: liters,
    ml: liters * 1000,
    gal: liters / 3.78541,
    qt: liters / 0.946353,
    pt: liters / 0.473176
  }[to]
}
</script>

<style scoped>
.calculator-container {
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
  font-size: 24px;
  font-weight: 600;
}

.page-title svg {
  color: var(--primary-color);
  width: 28px;
  height: 28px;
}

.tabs {
  display: flex;
  margin-bottom: 24px;
  gap: 12px;
}

.tab-btn {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  background: var(--btn-secondary-bg);
  color: var(--text-secondary);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.tab-btn svg {
  width: 14px;
  height: 14px;
}

.tab-btn.active {
  border-color: var(--primary-color);
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  box-shadow: 0 4px 15px rgba(67, 97, 238, 0.3);
}

.calculator {
  max-width: 400px;
  margin: 0 auto;
}

.display {
  background: var(--result-bg);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  text-align: right;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  overflow: hidden;
  word-break: break-all;
}

.history {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 8px;
  min-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.input {
  font-size: 36px;
  font-weight: 600;
  color: var(--text-primary);
  min-height: 44px;
  word-break: break-all;
  overflow-wrap: break-word;
  line-height: 1.3;
}

.buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.btn {
  padding: 18px;
  border: none;
  border-radius: 12px;
  font-size: 20px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn svg {
  width: 18px;
  height: 18px;
}

.btn-number {
  background: var(--btn-secondary-bg);
  color: var(--text-primary);
}

.btn-number:hover {
  background: var(--border-color);
}

.btn-operator {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  box-shadow: 0 4px 12px rgba(67, 97, 238, 0.25);
}

.btn-operator:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(67, 97, 238, 0.35);
}

.btn-clear {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.25);
}

.btn-clear:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(220, 53, 69, 0.35);
}

.btn-equals {
  background: linear-gradient(135deg, #28a745, #218838);
  color: white;
  grid-row: span 2;
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.25);
}

.btn-equals:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(40, 167, 69, 0.35);
}

.btn-zero {
  grid-column: span 2;
  background: var(--btn-secondary-bg);
  color: var(--text-primary);
}

.btn-zero:hover {
  background: var(--border-color);
}

.unit-converter {
  margin-top: 20px;
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

.input-box label i {
  color: var(--primary-color);
  font-size: 12px;
}

.input-box select,
.input-box input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 16px;
  outline: none;
  background: var(--input-bg);
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.input-box select:focus,
.input-box input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.15);
}

.unit-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-bottom: 16px;
}

.unit-col {
  flex: 1;
  position: relative;
}

.unit-label {
  position: absolute;
  top: -6px;
  left: 10px;
  background: var(--card-bg);
  padding: 0 6px;
  font-size: 11px;
  color: var(--primary-color);
  font-weight: 600;
  z-index: 1;
}

.unit-col select {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 16px;
  outline: none;
  background: var(--input-bg);
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.unit-col select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.15);
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
  font-size: 16px;
  color: var(--primary-color);
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.swap-btn:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.btn-convert {
  width: 100%;
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(67, 97, 238, 0.3);
}

.btn-convert:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(67, 97, 238, 0.4);
}

.btn-convert i {
  font-size: 16px;
}

.result {
  background: var(--result-bg);
  border-radius: 14px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
}

.result-main {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 20px;
  color: var(--text-primary);
}

.result-main svg {
  color: var(--success-color);
  width: 20px;
  height: 20px;
}

.result-main strong {
  color: var(--primary-color);
  font-size: 24px;
}

@media (max-width: 480px) {
  .calculator-container {
    padding: 12px;
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

  .tabs {
    gap: 8px;
  }

  .tab-btn {
    padding: 10px 12px;
    font-size: 14px;
  }

  .tab-btn span {
    display: none;
  }

  .tab-btn svg {
    width: 18px;
    height: 18px;
  }

  .buttons {
    gap: 8px;
  }

  .btn {
    padding: 14px;
  }

  .btn svg {
    width: 16px;
    height: 16px;
  }

  .display {
    padding: 15px;
  }

  .history {
    font-size: 12px;
  }

  .input {
    font-size: 24px;
  }

  .unit-row {
    flex-direction: column;
    gap: 12px;
  }

  .unit-col {
    width: 100%;
  }

  .swap-btn {
    width: 100%;
    height: 36px;
  }
}

@media (max-width: 360px) {
  .display {
    padding: 12px;
  }

  .history {
    font-size: 11px;
  }

  .input {
    font-size: 20px;
  }

  .buttons {
    gap: 6px;
  }

  .btn {
    padding: 12px;
    font-size: 16px;
  }

  .btn svg {
    width: 14px;
    height: 14px;
  }
}
</style>
