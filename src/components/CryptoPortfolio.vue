<template>
  <div class="crypto-container">
    <div class="container">
      <div class="dashboard">
        <!-- 运行模式标识 -->
        <div class="mode-indicator" :class="config.mode">
          <Icon :icon="config.isBackend ? 'mdi:server' : 'mdi:database-outline'" />
          <span>{{ config.isBackend ? '后端模式' : '本地模式' }}</span>
        </div>
        <main class="main-content">
          <!-- 未登录提示 -->
          <section v-if="!userStore.isLoggedIn" class="login-prompt">
            <div class="prompt-content">
              <Icon icon="mdi:lock" class="prompt-icon" />
              <h3>请先登录</h3>
              <p>登录后可查看和管理您的加密资产组合</p>
              <button class="btn-login" @click="userStore.openLoginModal">
                <Icon icon="mdi:login" /> 立即登录
              </button>
            </div>
          </section>

          <template v-else>
            <section class="overview">
              <div class="overview-card">
                <h3><Icon icon="mdi:wallet" /> 加密资产价值</h3>
                <div class="value">${{ formatAmount(cryptoAssetsValue) }}</div>
                <div class="change" :class="displayTotalValueChange.class">
                  {{ displayTotalValueChange.sign }}{{ displayTotalValueChange.value }}% (24h)
                </div>
              </div>
              <div class="overview-card">
                <h3><Icon icon="mdi:trending-up" /> 浮动盈亏</h3>
                <div class="value" :class="displayUnrealizedPL.class">
                  {{ displayUnrealizedPL.sign }}${{ displayUnrealizedPL.value }}
                </div>
                <div class="change" :class="displayUnrealizedPL.class">
                  {{ displayUnrealizedPL.rate }}
                </div>
              </div>
              <div class="overview-card">
                <h3><Icon icon="mdi:cash-multiple" /> 实现盈亏</h3>
                <div class="value" :class="displayRealizedPL.class">
                  {{ displayRealizedPL.sign }}${{ displayRealizedPL.value }}
                </div>
                <div class="change" :class="displayRealizedPL.class">
                  {{ displayRealizedPL.rate }}
                </div>
              </div>
              <div class="overview-card">
                <h3><Icon icon="mdi:sigma" /> 总盈亏</h3>
                <div class="value" :class="displayTotalPL.class">
                  {{ displayTotalPL.sign }}${{ displayTotalPL.value }}
                </div>
                <div class="change" :class="displayTotalPL.class">
                  浮动 + 实现
                </div>
              </div>
              <div class="overview-card usdt-card">
                <h3><Icon icon="mdi:cash-usd" /> USDT余额</h3>
                <div class="value">${{ formatAmount(cashBalance) }}</div>
                <button class="btn-recharge" @click="showRechargeModal = true">
                  <Icon icon="mdi:plus" /> 充值
                </button>
              </div>
            </section>

            <section class="chart-section">
              <div class="chart-header">
                <h2 class="chart-title"><Icon icon="mdi:chart-pie" /> 资产分布</h2>
                <div class="chart-actions">
                  <span v-if="lastUpdateTime" class="update-time">
                    更新于: {{ lastUpdateTime }}
                  </span>
                  <button
                    class="btn-refresh"
                    @click="refreshPrices"
                    :disabled="refreshing"
                    :class="{ 'refreshing': refreshing }"
                  >
                    <Icon :icon="refreshing ? 'mdi:loading' : 'mdi:refresh'" />
                    {{ refreshing ? '刷新中...' : '刷新数据' }}
                  </button>
                </div>
              </div>

              <!-- 加载状态 -->
              <div v-if="refreshing && portfolioAllocation.length === 0" class="chart-loading">
                <div class="loading-spinner">
                  <Icon icon="mdi:loading" class="spin-icon" />
                </div>
                <span>正在加载资产数据...</span>
              </div>

              <!-- 空状态 -->
              <div v-else-if="portfolioAllocation.length === 0" class="chart-empty">
                <Icon icon="mdi:chart-pie-outline" class="empty-icon" />
                <p>暂无资产数据</p>
                <span>开始交易后将显示资产分布</span>
              </div>

              <!-- 图表内容 -->
              <div v-else class="chart-container">
                <div class="chart">
                  <div class="pie-chart-wrapper">
                    <div class="pie-chart" :style="pieChartStyle"></div>
                    <div class="pie-center">
                      <span class="total-value">${{ formatAmount(totalNetWorth) }}</span>
                      <span class="total-label">总资产</span>
                    </div>
                  </div>
                </div>

                <div class="chart-legend">
                  <div
                    v-for="(item, index) in portfolioAllocation"
                    :key="index"
                    class="legend-item"
                    :class="{ 'legend-highlight': hoveredLegend === index }"
                    @mouseenter="hoveredLegend = index"
                    @mouseleave="hoveredLegend = null"
                  >
                    <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
                    <div class="legend-info">
                      <span class="legend-name">{{ item.name }}</span>
                      <span class="legend-value">${{ formatAmount(item.value) }}</span>
                      <span class="legend-percent">{{ item.percentage }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- 交易区域 - 左右分栏布局 -->
            <section class="trading-section">
              <div class="trading-container">
                <!-- 左侧：交易表单 -->
                <div class="trading-form">
                  <div class="form-header">
                    <h3><Icon icon="mdi:swap-horizontal" /> 快速交易</h3>
                    <div class="trade-type-tabs">
                      <button 
                        :class="['type-tab', { active: newTrade.type === 'buy' }]" 
                        @click="newTrade.type = 'buy'"
                      >
                        <Icon icon="mdi:arrow-down-circle" /> 买入
                      </button>
                      <button 
                        :class="['type-tab', { active: newTrade.type === 'sell' }]" 
                        @click="newTrade.type = 'sell'"
                      >
                        <Icon icon="mdi:arrow-up-circle" /> 卖出
                      </button>
                    </div>
                  </div>

                  <!-- 币种选择网格 -->
                  <div class="asset-selector">
                    <label class="field-label">选择资产</label>
                    <div class="asset-grid">
                      <button
                        v-for="symbol in availableSymbols"
                        :key="symbol"
                        :class="['asset-btn', { active: newTrade.symbol === symbol }]"
                        @click="selectSymbol(symbol)"
                      >
                        <Icon :icon="getAssetIcon(symbol)" :style="{ color: getAssetColor(symbol) }" />
                        <span class="asset-code">{{ symbol }}</span>
                        <span class="asset-price" v-if="portfolioStore.prices[symbol]">
                          ${{ formatAmount(portfolioStore.prices[symbol]) }}
                        </span>
                      </button>
                    </div>
                  </div>

                  <!-- 交易输入区 -->
                  <div class="trade-inputs" v-if="newTrade.symbol">
                    <div class="input-field">
                      <label class="field-label">
                        数量
                        <span class="field-hint" v-if="newTrade.type === 'sell'">
                          可卖: {{ formatAmount(getHoldingAmount(newTrade.symbol)) }}
                        </span>
                      </label>
                      <div class="input-with-controls">
                        <input
                          type="number"
                          v-model.number="newTrade.amount"
                          placeholder="0.00"
                          min="0.00001"
                          step="0.00001"
                          ref="amountInput"
                        >
                        <span class="input-unit">{{ newTrade.symbol }}</span>
                      </div>
                    </div>

                    <div class="input-field">
                      <label class="field-label">
                        价格
                        <span class="field-hint" v-if="currentMarketPrice > 0">
                          市价: ${{ formatAmount(currentMarketPrice) }}
                        </span>
                      </label>
                      <div class="input-with-controls">
                        <input
                          type="number"
                          v-model.number="newTrade.price"
                          placeholder="0.00"
                          min="0.00001"
                          step="0.00001"
                        >
                        <button 
                          class="btn-use-market" 
                          @click="newTrade.price = currentMarketPrice"
                          v-if="currentMarketPrice > 0"
                        >
                          使用市价
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- 交易按钮 -->
                  <div class="trade-submit" v-if="newTrade.symbol">
                    <button 
                      class="btn-submit" 
                      @click="addTrade" 
                      :disabled="!isFormValid || portfolioStore.isLoading || isSubmitting.trade"
                      :class="newTrade.type"
                    >
                      <Icon :icon="newTrade.type === 'buy' ? 'mdi:arrow-down' : 'mdi:arrow-up'" />
                      {{ newTrade.type === 'buy' ? '确认买入' : '确认卖出' }}
                      <span class="submit-total" v-if="newTrade.amount && newTrade.price">
                        ${{ formatAmount(newTrade.amount * newTrade.price) }}
                      </span>
                    </button>
                    <button class="btn-reset" @click="clearForm">
                      <Icon icon="mdi:close" /> 重置
                    </button>
                  </div>
                </div>

                <!-- 右侧：交易预览 -->
                <div class="trading-preview" v-if="newTrade.symbol && newTrade.amount && newTrade.price">
                  <div class="preview-header">
                    <h4><Icon icon="mdi:eye" /> 交易预览</h4>
                  </div>
                  
                  <div class="preview-content">
                    <!-- 主要信息 -->
                    <div class="preview-main">
                      <div class="preview-item total">
                        <span class="label">交易总额</span>
                        <span class="value">${{ formatAmount(newTrade.amount * newTrade.price) }}</span>
                      </div>
                    </div>

                    <!-- 买入预览 -->
                    <template v-if="newTrade.type === 'buy'">
                      <div class="preview-divider"></div>
                      <div class="preview-details">
                        <div class="preview-item" v-if="getHoldingAmount(newTrade.symbol) > 0">
                          <span class="label">当前持仓</span>
                          <span class="value">{{ formatAmount(getHoldingAmount(newTrade.symbol)) }}</span>
                        </div>
                        <div class="preview-item" v-if="getHoldingAmount(newTrade.symbol) > 0">
                          <span class="label">买入后持仓</span>
                          <span class="value highlight">{{ formatAmount(getHoldingAmount(newTrade.symbol) + newTrade.amount) }}</span>
                        </div>
                        <div class="preview-item" v-if="getHoldingAmount(newTrade.symbol) > 0">
                          <span class="label">新综合成本</span>
                          <span class="value">${{ formatAmount(calculateNewAvgCost()) }}</span>
                        </div>
                        <div class="preview-item impact">
                          <span class="label">USDT支出</span>
                          <span class="value negative">-${{ formatAmount(newTrade.amount * newTrade.price) }}</span>
                        </div>
                      </div>
                    </template>

                    <!-- 卖出预览 -->
                    <template v-if="newTrade.type === 'sell'">
                      <div class="preview-divider"></div>
                      <div class="preview-details">
                        <div class="preview-item">
                          <span class="label">当前持仓</span>
                          <span class="value">{{ formatAmount(getHoldingAmount(newTrade.symbol)) }}</span>
                        </div>
                        <div class="preview-item">
                          <span class="label">当前成本价</span>
                          <span class="value">${{ formatAmount(portfolio.value?.find(c => c.symbol === newTrade.symbol)?.avg_cost || 0) }}</span>
                        </div>
                        <div class="preview-item">
                          <span class="label">卖出后持仓</span>
                          <span class="value">{{ formatAmount(Math.max(0, getHoldingAmount(newTrade.symbol) - newTrade.amount)) }}</span>
                        </div>
                        <div class="preview-item" v-if="newTrade.amount < getHoldingAmount(newTrade.symbol)">
                          <span class="label">卖出后成本价</span>
                          <span class="value highlight">${{ formatAmount(calculateNewAvgCost()) }}</span>
                        </div>
                        <div class="preview-item" v-if="calculateEstimatedRealizedPL() !== 0">
                          <span class="label">预估盈亏</span>
                          <span :class="['value', calculateEstimatedRealizedPL() >= 0 ? 'positive' : 'negative']">
                            {{ calculateEstimatedRealizedPL() >= 0 ? '+' : '-' }}${{ formatAmount(Math.abs(calculateEstimatedRealizedPL())) }}
                          </span>
                        </div>
                        <div class="preview-item impact">
                          <span class="label">USDT收入</span>
                          <span class="value positive">+${{ formatAmount(newTrade.amount * newTrade.price) }}</span>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>

                <!-- 空状态提示 -->
                <div class="trading-preview empty" v-else-if="newTrade.symbol">
                  <div class="preview-placeholder">
                    <Icon icon="mdi:calculator" />
                    <p>输入数量和价格查看交易详情</p>
                  </div>
                </div>
              </div>
            </section>

            <section class="portfolio-section">
              <div class="section-header">
                <h2 class="section-title"><Icon icon="mdi:wallet-outline" /> 资产详情</h2>
                <div class="filter-group">
                  <select v-model="selectedFilter" class="filter-select">
                    <option value="all">全部资产</option>
                    <option v-for="crypto in portfolio" :key="crypto.symbol" :value="crypto.symbol">
                      {{ crypto.symbol }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="table-wrapper">
                <table class="portfolio-table">
                  <thead>
                    <tr>
                      <th>资产</th>
                      <th>持有量</th>
                      <th>成本价</th>
                      <th>当前价</th>
                      <th>总价值</th>
                      <th>浮动盈亏</th>
                      <th>实现盈亏</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="crypto in filteredHoldings"
                      :key="crypto.id"
                      class="asset-row"
                      :class="{ 'selected': selectedAsset === crypto.symbol, 'liquidated': crypto.amount === 0 }"
                      @click="selectAsset(crypto.symbol)"
                    >
                      <td>
                        <div class="asset-info">
                          <Icon width="32" height="32" :icon="getAssetIcon(crypto.symbol)" :style="{ color: getAssetColor(crypto.symbol) }" />
                          <div>
                            <div class="asset-name">{{ getAssetName(crypto.symbol) }}</div>
                            <div class="asset-symbol">{{ crypto.symbol }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="asset-amount">{{ formatAmount(crypto.amount) }}</td>
                      <td class="asset-price">
                        <template v-if="crypto.avg_cost > 0">${{ formatAmount(crypto.avg_cost) }}</template>
                        <template v-else-if="crypto.avg_cost === 0">
                          <div class="cost-display">
                            <span class="cost-value">$0</span>
                            <span class="cost-badge zero">已回本</span>
                          </div>
                        </template>
                        <template v-else>
                          <div class="cost-display">
                            <span class="cost-value">${{ formatAmount(crypto.avg_cost) }}</span>
                            <span class="cost-badge negative">负成本</span>
                          </div>
                        </template>
                      </td>
                      <td class="asset-price">${{ formatAmount(crypto.current_price) }}</td>
                      <td class="asset-value">${{ formatAmount(crypto.market_value) }}</td>
                      <td class="asset-profit" :class="getProfitClass(crypto)">
                        <!-- avg_cost > 0: 正常情况 -->
                        <template v-if="crypto.avg_cost > 0">
                          <div class="profit-value">
                            {{ (crypto.amount * (crypto.current_price - crypto.avg_cost)) >= 0 ? '+' : '-' }}${{ formatAmount(Math.abs(crypto.amount * (crypto.current_price - crypto.avg_cost))) }}
                          </div>
                          <div class="profit-rate" v-if="crypto.symbol !== 'USDT'">
                            {{ ((crypto.current_price - crypto.avg_cost) / crypto.avg_cost * 100) >= 0 ? '+' : '-' }}{{ Math.abs((crypto.current_price - crypto.avg_cost) / crypto.avg_cost * 100).toFixed(2) }}%
                          </div>
                        </template>
                        
                        <!-- avg_cost = 0: 投资全部收回 -->
                        <template v-else-if="crypto.avg_cost === 0">
                          <div class="profit-value positive">
                            +${{ formatAmount(crypto.amount * crypto.current_price) }}
                          </div>
                          <div class="profit-rate" v-if="crypto.symbol !== 'USDT'">
                            <span class="status-badge recovered">✓ 已回本</span>
                          </div>
                        </template>
                        
                        <!-- avg_cost < 0: 投资回报超过100% -->
                        <template v-else>
                          <div class="profit-value positive">
                            +${{ formatAmount(crypto.amount * crypto.current_price - crypto.cost) }}
                          </div>
                          <div class="profit-rate" v-if="crypto.symbol !== 'USDT'">
                            <span class="status-badge super-profit">🚀 超100%回报</span>
                          </div>
                        </template>
                      </td>
                      <td class="asset-realized-profit" :class="{ 'positive': crypto.realized_pl > 0, 'negative': crypto.realized_pl < 0 }" v-if="crypto.symbol !== 'USDT'">
                        <template v-if="crypto.realized_pl !== 0">
                          <div class="profit-value">
                            {{ crypto.realized_pl > 0 ? '+' : '-' }}${{ formatAmount(Math.abs(crypto.realized_pl)) }}
                          </div>
                          <div class="profit-rate">
                            {{ crypto.realized_pl > 0 ? '+' : '-' }}{{ Math.abs(crypto.realized_pl_rate).toFixed(2) }}%
                          </div>
                        </template>
                        <template v-else>
                          <span class="no-data">-</span>
                        </template>
                      </td>
                      <td v-else>-</td>
                      <td class="action-cell">
                        <button class="btn-action btn-sell" @click.stop="quickSell(crypto)" title="快速卖出">
                          <Icon icon="mdi:shopping-cart-arrow-up" />
                        </button>
                        <button class="btn-action btn-buy" @click.stop="quickBuy(crypto)" title="快速买入">
                          <Icon icon="mdi:shopping-cart-arrow-down" />
                        </button>
                      </td>
                    </tr>
                    <tr v-if="filteredHoldings.length === 0">
                      <td colspan="8" class="empty-state">
                        <Icon icon="mdi:inbox" />
                        <p>暂无资产数据，请充值USDT后开始交易</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section class="trades-section">
              <div class="section-header">
                <h2 class="section-title"><Icon icon="mdi:history" /> 交易历史</h2>
                <div class="section-actions">
                  <button class="btn-export" @click="exportData" :disabled="isSubmitting.export">
                    <Icon icon="mdi:download" /> 导出
                  </button>
                  <button class="btn-import" @click="showImportDialog = true">
                    <Icon icon="mdi:upload" /> 导入
                  </button>
                  <div class="protect-switch" @click="toggleProtectHistory">
                    <Icon :icon="protectHistory ? 'mdi:shield-check' : 'mdi:shield-off'" />
                    <span class="switch-label">保护</span>
                    <div class="switch" :class="{ 'on': protectHistory }">
                      <div class="switch-handle"></div>
                    </div>
                  </div>
                  <div class="filter-group">
                    <select v-model="tradeFilter" class="filter-select">
                      <option value="all">全部交易</option>
                      <option value="buy">买入</option>
                      <option value="sell">卖出</option>
                      <option value="recharge">充值</option>
                    </select>
                  </div>
                  <button class="btn-clear" @click="clearTrades" v-if="filteredTrades.length > 0 && !protectHistory" :disabled="isSubmitting.clear">
                    <Icon icon="mdi:delete-sweep" /> 清空历史
                  </button>
                </div>
              </div>

              <div class="table-wrapper">
                <table class="trades-table">
                  <thead>
                    <tr>
                      <th>时间</th>
                      <th>资产</th>
                      <th>类型</th>
                      <th>数量</th>
                      <th>价格</th>
                      <th>总金额</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="trade in filteredTrades" :key="trade.id" class="trade-row">
                      <td class="trade-time">{{ formatDate(trade.created_at || trade.timestamp) }}</td>
                      <td>
                        <div class="trade-asset">
                          <Icon :icon="getAssetIcon(trade.symbol)" :style="{ color: getAssetColor(trade.symbol) }" />
                          <span>{{ trade.symbol }}</span>
                        </div>
                      </td>
                      <td>
                        <span class="trade-type" :class="trade.type">
                          {{ getTradeTypeText(trade.type) }}
                        </span>
                      </td>
                      <td>{{ formatAmount(trade.amount) }}</td>
                      <td>${{ formatAmount(trade.price) }}</td>
                      <td>${{ formatAmount(trade.total) }}</td>
                      <td>
                        <button class="btn-delete" @click="deleteTrade(trade.id)" :disabled="protectHistory || isSubmitting.delete" title="删除">
                          <Icon icon="mdi:trash-can" />
                        </button>
                      </td>
                    </tr>
                    <tr v-if="filteredTrades.length === 0">
                      <td colspan="7" class="empty-state">
                        <Icon icon="mdi:inbox" />
                        <p>暂无交易记录</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </template>
        </main>
      </div>
    </div>

    <!-- 充值弹窗 -->
    <div v-if="showRechargeModal" class="modal-overlay" @click.self="showRechargeModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3><Icon icon="mdi:cash-plus" /> 充值USDT</h3>
          <button class="btn-close" @click="showRechargeModal = false">
            <Icon icon="mdi:close" />
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>充值金额 (USDT)</label>
            <input
              type="number"
              v-model.number="rechargeAmount"
              placeholder="输入充值金额"
              min="0.01"
              step="0.01"
              @keyup.enter="rechargeUSDT"
            >
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showRechargeModal = false">取消</button>
          <button class="btn-confirm" @click="rechargeUSDT" :disabled="!rechargeAmount || rechargeAmount <= 0 || isSubmitting.recharge">
            确认充值
          </button>
        </div>
      </div>
    </div>

    <!-- 导入数据弹窗 -->
    <div v-if="showImportDialog" class="modal-overlay" @click.self="closeImportDialog">
      <div class="modal import-modal">
        <div class="modal-header">
          <h3><Icon icon="mdi:upload" /> 导入数据</h3>
          <button class="btn-close" @click="closeImportDialog">
            <Icon icon="mdi:close" />
          </button>
        </div>
        <div class="modal-body">
          <!-- 步骤1: 选择文件 -->
          <div v-if="importStep === 'select'" class="import-step">
            <div
              class="drop-zone"
              :class="{ 'drag-over': isDragging }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleFileDrop"
              @click="triggerFileInput"
            >
              <Icon icon="mdi:cloud-upload" class="drop-icon" />
              <p>点击或拖拽 JSON 文件到此处</p>
              <span class="drop-hint">支持 .json 格式，最大 10MB</span>
              <input
                ref="fileInput"
                type="file"
                accept=".json,application/json"
                @change="handleFileSelect"
                style="display: none"
              >
            </div>
          </div>

          <!-- 步骤2: 预览确认 -->
          <div v-if="importStep === 'preview'" class="import-step">
            <div class="preview-summary">
              <div class="preview-item">
                <span class="preview-label">总记录数</span>
                <span class="preview-value">{{ importPreview.total_trades }}</span>
              </div>
              <div class="preview-item success">
                <span class="preview-label">新记录</span>
                <span class="preview-value">{{ importPreview.new_trades }}</span>
              </div>
              <div class="preview-item warning" v-if="importPreview.conflicts > 0">
                <span class="preview-label">冲突</span>
                <span class="preview-value">{{ importPreview.conflicts }}</span>
              </div>
            </div>

            <div v-if="importPreview.conflicts > 0" class="conflict-section">
              <h4>冲突处理</h4>
              <div class="conflict-options">
                <label class="radio-label">
                  <input type="radio" v-model="conflictStrategy" value="skip">
                  <span>跳过冲突记录（推荐）</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="conflictStrategy" value="overwrite">
                  <span>覆盖现有记录</span>
                </label>
              </div>

              <div class="conflict-list">
                <div v-for="(item, index) in importPreview.conflict_items" :key="index" class="conflict-item">
                  <Icon icon="mdi:alert" class="conflict-icon" />
                  <div class="conflict-info">
                    <span class="conflict-symbol">{{ item.trade.symbol }}</span>
                    <span class="conflict-type">{{ formatTradeType(item.trade.type) }}</span>
                    <span class="conflict-reason">{{ item.reason }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 步骤3: 导入结果 -->
          <div v-if="importStep === 'result'" class="import-step">
            <div class="result-success" v-if="importResult.success">
              <Icon icon="mdi:check-circle" class="result-icon success" />
              <h4>导入成功</h4>
              <div class="result-stats">
                <div class="result-stat">
                  <span class="stat-value">{{ importResult.imported }}</span>
                  <span class="stat-label">成功导入</span>
                </div>
                <div class="result-stat" v-if="importResult.skipped > 0">
                  <span class="stat-value">{{ importResult.skipped }}</span>
                  <span class="stat-label">已跳过</span>
                </div>
                <div class="result-stat" v-if="importResult.overwritten > 0">
                  <span class="stat-value">{{ importResult.overwritten }}</span>
                  <span class="stat-label">已覆盖</span>
                </div>
              </div>
            </div>
            <div class="result-error" v-else>
              <Icon icon="mdi:close-circle" class="result-icon error" />
              <h4>导入失败</h4>
              <p>{{ importError }}</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeImportDialog">取消</button>
          <button
            v-if="importStep === 'preview'"
            class="btn-confirm"
            @click="confirmImport"
            :disabled="isSubmitting.import"
          >
            确认导入
          </button>
          <button
            v-if="importStep === 'result' && importResult.success"
            class="btn-confirm"
            @click="closeImportDialog"
          >
            完成
          </button>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-toast">
      <Icon icon="mdi:alert-circle" />
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { usePortfolioStore } from '../stores/portfolio'
import { useUserStore } from '../stores/user'
import { config } from '../config'

const portfolioStore = usePortfolioStore()
const userStore = useUserStore()

// 支持的加密货币列表
const availableSymbols = ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE', 'TRX', 'AVAX', 'HYPE']

// 状态
const newTrade = ref({
  symbol: '',
  type: 'buy',
  amount: null,
  price: null
})
const currentMarketPrice = ref(0) // 当前选中的币种市价
const tradeFilter = ref('all')
const refreshing = ref(false)
const lastUpdateTime = ref('')
const errorMessage = ref('')
const autoRefresh = ref(false)
const hoveredLegend = ref(null) // 当前hover的图例索引
const refreshInterval = ref(60)
const selectedFilter = ref('all')
const selectedAsset = ref(null)
const symbolSelect = ref(null)
const amountInput = ref(null)
const showRechargeModal = ref(false)
const rechargeAmount = ref(null)
const protectHistory = ref(false)
let refreshTimer = null

// 重复提交保护状态
const isSubmitting = ref({
  trade: false,
  recharge: false,
  delete: false,
  clear: false,
  export: false,
  import: false
})

// 导入相关状态
const showImportDialog = ref(false)
const importStep = ref('select')
const isDragging = ref(false)
const fileInput = ref(null)
const importData = ref(null)
const importPreview = ref({
  total_trades: 0,
  new_trades: 0,
  conflicts: 0,
  conflict_items: []
})
const conflictStrategy = ref('skip')
const importResult = ref({
  success: false,
  imported: 0,
  skipped: 0,
  overwritten: 0
})
const importError = ref('')

// 从store获取数据（后端已计算好）
const portfolio = computed(() => portfolioStore.portfolio)
const trades = computed(() => portfolioStore.trades)
const cryptoAssetsValue = computed(() => portfolioStore.cryptoAssetsValue) // 加密资产市值（不含 USDT）
const cashBalance = computed(() => portfolioStore.cashBalance) // USDT现金余额
const unrealizedPL = computed(() => portfolioStore.unrealizedPL) // 浮动盈亏
const unrealizedPLRate = computed(() => portfolioStore.unrealizedPLRate) // 浮动盈亏率
const realizedPL = computed(() => portfolioStore.realizedPL) // 实现盈亏
const realizedPLRate = computed(() => portfolioStore.realizedPLRate) // 实现盈亏率
const totalPL = computed(() => portfolioStore.totalPL) // 总盈亏
const cryptoValueChange24h = computed(() => portfolioStore.cryptoValueChange24h) // 24小时价值变化率

// 格式化的显示值（避免模板中重复计算）
const displayUnrealizedPL = computed(() => {
  const val = unrealizedPL.value
  return {
    sign: val >= 0 ? '+' : '-',
    value: formatAmount(Math.abs(val)),
    class: val >= 0 ? 'positive' : 'negative',
    rate: (unrealizedPLRate.value >= 0 ? '+' : '-') + Math.abs(unrealizedPLRate.value).toFixed(2) + '%'
  }
})

const displayRealizedPL = computed(() => {
  const val = realizedPL.value
  return {
    sign: val >= 0 ? '+' : '-',
    value: formatAmount(Math.abs(val)),
    class: val >= 0 ? 'positive' : 'negative',
    rate: (realizedPLRate.value >= 0 ? '+' : '-') + Math.abs(realizedPLRate.value).toFixed(2) + '%'
  }
})

const displayTotalPL = computed(() => {
  const val = totalPL.value
  return {
    sign: val >= 0 ? '+' : '-',
    value: formatAmount(Math.abs(val)),
    class: val >= 0 ? 'positive' : 'negative'
  }
})

const displayTotalValueChange = computed(() => {
  const val = cryptoValueChange24h.value
  return {
    sign: val >= 0 ? '+' : '-',
    value: Math.abs(val).toFixed(2),
    class: getChangeClass(val)
  }
})

const ASSET_CONFIG = {
  COLORS: {
    USDT: '#26a17b',
    BTC: '#f7931a',
    ETH: '#627eea',
    BNB: '#f0b90b',
    XRP: '#0033ad',
    ADA: '#0033ad',
    SOL: '#00ffa3',
    DOGE: '#c2a633',
    TRX: '#eb0029',
    AVAX: '#e84142',
    HYPE: '#89F0E6'
  },
  ICONS: {
    USDT: 'cryptocurrency-color:usdt',
    BTC: 'cryptocurrency-color:btc',
    ETH: 'cryptocurrency-color:eth',
    BNB: 'cryptocurrency-color:bnb',
    XRP: 'cryptocurrency-color:xrp',
    ADA: 'cryptocurrency-color:ada',
    SOL: 'token-branded:sol',
    DOGE: 'cryptocurrency-color:doge',
    TRX: 'cryptocurrency-color:trx',
    AVAX: 'cryptocurrency-color:avax',
    HYPE: 'token:hyper-evm'
  },
  NAMES: {
    USDT: 'Tether',
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    BNB: 'Binance Coin',
    XRP: 'Ripple',
    ADA: 'Cardano',
    SOL: 'Solana',
    DOGE: 'Dogecoin',
    TRX: 'Tron',
    AVAX: 'Avalanche',
    HYPE: 'Hyperliquid'
  }
}

const getTradeTypeText = (type) => {
  const map = {
    buy: '买入',
    sell: '卖出',
    recharge: '充值'
  }
  return map[type] || type
}

const toggleProtectHistory = () => {
  protectHistory.value = !protectHistory.value
}

const selectSymbol = async (symbol) => {
  newTrade.value.symbol = symbol
  // 使用 GetAssetPrice 接口获取最新价格
  const result = await portfolioStore.fetchAssetPrice(symbol)
  if (result.success) {
    newTrade.value.price = result.price
    currentMarketPrice.value = result.price
  }
  nextTick(() => {
    if (amountInput.value) {
      amountInput.value.focus()
    }
  })
}

const onSymbolChange = async () => {
  if (newTrade.value.symbol) {
    // 使用 GetAssetPrice 接口获取最新价格
    const result = await portfolioStore.fetchAssetPrice(newTrade.value.symbol)
    if (result.success) {
      newTrade.value.price = result.price
      currentMarketPrice.value = result.price
    }
  } else {
    currentMarketPrice.value = 0
  }
  nextTick(() => {
    if (amountInput.value) {
      amountInput.value.focus()
    }
  })
}

const isFormValid = computed(() => {
  return newTrade.value.symbol && 
         newTrade.value.amount && 
         newTrade.value.amount > 0 && 
         newTrade.value.price && 
         newTrade.value.price > 0
})

const getHoldingAmount = (symbol) => {
  const asset = portfolio.value?.find(c => c.symbol === symbol)
  return asset ? asset.amount : 0
}

// 根据avg_cost获取盈亏显示的CSS类
const getProfitClass = (crypto) => {
  if (crypto.avg_cost > 0) {
    // 正常情况：根据盈亏判断
    const profit = crypto.amount * (crypto.current_price - crypto.avg_cost)
    return { positive: profit >= 0, negative: profit < 0 }
  } else if (crypto.avg_cost === 0) {
    // 已回本：总是显示为盈利（绿色）
    return { positive: true }
  } else {
    // 超100%回报：总是显示为盈利（绿色）
    return { positive: true }
  }
}

// 计算卖出时的预估实现盈亏（借贷记账法）
// 实现盈亏 = USDT退出 - USDT投入（按卖出比例计算）
const calculateEstimatedRealizedPL = () => {
  if (newTrade.value.type !== 'sell') return 0
  const existing = portfolio.value?.find(c => c.symbol === newTrade.value.symbol)
  if (!existing || existing.amount === 0) return 0

  // 本次卖出获得的USDT
  const usdtOut = newTrade.value.price * newTrade.value.amount

  // 按卖出比例计算的USDT投入成本
  const costRatio = newTrade.value.amount / existing.amount
  const usdtIn = existing.cost * costRatio

  return usdtOut - usdtIn
}

// 计算交易后的新综合成本价（借贷记账法）
// 买入: 新成本价 = (当前成本 + 本次投入) / (当前持仓 + 本次买入量)
// 卖出: 新成本价 = 当前成本（保持不变，因为按比例回收成本）
const calculateNewAvgCost = () => {
  if (!newTrade.value.symbol) return 0
  const existing = portfolio.value?.find(c => c.symbol === newTrade.value.symbol)
  const currentAmount = existing ? existing.amount : 0
  const currentCost = existing ? existing.cost : 0
  const tradeAmount = newTrade.value.amount
  const tradeTotal = newTrade.value.amount * newTrade.value.price

  if (newTrade.value.type === 'buy') {
    // 买入逻辑
    if (currentAmount === 0) return newTrade.value.price
    const totalCost = currentCost + tradeTotal
    const totalAmount = currentAmount + tradeAmount
    return totalCost / totalAmount
  } else if (newTrade.value.type === 'sell') {
    // 卖出逻辑：成本价保持不变（借贷记账法）
    if (!existing || currentAmount === 0) return 0
    // 如果全部卖出，成本价为0
    if (tradeAmount >= currentAmount) return 0
    // 成本价 = 剩余成本 / 剩余数量 = (currentCost - 按比例回收成本) / (currentAmount - tradeAmount)
    // 由于 按比例回收成本 = currentCost * (tradeAmount / currentAmount)
    // 所以 剩余成本 = currentCost * (currentAmount - tradeAmount) / currentAmount
    // 成本价 = [currentCost * (currentAmount - tradeAmount) / currentAmount] / (currentAmount - tradeAmount)
    // 成本价 = currentCost / currentAmount = 原成本价
    return currentCost / currentAmount
  }
  return 0
}

const addTrade = async () => {
  if (isSubmitting.value.trade) return

  if (!newTrade.value.symbol) {
    errorMessage.value = '请选择加密货币'
    setTimeout(() => errorMessage.value = '', 3000)
    return
  }

  if (newTrade.value.amount <= 0) {
    errorMessage.value = '请输入大于 0 的数量'
    setTimeout(() => errorMessage.value = '', 3000)
    return
  }

  if (newTrade.value.price <= 0) {
    errorMessage.value = '请输入大于 0 的价格'
    setTimeout(() => errorMessage.value = '', 3000)
    return
  }

  isSubmitting.value.trade = true

  try {
    const result = await portfolioStore.createTrade({
      symbol: newTrade.value.symbol,
      type: newTrade.value.type,
      amount: newTrade.value.amount,
      price: newTrade.value.price
    })

    if (!result.success) {
      errorMessage.value = result.error
      setTimeout(() => errorMessage.value = '', 3000)
      return
    }

    refreshPrices()

    newTrade.value = {
      symbol: '',
      type: 'buy',
      amount: null,
      price: null
    }
  } finally {
    isSubmitting.value.trade = false
  }
}

const rechargeUSDT = async () => {
  if (isSubmitting.value.recharge) return

  if (!rechargeAmount.value || rechargeAmount.value <= 0) {
    errorMessage.value = '请输入有效的充值金额'
    setTimeout(() => errorMessage.value = '', 3000)
    return
  }

  isSubmitting.value.recharge = true

  try {
    const result = await portfolioStore.createTrade({
      symbol: 'USDT',
      type: 'recharge',
      amount: rechargeAmount.value,
      price: 1
    })

    if (!result.success) {
      errorMessage.value = result.error
      setTimeout(() => errorMessage.value = '', 3000)
      return
    }

    rechargeAmount.value = null
    showRechargeModal.value = false
  } finally {
    isSubmitting.value.recharge = false
  }
}

const deleteTrade = async (id) => {
  if (isSubmitting.value.delete) return

  if (protectHistory.value) {
    errorMessage.value = '保护开关已开启，禁止删除交易历史'
    setTimeout(() => errorMessage.value = '', 3000)
    return
  }
  if (!confirm('确认删除该交易？该操作将同步更新资产详情中的持仓量和成本价。')) {
    return
  }

  isSubmitting.value.delete = true

  try {
    const result = await portfolioStore.deleteTrade(id)
    if (!result.success) {
      errorMessage.value = result.error
      setTimeout(() => errorMessage.value = '', 3000)
    }
  } finally {
    isSubmitting.value.delete = false
  }
}

const clearTrades = async () => {
  if (isSubmitting.value.clear) return

  if (protectHistory.value) {
    errorMessage.value = '保护开关已开启，禁止删除交易历史'
    setTimeout(() => errorMessage.value = '', 3000)
    return
  }
  if (!confirm('确认清空所有交易历史？此操作将重置所有数据。')) {
    return
  }

  isSubmitting.value.clear = true

  try {
    const result = await portfolioStore.clearAllTrades()
    if (!result.success) {
      errorMessage.value = result.error
      setTimeout(() => errorMessage.value = '', 3000)
    }
  } finally {
    isSubmitting.value.clear = false
  }
}

const clearForm = () => {
  newTrade.value = {
    symbol: '',
    type: 'buy',
    amount: null,
    price: null
  }
  nextTick(() => {
    if (symbolSelect.value) {
      symbolSelect.value.focus()
    }
  })
}

const selectAsset = (symbol) => {
  // toggle 模式：点击已选中的资产则取消过滤，显示全部
  if (selectedAsset.value === symbol) {
    selectedAsset.value = null
    selectedFilter.value = 'all'
  } else {
    selectedAsset.value = symbol
    selectedFilter.value = symbol
  }
}

const quickSell = async (crypto) => {
  newTrade.value.symbol = crypto.symbol
  newTrade.value.type = 'sell'
  newTrade.value.amount = crypto.amount
  // 优先使用 store 中已有的最新价格
  const cachedPrice = portfolioStore.prices[crypto.symbol]
  if (cachedPrice) {
    newTrade.value.price = cachedPrice
    currentMarketPrice.value = cachedPrice
  } else {
    // 异步获取最新价格
    const result = await portfolioStore.fetchAssetPrice(crypto.symbol)
    if (result.success) {
      newTrade.value.price = result.price
      currentMarketPrice.value = result.price
    } else {
      newTrade.value.price = crypto.currentPrice || (crypto.avg_cost || crypto.price)
    }
  }
}

const quickBuy = async (crypto) => {
  newTrade.value.symbol = crypto.symbol
  newTrade.value.type = 'buy'
  // 优先使用 store 中已有的最新价格
  const cachedPrice = portfolioStore.prices[crypto.symbol]
  if (cachedPrice) {
    newTrade.value.price = cachedPrice
    currentMarketPrice.value = cachedPrice
  } else {
    // 异步获取最新价格
    const result = await portfolioStore.fetchAssetPrice(crypto.symbol)
    if (result.success) {
      newTrade.value.price = result.price
      currentMarketPrice.value = result.price
    } else {
      newTrade.value.price = crypto.currentPrice || (crypto.avg_cost || crypto.price)
    }
  }
  nextTick(() => {
    if (amountInput.value) {
      amountInput.value.focus()
    }
  })
}

const getAssetName = (symbol) => {
  return ASSET_CONFIG.NAMES[symbol] || symbol
}

const getAssetColor = (symbol) => {
  return ASSET_CONFIG.COLORS[symbol] || '#667eea'
}

const getAssetIcon = (symbol) => {
  return ASSET_CONFIG.ICONS[symbol] || symbol.charAt(0)
}

const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0.0000'
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  })
}

// 缓存日期格式化器，避免重复创建
const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
})

const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return dateFormatter.format(date)
}

const getChangeClass = (change) => {
  if (change > 0) return 'positive'
  if (change < 0) return 'negative'
  return ''
}

// 防抖计时器
let refreshDebounceTimer = null
const REFRESH_DEBOUNCE_MS = 5000 // 5秒内禁止重复刷新

const refreshPrices = async () => {
  if (refreshing.value) return
  
  // 防抖检查
  if (refreshDebounceTimer) {
    errorMessage.value = '刷新过于频繁，请稍后再试'
    setTimeout(() => errorMessage.value = '', 2000)
    return
  }
  
  // 设置防抖计时器
  refreshDebounceTimer = setTimeout(() => {
    refreshDebounceTimer = null
  }, REFRESH_DEBOUNCE_MS)
  
  refreshing.value = true
  errorMessage.value = ''

  try {
    const result = await portfolioStore.fetchDashboard()

    if (result.success) {
      lastUpdateTime.value = formatDate(result.updatedAt)
    } else {
      errorMessage.value = result.error || '获取价格失败'
    }
  } catch (error) {
    console.error('Failed to fetch prices:', error)
    errorMessage.value = '获取价格失败，请检查网络连接'
  }

  refreshing.value = false
}

// 页面可见性状态
const isPageVisible = ref(true)
let visibilityRefreshTimer = null

// 处理页面可见性变化
const handleVisibilityChange = () => {
  const wasVisible = isPageVisible.value
  isPageVisible.value = !document.hidden

  if (isPageVisible.value && !wasVisible) {
    // 页面从隐藏变为可见，延迟刷新一次数据（避免频繁切换时重复请求）
    if (visibilityRefreshTimer) {
      clearTimeout(visibilityRefreshTimer)
    }
    visibilityRefreshTimer = setTimeout(() => {
      if (userStore.isLoggedIn && !refreshing.value) {
        refreshPrices()
      }
    }, 1000)
  }
}

const toggleAutoRefresh = () => {
  if (autoRefresh.value) {
    refreshTimer = setInterval(() => {
      // 只在页面可见时执行刷新
      if (isPageVisible.value) {
        refreshPrices()
      }
    }, refreshInterval.value * 60 * 1000)
  } else {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }
}

const filteredHoldings = computed(() => {
  const filter = selectedFilter.value
  return portfolio.value?.filter(c =>
    c.symbol !== 'USDT' &&
    c.amount > 0 &&
    (filter === 'all' || c.symbol === filter)
  ) || []
})

const filteredTrades = computed(() => {
  const filter = tradeFilter.value
  return filter === 'all' ? trades.value : trades.value?.filter(t => t.type === filter)
})

// 总资产净值 = 加密资产市值 + USDT余额
const totalNetWorth = computed(() => cryptoAssetsValue.value + cashBalance.value)

// 投资组合分布（包含加密资产和USDT）
const portfolioAllocation = computed(() => {
  const portfolioItems = portfolio.value || []
  if (portfolioItems.length === 0 && cashBalance.value <= 0) return []

  const total = totalNetWorth.value
  if (total <= 0) return []

  // 构建资产分布列表（先按价值降序排列，确保颜色分配顺序正确）
  const allocation = []

  // 添加加密资产（从portfolio中获取）
  portfolioItems.forEach((portfolioItem) => {
    const marketValue = portfolioItem.market_value
    if (marketValue > 0) {
      allocation.push({
        name: portfolioItem.symbol,
        rawPercentage: (marketValue / total) * 100,
        value: marketValue,
        color: ASSET_CONFIG.COLORS[portfolioItem.symbol]
      })
    }
  })

   // 按价值降序排列（确保饼图扇区和图例顺序一致）
  allocation.sort((a, b) => b.value - a.value)

  // 为没有预定义颜色的资产分配颜色
  allocation.forEach(alloc => {
    if (!alloc.color) {
      alloc.color = '#ffffff'
    }
  })

  // 使用最大余数法确保百分比总和为100%
  let remainingPercentage = 100

  // 先向下取整并计算余数
  const itemsWithRemainder = allocation.map(alloc => {
    const floorPercentage = Math.floor(alloc.rawPercentage)
    const remainder = alloc.rawPercentage - floorPercentage
    remainingPercentage -= floorPercentage
    return { ...alloc, floorPercentage, remainder }
  })

  // 按余数从大到小排序，给余数大的项+1
  itemsWithRemainder.sort((a, b) => b.remainder - a.remainder)

  // 调整百分比
  for (let i = 0; i < itemsWithRemainder.length; i++) {
    if (i < remainingPercentage) {
      itemsWithRemainder[i].percentage = itemsWithRemainder[i].floorPercentage + 1
    } else {
      itemsWithRemainder[i].percentage = itemsWithRemainder[i].floorPercentage
    }
  }

  // 恢复原始排序（按价值降序），保持颜色与资产对应
  return itemsWithRemainder.sort((a, b) => b.value - a.value)
})

// 饼图样式（基于投资组合分布）
const pieChartStyle = computed(() => {
  const allocation = portfolioAllocation.value
  if (allocation.length === 0) return {}

  const gradient = allocation.reduce((acc, item, index) => {
    const startAngle = index === 0 ? 0 : acc.angle
    const endAngle = startAngle + (item.percentage * 3.6)
    const separator = index < allocation.length - 1 ? ', ' : ''
    return {
      str: acc.str + `${item.color} ${startAngle}deg ${endAngle}deg${separator}`,
      angle: endAngle
    }
  }, { str: 'conic-gradient(', angle: 0 })

  return { background: gradient.str + ')' }
})

onMounted(() => {
  if (userStore.isLoggedIn) {
    portfolioStore.fetchDashboard()
  }
  // 监听页面可见性变化
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  if (visibilityRefreshTimer) {
    clearTimeout(visibilityRefreshTimer)
  }
  // 移除页面可见性监听
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

// ========== 导入/导出方法 ==========

// 导出数据
const exportData = async () => {
  if (isSubmitting.value.export) return

  isSubmitting.value.export = true
  try {
    const result = await portfolioStore.exportData()
    if (result.success) {
      // 生成 JSON 文件并下载
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `portfolio-backup-${formatDate(new Date()).replace(/[/:]/g, '-')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else {
      errorMessage.value = result.error || '导出失败'
      setTimeout(() => errorMessage.value = '', 3000)
    }
  } catch (error) {
    console.error('Export error:', error)
    errorMessage.value = '导出失败，请稍后重试'
    setTimeout(() => errorMessage.value = '', 3000)
  } finally {
    isSubmitting.value.export = false
  }
}

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    processFile(file)
  }
}

// 处理文件拖拽
const handleFileDrop = (event) => {
  isDragging.value = false
  const file = event.dataTransfer.files[0]
  if (file) {
    processFile(file)
  }
}

// 处理文件
const processFile = (file) => {
  // 验证文件类型
  if (!file.name.endsWith('.json') && file.type !== 'application/json') {
    errorMessage.value = '请选择 JSON 格式的文件'
    setTimeout(() => errorMessage.value = '', 3000)
    return
  }

  // 验证文件大小 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    errorMessage.value = '文件大小不能超过 10MB'
    setTimeout(() => errorMessage.value = '', 3000)
    return
  }

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result)

      // 验证基本结构
      if (!data.version || !data.trades || !Array.isArray(data.trades)) {
        errorMessage.value = '无效的数据文件格式'
        setTimeout(() => errorMessage.value = '', 3000)
        return
      }

      importData.value = data

      // 调用预览接口
      const result = await portfolioStore.importPreview(data)
      if (result.success) {
        importPreview.value = result.preview
        importStep.value = 'preview'
      } else {
        errorMessage.value = result.error || '预览失败'
        setTimeout(() => errorMessage.value = '', 3000)
      }
    } catch (error) {
      console.error('File parse error:', error)
      errorMessage.value = '文件解析失败，请检查文件格式'
      setTimeout(() => errorMessage.value = '', 3000)
    }
  }
  reader.readAsText(file)
}

// 确认导入
const confirmImport = async () => {
  if (isSubmitting.value.import || !importData.value) return

  isSubmitting.value.import = true
  try {
    const result = await portfolioStore.importConfirm(importData.value, conflictStrategy.value)
    if (result.success) {
      importResult.value = {
        success: true,
        imported: result.imported,
        skipped: result.skipped,
        overwritten: result.overwritten
      }
      importStep.value = 'result'
      // 刷新数据
      await portfolioStore.fetchDashboard()
    } else {
      importResult.value = { success: false }
      importError.value = result.error || '导入失败'
      importStep.value = 'result'
    }
  } catch (error) {
    console.error('Import error:', error)
    importResult.value = { success: false }
    importError.value = '导入失败，请稍后重试'
    importStep.value = 'result'
  } finally {
    isSubmitting.value.import = false
  }
}

// 关闭导入对话框
const closeImportDialog = () => {
  showImportDialog.value = false
  // 重置状态
  setTimeout(() => {
    importStep.value = 'select'
    importData.value = null
    importPreview.value = {
      total_trades: 0,
      new_trades: 0,
      conflicts: 0,
      conflict_items: []
    }
    conflictStrategy.value = 'skip'
    importResult.value = {
      success: false,
      imported: 0,
      skipped: 0,
      overwritten: 0
    }
    importError.value = ''
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }, 300)
}

// 格式化交易类型
const formatTradeType = (type) => {
  const typeMap = {
    'buy': '买入',
    'sell': '卖出',
    'recharge': '充值'
  }
  return typeMap[type] || type
}

// 监听登录状态变化
watch(() => userStore.isLoggedIn, async (isLoggedIn) => {
  if (isLoggedIn) {
    await portfolioStore.fetchDashboard()
  }
})
</script>

<style scoped>
.crypto-container {
  min-height: calc(100vh - 120px);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard {
  display: block;
}

/* 运行模式标识 */
.mode-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 20px;
  width: fit-content;
}

.mode-indicator.backend {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.mode-indicator.frontend {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
}

.mode-indicator svg {
  font-size: 16px;
}

/* 登录提示 */
.login-prompt {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 40px;
}

.prompt-content {
  text-align: center;
  background: white;
  padding: 60px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.dark .prompt-content {
  background: #1e1e1e;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.prompt-icon {
  font-size: 64px;
  color: #6366f1;
  margin-bottom: 20px;
}

.prompt-content h3 {
  font-size: 24px;
  margin-bottom: 12px;
  color: #1f2937;
}

.dark .prompt-content h3 {
  color: #f3f4f6;
}

.prompt-content p {
  color: #6b7280;
  margin-bottom: 24px;
}

.dark .prompt-content p {
  color: #9ca3af;
}

.btn-login {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 32px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-login:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.overview-card {
  background-color: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.dark .overview-card {
  background-color: #1e1e1e;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.overview-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.dark .overview-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.overview-card h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
  font-weight: 500;
}

.dark .overview-card h3 {
  color: #9ca3af;
}

.overview-card .value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.dark .overview-card .value {
  color: #f3f4f6;
}

.overview-card .change {
  font-size: 14px;
  font-weight: 500;
}

.overview-card .positive {
  color: #10b981;
}

.overview-card .negative {
  color: #ef4444;
}

.usdt-card {
  position: relative;
}

.btn-recharge {
  position: absolute;
  top: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-recharge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.chart-section {
  background-color: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.dark .chart-section {
  background-color: #1e1e1e;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.chart-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.dark .chart-title {
  color: #f3f4f6;
}

.chart-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.update-time {
  font-size: 12px;
  color: #6b7280;
}

.dark .update-time {
  color: #9ca3af;
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-refresh:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.btn-refresh:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-refresh.refreshing svg {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 加载状态 */
.chart-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6b7280;
  gap: 16px;
}

.dark .chart-loading {
  color: #9ca3af;
}

.loading-spinner {
  font-size: 48px;
  color: #6366f1;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

/* 空状态 */
.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  color: #d1d5db;
  margin-bottom: 16px;
}

.dark .empty-icon {
  color: #4b5563;
}

.chart-empty p {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.dark .chart-empty p {
  color: #e5e7eb;
}

.chart-empty span {
  font-size: 14px;
  color: #9ca3af;
}

.dark .chart-empty span {
  color: #6b7280;
}

/* 图表容器 */
.chart-container {
  display: flex;
  align-items: flex-start;
  gap: 40px;
}

@media (max-width: 768px) {
  .chart-container {
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }
}

.chart {
  flex: 0 0 auto;
}

.pie-chart-wrapper {
  position: relative;
  width: 220px;
  height: 220px;
}

@media (max-width: 480px) {
  .pie-chart-wrapper {
    width: 180px;
    height: 180px;
  }
}

.pie-chart {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.pie-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  background: white;
  border-radius: 50%;
  width: 120px;
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 480px) {
  .pie-center {
    width: 100px;
    height: 100px;
  }
}

.dark .pie-center {
  background: #1e1e1e;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.pie-center .total-value {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

@media (max-width: 480px) {
  .pie-center .total-value {
    font-size: 14px;
  }
}

.dark .pie-center .total-value {
  color: #f3f4f6;
}

.pie-center .total-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.dark .pie-center .total-label {
  color: #9ca3af;
}

/* 图例样式 */
.chart-legend {
  flex: 1;
  min-width: 200px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (max-width: 768px) {
  .chart-legend {
    width: 100%;
    max-width: none;
  }
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.legend-item:hover,
.legend-item.legend-highlight {
  background-color: #f3f4f6;
}

.dark .legend-item:hover,
.dark .legend-item.legend-highlight {
  background-color: #374151;
}

.dark .legend-item {
  color: #d1d5db;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.legend-name {
  font-weight: 500;
  color: #1f2937;
  min-width: 50px;
}

.dark .legend-name {
  color: #f3f4f6;
}

.legend-value {
  color: #6b7280;
  font-size: 13px;
}

.dark .legend-value {
  color: #9ca3af;
}

.legend-percent {
  margin-left: auto;
  font-weight: 600;
  color: #6366f1;
  min-width: 45px;
  text-align: right;
}

.dark .legend-percent {
  color: #818cf8;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.dark .section-title {
  color: #f3f4f6;
}

.section-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* ==================== 交易区域新样式 ==================== */

/* 交易区域容器 */
.trading-section {
  background-color: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.dark .trading-section {
  background-color: #1e1e1e;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

/* 左右分栏布局 */
.trading-container {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
}

@media (max-width: 900px) {
  .trading-container {
    grid-template-columns: 1fr;
  }
}

/* 左侧表单区域 */
.trading-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 表单头部 */
.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.form-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.dark .form-header h3 {
  color: #f3f4f6;
}

/* 买入/卖出切换标签 */
.trade-type-tabs {
  display: flex;
  gap: 8px;
  background: #f3f4f6;
  padding: 4px;
  border-radius: 10px;
}

.dark .trade-type-tabs {
  background: #2d2d2d;
}

.type-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background: transparent;
  color: #6b7280;
}

.dark .type-tab {
  color: #9ca3af;
}

.type-tab:hover {
  color: #374151;
}

.type-tab.active {
  background: white;
  color: #1f2937;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dark .type-tab.active {
  background: #404040;
  color: #f3f4f6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 字段标签 */
.field-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 8px;
}

.dark .field-label {
  color: #9ca3af;
}

.field-hint {
  font-size: 12px;
  color: #6366f1;
  font-weight: 400;
}

/* 币种选择网格 */
.asset-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
}

.asset-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: #f9fafb;
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #374151;
}

.dark .asset-btn {
  background: #2d2d2d;
  color: #e5e7eb;
}

.asset-btn:hover {
  background: #f3f4f6;
  border-color: #e5e7eb;
  transform: translateY(-2px);
}

.dark .asset-btn:hover {
  background: #404040;
  border-color: #525252;
}

.asset-btn.active {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-color: transparent;
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.asset-btn svg {
  font-size: 24px;
}

.asset-code {
  font-size: 14px;
  font-weight: 600;
}

.asset-price {
  font-size: 11px;
  opacity: 0.8;
}

.asset-btn.active .asset-price {
  color: rgba(255, 255, 255, 0.9);
}

/* 交易输入区 */
.trade-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.input-field {
  display: flex;
  flex-direction: column;
}

.input-with-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.input-with-controls input {
  flex: 1;
  padding: 12px 16px;
  padding-right: 60px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  background: white;
  color: #1f2937;
  transition: all 0.3s ease;
}

.dark .input-with-controls input {
  background: #2d2d2d;
  border-color: #404040;
  color: #f3f4f6;
}

.input-with-controls input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.input-unit {
  position: absolute;
  right: 16px;
  font-size: 13px;
  font-weight: 500;
  color: #9ca3af;
  pointer-events: none;
}

.btn-use-market {
  padding: 8px 12px;
  background: #e0e7ff;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #6366f1;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.dark .btn-use-market {
  background: #3730a3;
  color: #a5b4fc;
}

.btn-use-market:hover {
  background: #c7d2fe;
}

.dark .btn-use-market:hover {
  background: #4338ca;
}

/* 交易提交按钮 */
.trade-submit {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn-submit {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-submit.buy {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
}

.btn-submit.buy:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.btn-submit.sell {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
}

.btn-submit.sell:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.submit-total {
  margin-left: 8px;
  padding-left: 12px;
  border-left: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 14px;
  opacity: 0.9;
}

.btn-reset {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 14px 20px;
  background: #f3f4f6;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dark .btn-reset {
  background: #2d2d2d;
  color: #9ca3af;
}

.btn-reset:hover {
  background: #e5e7eb;
  color: #4b5563;
}

.dark .btn-reset:hover {
  background: #404040;
  color: #d1d5db;
}

/* 右侧预览区域 */
.trading-preview {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dark .trading-preview {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}

.trading-preview.empty {
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 4px;
}

.dark .preview-header {
  color: #94a3b8;
}

.preview-header h4 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #94a3b8;
  text-align: center;
}

.preview-placeholder svg {
  font-size: 48px;
  opacity: 0.5;
}

.preview-placeholder p {
  margin: 0;
  font-size: 14px;
}

/* 预览内容 */
.preview-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-main {
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.dark .preview-main {
  background: #1e1e1e;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.preview-item.total {
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
}

.preview-item.total .label {
  font-size: 13px;
  color: #6b7280;
}

.dark .preview-item.total .label {
  color: #9ca3af;
}

.preview-item.total .value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
}

.dark .preview-item.total .value {
  color: #f3f4f6;
}

.preview-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 4px 0;
}

.dark .preview-divider {
  background: #334155;
}

.preview-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-details .preview-item {
  padding: 8px 0;
}

.preview-details .label {
  font-size: 13px;
  color: #64748b;
}

.dark .preview-details .label {
  color: #94a3b8;
}

.preview-details .value {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.dark .preview-details .value {
  color: #f3f4f6;
}

.preview-details .value.highlight {
  color: #6366f1;
}

.preview-details .value.positive {
  color: #10b981;
}

.preview-details .value.negative {
  color: #ef4444;
}

.preview-item.impact {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px dashed #cbd5e1;
}

.dark .preview-item.impact {
  border-top-color: #475569;
}

.preview-item.impact .label {
  font-weight: 600;
  color: #475569;
}

.dark .preview-item.impact .label {
  color: #94a3b8;
}

.preview-item.impact .value {
  font-size: 16px;
  font-weight: 700;
}

.portfolio-section,
.trades-section {
  background-color: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.dark .portfolio-section,
.dark .trades-section {
  background-color: #1e1e1e;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.filter-group {
  display: flex;
  gap: 8px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
  color: #1f2937;
  cursor: pointer;
}

.dark .filter-select {
  background-color: #2d2d2d;
  border-color: #404040;
  color: #f3f4f6;
}

.table-wrapper {
  overflow-x: auto;
}

.portfolio-table,
.trades-table {
  width: 100%;
  border-collapse: collapse;
}

.portfolio-table th,
.trades-table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
}

.dark .portfolio-table th,
.dark .trades-table th {
  color: #9ca3af;
  border-bottom-color: #404040;
}

.portfolio-table td,
.trades-table td {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.dark .portfolio-table td,
.dark .trades-table td {
  border-bottom-color: #2d2d2d;
}

.asset-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.asset-row:hover {
  background-color: #f9fafb;
}

.dark .asset-row:hover {
  background-color: #2d2d2d;
}

.asset-row.selected {
  background-color: #eff6ff;
}

.dark .asset-row.selected {
  background-color: #1e3a5f;
}

/* 已清仓资产样式 */
.asset-row.liquidated {
  opacity: 0.7;
  background-color: #f3f4f6;
}

.dark .asset-row.liquidated {
  background-color: #252525;
}

.asset-row.liquidated:hover {
  opacity: 0.9;
  background-color: #e5e7eb;
}

.dark .asset-row.liquidated:hover {
  background-color: #2d2d2d;
}

.asset-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.asset-name {
  font-weight: 600;
  color: #1f2937;
}

.dark .asset-name {
  color: #f3f4f6;
}

.asset-symbol {
  font-size: 12px;
  color: #6b7280;
}

.dark .asset-symbol {
  color: #9ca3af;
}

.asset-amount,
.asset-price,
.asset-value {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #4b5563;
}

.dark .asset-amount,
.dark .asset-price,
.dark .asset-value {
  color: #d1d5db;
}

.asset-profit {
  font-family: 'Courier New', monospace;
}

.asset-profit .positive {
  color: #10b981;
}

.asset-profit .negative {
  color: #ef4444;
}

.profit-value {
  font-weight: 600;
  font-size: 14px;
}

.profit-rate {
  font-size: 12px;
  opacity: 0.8;
}

/* 徽章基础样式 */
.status-badge,
.cost-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.status-badge {
  gap: 4px;
}

/* 回本状态 */
.status-badge.recovered,
.cost-badge.zero {
  background: #d1fae5;
  color: #059669;
}

.dark .status-badge.recovered,
.dark .cost-badge.zero {
  background: #064e3b;
  color: #34d399;
}

/* 超额回报状态 */
.status-badge.super-profit,
.cost-badge.negative {
  background: #fef3c7;
  color: #d97706;
}

.dark .status-badge.super-profit,
.dark .cost-badge.negative {
  background: #78350f;
  color: #fbbf24;
}

/* 成本价展示 */
.cost-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.cost-value {
  font-size: 14px;
  font-weight: 500;
}

.action-cell {
  display: flex;
  gap: 8px;
}

.btn-action,
.btn-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-sell {
  background: #fef2f2;
  color: #ef4444;
}

.dark .btn-sell {
  background: rgba(239, 68, 68, 0.1);
}

.btn-sell:hover {
  background: #fecaca;
}

.btn-buy {
  background: #ecfdf5;
  color: #10b981;
}

.dark .btn-buy {
  background: rgba(16, 185, 129, 0.1);
}

.btn-buy:hover {
  background: #a7f3d0;
}

.btn-delete {
  background: transparent;
  color: #9ca3af;
}

.btn-delete:hover:not(:disabled) {
  color: #ef4444;
}

.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}

.empty-state svg {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state p {
  font-size: 14px;
}

.protect-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 12px;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 14px;
  color: #4b5563;
}

.dark .protect-switch {
  background: #2d2d2d;
  color: #d1d5db;
}

.switch-label {
  font-size: 12px;
}

.switch {
  width: 36px;
  height: 20px;
  background: #d1d5db;
  border-radius: 10px;
  position: relative;
  transition: background 0.3s ease;
}

.dark .switch {
  background: #4b5563;
}

.switch.on {
  background: #10b981;
}

.switch-handle {
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s ease;
}

.switch.on .switch-handle {
  transform: translateX(16px);
}

.btn-clear,
.btn-export,
.btn-import {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-clear {
  background: #fef2f2;
  color: #ef4444;
  border: none;
}

.dark .btn-clear {
  background: rgba(239, 68, 68, 0.1);
}

.btn-clear:hover {
  background: #fecaca;
}

.btn-export {
  background: #eff6ff;
  color: #3b82f6;
  border: none;
}

.dark .btn-export {
  background: rgba(59, 130, 246, 0.1);
}

.btn-export:hover {
  background: #dbeafe;
}

.btn-import {
  background: #f3f4f6;
  color: #4b5563;
  border: none;
}

.dark .btn-import {
  background: #2d2d2d;
  color: #d1d5db;
}

.btn-import:hover {
  background: #e5e7eb;
}

.trade-row {
  transition: background-color 0.2s ease;
}

.trade-row:hover {
  background-color: #f9fafb;
}

.dark .trade-row:hover {
  background-color: #2d2d2d;
}

.trade-time {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #6b7280;
}

.dark .trade-time {
  color: #9ca3af;
}

.trade-asset {
  display: flex;
  align-items: center;
  gap: 8px;
}

.trade-type {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.trade-type.buy {
  background: #ecfdf5;
  color: #059669;
}

.dark .trade-type.buy {
  background: rgba(16, 185, 129, 0.1);
}

.trade-type.sell {
  background: #fef2f2;
  color: #dc2626;
}

.dark .trade-type.sell {
  background: rgba(239, 68, 68, 0.1);
}

.trade-type.recharge {
  background: #eff6ff;
  color: #2563eb;
}

.dark .trade-type.recharge {
  background: rgba(59, 130, 246, 0.1);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.dark .modal {
  background: #1e1e1e;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.dark .modal-header {
  border-bottom-color: #404040;
}

.modal-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.dark .modal-header h3 {
  color: #f3f4f6;
}

.btn-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 20px;
  padding: 4px;
  transition: color 0.3s ease;
}

.btn-close:hover {
  color: #4b5563;
}

.dark .btn-close:hover {
  color: #d1d5db;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
}

.dark .form-group label {
  color: #d1d5db;
}

.form-group input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  background-color: white;
  color: #1f2937;
  transition: all 0.3s ease;
}

.dark .form-group input {
  background-color: #2d2d2d;
  border-color: #404040;
  color: #f3f4f6;
}

.form-group input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
}

.dark .modal-footer {
  border-top-color: #404040;
}

.btn-cancel {
  padding: 10px 20px;
  background: #f3f4f6;
  color: #4b5563;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dark .btn-cancel {
  background: #2d2d2d;
  color: #d1d5db;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-confirm {
  padding: 10px 20px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  animation: slideUp 0.3s ease;
}

.dark .error-toast {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@media (max-width: 768px) {
  .overview {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .chart-container {
    flex-direction: column;
    align-items: center;
  }

  .chart {
    flex: 0 0 auto;
  }

  .chart-legend {
    width: 100%;
  }

  .portfolio-table,
  .trades-table {
    font-size: 12px;
  }

  .portfolio-table th,
  .portfolio-table td,
  .trades-table th,
  .trades-table td {
    padding: 8px;
  }

  .action-cell {
    flex-direction: column;
    gap: 4px;
  }

  .btn-action,
  .btn-delete {
    width: 28px;
    height: 28px;
  }
}

/* ========== 导入对话框样式 ========== */
.import-modal {
  max-width: 560px;
  width: 90%;
}

.import-step {
  padding: 20px 0;
}

/* 拖拽区域 */
.drop-zone {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 48px 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f9fafb;
}

.dark .drop-zone {
  border-color: #4b5563;
  background: #1e1e1e;
}

.drop-zone:hover,
.drop-zone.drag-over {
  border-color: #6366f1;
  background: #eff6ff;
}

.dark .drop-zone:hover,
.dark .drop-zone.drag-over {
  background: rgba(99, 102, 241, 0.1);
}

.drop-icon {
  font-size: 48px;
  color: #9ca3af;
  margin-bottom: 16px;
}

.drop-zone:hover .drop-icon,
.drop-zone.drag-over .drop-icon {
  color: #6366f1;
}

.drop-zone p {
  font-size: 16px;
  color: #374151;
  margin-bottom: 8px;
}

.dark .drop-zone p {
  color: #e5e7eb;
}

.drop-hint {
  font-size: 13px;
  color: #9ca3af;
}

/* 预览摘要 */
.preview-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.preview-item {
  flex: 1;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.dark .preview-item {
  background: #2d2d2d;
}

.preview-item.success {
  background: #ecfdf5;
}

.dark .preview-item.success {
  background: rgba(16, 185, 129, 0.1);
}

.preview-item.warning {
  background: #fffbeb;
}

.dark .preview-item.warning {
  background: rgba(245, 158, 11, 0.1);
}

.preview-label {
  display: block;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
}

.dark .preview-label {
  color: #9ca3af;
}

.preview-value {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.dark .preview-value {
  color: #f3f4f6;
}

.preview-item.success .preview-value {
  color: #059669;
}

.preview-item.warning .preview-value {
  color: #d97706;
}

/* 冲突区域 */
.conflict-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 20px;
}

.dark .conflict-section {
  border-color: #374151;
}

.conflict-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.dark .conflict-section h4 {
  color: #e5e7eb;
}

.conflict-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.dark .radio-label {
  color: #e5e7eb;
}

.radio-label input[type="radio"] {
  width: 16px;
  height: 16px;
  accent-color: #6366f1;
}

/* 冲突列表 */
.conflict-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
}

.dark .conflict-list {
  border-color: #374151;
}

.conflict-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.dark .conflict-item {
  border-color: #374151;
}

.conflict-item:last-child {
  border-bottom: none;
}

.conflict-icon {
  color: #f59e0b;
  font-size: 18px;
}

.conflict-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.conflict-symbol {
  font-weight: 600;
  color: #1f2937;
}

.dark .conflict-symbol {
  color: #f3f4f6;
}

.conflict-type {
  font-size: 12px;
  padding: 2px 8px;
  background: #f3f4f6;
  border-radius: 4px;
  color: #6b7280;
}

.dark .conflict-type {
  background: #374151;
  color: #9ca3af;
}

.conflict-reason {
  font-size: 12px;
  color: #9ca3af;
}

/* 导入结果 */
.result-success,
.result-error {
  text-align: center;
  padding: 32px;
}

.result-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.result-icon.success {
  color: #10b981;
}

.result-icon.error {
  color: #ef4444;
}

.result-success h4,
.result-error h4 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
}

.result-success h4 {
  color: #059669;
}

.result-error h4 {
  color: #dc2626;
}

.result-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-top: 24px;
}

.result-stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 32px;
  font-weight: 700;
  color: #6366f1;
}

.stat-label {
  display: block;
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.dark .stat-label {
  color: #9ca3af;
}

.result-error p {
  color: #6b7280;
  font-size: 14px;
}

.dark .result-error p {
  color: #9ca3af;
}

/* 响应式 */
@media (max-width: 640px) {
  .preview-summary {
    flex-direction: column;
    gap: 12px;
  }

  .result-stats {
    flex-direction: column;
    gap: 16px;
  }

  .drop-zone {
    padding: 32px 20px;
  }
}
</style>
