<template>
  <div class="calculator-container">
    <div class="card">
      <h2>🧮 实用计算器</h2>
      
      <div class="tabs">
        <button class="tab-btn" :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基础计算</button>
        <button class="tab-btn" :class="{ active: activeTab === 'unit' }" @click="activeTab = 'unit'">单位转换</button>
      </div>

      <!-- 基础计算 -->
      <div v-if="activeTab === 'basic'" class="calculator">
        <div class="display">
          <div class="history">{{ history }}</div>
          <div class="input">{{ input || '0' }}</div>
        </div>
        
        <div class="buttons">
          <button class="btn btn-clear" @click="clear">C</button>
          <button class="btn btn-operator" @click="append('%')">%</button>
          <button class="btn btn-operator" @click="append('/')">÷</button>
          <button class="btn btn-operator" @click="append('×')">×</button>
          
          <button class="btn btn-number" @click="append('7')">7</button>
          <button class="btn btn-number" @click="append('8')">8</button>
          <button class="btn btn-number" @click="append('9')">9</button>
          <button class="btn btn-operator" @click="append('-')">-</button>
          
          <button class="btn btn-number" @click="append('4')">4</button>
          <button class="btn btn-number" @click="append('5')">5</button>
          <button class="btn btn-number" @click="append('6')">6</button>
          <button class="btn btn-operator" @click="append('+')">+</button>
          
          <button class="btn btn-number" @click="append('1')">1</button>
          <button class="btn btn-number" @click="append('2')">2</button>
          <button class="btn btn-number" @click="append('3')">3</button>
          <button class="btn btn-equals" @click="calculate" rowspan="2">=</button>
          
          <button class="btn btn-zero" @click="append('0')">0</button>
          <button class="btn btn-number" @click="append('.')">.</button>
        </div>
      </div>

      <!-- 单位转换 -->
      <div v-if="activeTab === 'unit'" class="unit-converter">
        <div class="input-box">
          <label>转换类型</label>
          <select v-model="unitType">
            <option value="length">长度</option>
            <option value="weight">重量</option>
            <option value="temperature">温度</option>
            <option value="volume">体积</option>
          </select>
        </div>
        
        <div class="unit-row">
          <div class="unit-col">
            <label>源单位</label>
            <select v-model="fromUnit">
              <option v-for="unit in units[unitType]" :key="unit.value" :value="unit.value">{{ unit.label }}</option>
            </select>
          </div>
          
          <div class="unit-col">
            <label>目标单位</label>
            <select v-model="toUnit">
              <option v-for="unit in units[unitType]" :key="unit.value" :value="unit.value">{{ unit.label }}</option>
            </select>
          </div>
        </div>
        
        <div class="input-box">
          <label>输入值</label>
          <input type="number" v-model.number="unitValue" placeholder="请输入数值">
        </div>
        
        <button class="btn btn-convert" @click="convertUnit">转换</button>
        
        <div class="result" v-if="unitResult">
          {{ unitValue }}{{ fromUnit }} = <strong>{{ unitResult }}</strong>{{ toUnit }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

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
    const result = eval(input.value.replace('×', '*').replace('÷', '/'))
    history.value = `${input.value} = ${result}`
    input.value = result.toString()
  } catch (error) {
    input.value = 'Error'
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

.tabs {
  display: flex;
  margin-bottom: 30px;
  gap: 10px;
}

.tab-btn {
  flex: 1;
  padding: 12px 20px;
  border: 2px solid #ddd;
  border-radius: 12px;
  background: white;
  color: #666;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

/* 基础计算器 */
.calculator {
  max-width: 400px;
  margin: 0 auto;
}

.display {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  text-align: right;
}

.history {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  min-height: 20px;
}

.input {
  font-size: 32px;
  font-weight: 600;
  color: #333;
  min-height: 40px;
}

.buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.btn {
  padding: 20px;
  border: none;
  border-radius: 12px;
  font-size: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-number {
  background: #e9ecef;
  color: #333;
}

.btn-number:hover {
  background: #dee2e6;
}

.btn-operator {
  background: #667eea;
  color: white;
}

.btn-operator:hover {
  background: #5568d3;
}

.btn-clear {
  background: #dc3545;
  color: white;
}

.btn-clear:hover {
  background: #c82333;
}

.btn-equals {
  background: #28a745;
  color: white;
  grid-row: span 2;
}

.btn-equals:hover {
  background: #218838;
}

.btn-zero {
  grid-column: span 2;
  background: #e9ecef;
  color: #333;
}

.btn-zero:hover {
  background: #dee2e6;
}

/* 单位转换 */
.unit-converter {
  margin-top: 30px;
  padding: 0;
  background: transparent;
  border-radius: 12px;
}

.conversion-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.form-group input {
  width: 100%;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 12px;
  font-size: 16px;
  outline: none;
  background: white;
  transition: background 0.3s ease, border-color 0.3s ease;
}

/* 深色主题 */
.dark .form-group input {
  background: #2c3e50;
  border-color: #4a5f7a;
  color: #f5f5f5;
}

.unit-selectors {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.unit-selectors select {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 12px;
  font-size: 16px;
  outline: none;
  background: white;
  transition: background 0.3s ease, border-color 0.3s ease;
}

/* 深色主题 */
.dark .unit-selectors select {
  background: #2c3e50;
  border-color: #4a5f7a;
  color: #f5f5f5;
}

.btn-convert {
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 12px;
  background: #667eea;
  color: white;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.btn-convert:hover {
  background: #5568d3;
}

.result {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  font-size: 20px;
  color: #333;
  transition: background 0.3s ease, color 0.3s ease;
}

/* 深色主题 */
.dark .result {
  background: #34495e;
  color: #f5f5f5;
}

.result strong {
  color: #667eea;
}
</style>
