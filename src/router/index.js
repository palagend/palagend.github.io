import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/Home.vue'
import ExchangeRate from '../components/ExchangeRate.vue'
import Calculator from '../components/Calculator.vue'
import CryptoPortfolio from '../components/CryptoPortfolio.vue'
import QRCodeGenerator from '../components/QRCodeGenerator.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/exchange-rate', component: ExchangeRate },
  { path: '/calculator', component: Calculator },
  { path: '/crypto-portfolio', component: CryptoPortfolio },
  { path: '/qrcode', component: QRCodeGenerator }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
