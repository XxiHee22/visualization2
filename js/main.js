/**
 * 主应用入口 - 协调应用初始化和生命周期管理
 */

import { EventBus, EVENTS } from './eventBus.js';
import { DataLoader } from './dataLoader.js';
import { DataCache } from './dataCache.js';
import { WorldMap } from './worldMap.js';
import { USMap } from './usMap.js';
import { ChinaMap } from './chinaMap.js';
import { CountryRanking } from './countryRanking.js';
import { ChinaTimeline } from './chinaTimeline.js';

// 全局变量
let eventBus = null;
let dataCache = null;
let components = {};
let currentView = 'world'; // 'world', 'us', 或 'china'

/**
 * 切换到美国地图视图
 */
function switchToUSMap() {
  console.log('切换到美国地图视图');
  currentView = 'us';
  
  // 隐藏tooltip
  const tooltip = document.getElementById('tooltip');
  if (tooltip) {
    tooltip.style.display = 'none';
  }
  
  // 销毁世界地图
  if (components.worldMap) {
    components.worldMap.destroy();
  }
  
  // 销毁中国地图（如果存在）
  if (components.chinaMap) {
    components.chinaMap.destroy();
  }
  
  // 渲染美国地图
  components.usMap.render();
  
  // 更新标题
  updateMapTitle('美国各州COVID-19疫情地图', '点击返回世界地图');
  
  // 添加返回按钮
  addBackButton();
}

/**
 * 切换到中国地图视图
 */
async function switchToChinaMap() {
  console.log('切换到中国地图视图');
  currentView = 'china';
  
  // 隐藏tooltip
  const tooltip = document.getElementById('tooltip');
  if (tooltip) {
    tooltip.style.display = 'none';
  }
  
  // 销毁世界地图
  if (components.worldMap) {
    components.worldMap.destroy();
  }
  
  // 销毁美国地图（如果存在）
  if (components.usMap) {
    components.usMap.destroy();
  }
  
  // 渲染中国地图
  await components.chinaMap.render();
  
  // 更新标题
  updateMapTitle('中国各省COVID-19疫情地图', '点击返回世界地图');
  
  // 添加返回按钮
  addBackButton();
}

/**
 * 切换回世界地图视图
 */
async function switchToWorldMap() {
  console.log('切换回世界地图视图');
  currentView = 'world';
  
  // 销毁美国地图
  if (components.usMap) {
    components.usMap.destroy();
  }
  
  // 销毁中国地图
  if (components.chinaMap) {
    components.chinaMap.destroy();
  }
  
  // 重新渲染世界地图
  await components.worldMap.render();
  
  // 恢复标题
  updateMapTitle('全球主流国家COVID-19疫情地图', '鼠标悬停在各国家上查看详细数据');
  
  // 移除返回按钮
  removeBackButton();
}

/**
 * 更新地图标题
 */
function updateMapTitle(title, description) {
  const section = document.querySelector('.chart-section');
  if (section) {
    const h2 = section.querySelector('h2');
    const p = section.querySelector('.chart-description');
    if (h2) h2.textContent = title;
    if (p) p.textContent = description;
  }
}

/**
 * 添加返回按钮
 */
function addBackButton() {
  const container = document.getElementById('us-map-container');
  if (!container) return;
  
  // 检查是否已存在返回按钮
  if (document.getElementById('back-to-world-btn')) return;
  
  const button = document.createElement('button');
  button.id = 'back-to-world-btn';
  button.textContent = '← 返回世界地图';
  button.style.cssText = `
    position: absolute;
    top: -10px;
    left: 10px;
    padding: 10px 20px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    z-index: 1000;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  `;
  
  button.addEventListener('click', switchToWorldMap);
  button.addEventListener('mouseover', () => {
    button.style.background = '#5568d3';
  });
  button.addEventListener('mouseout', () => {
    button.style.background = '#667eea';
  });
  
  container.style.position = 'relative';
  container.appendChild(button);
}

/**
 * 移除返回按钮
 */
function removeBackButton() {
  const button = document.getElementById('back-to-world-btn');
  if (button) {
    button.remove();
  }
}

/**
 * 显示加载指示器
 */
function showLoadingIndicator() {
  const indicator = document.getElementById('loading-indicator');
  if (indicator) {
    indicator.style.display = 'flex';
  }
}

/**
 * 隐藏加载指示器
 */
function hideLoadingIndicator() {
  const indicator = document.getElementById('loading-indicator');
  if (indicator) {
    indicator.style.display = 'none';
  }
}

/**
 * 显示错误消息
 */
function showError({ title, message, details, action }) {
  const errorContainer = document.getElementById('error-container');
  if (!errorContainer) return;

  errorContainer.innerHTML = `
    <div class="error-box error-level-error">
      <h3>${title}</h3>
      <p class="error-message">${message}</p>
      <details>
        <summary>详细信息</summary>
        <pre>${details}</pre>
      </details>
      <p class="error-action">${action}</p>
    </div>
  `;
  errorContainer.style.display = 'block';

  console.error(`[${title}] ${message}`, details);
}

/**
 * 隐藏错误消息
 */
function hideError() {
  const errorContainer = document.getElementById('error-container');
  if (errorContainer) {
    errorContainer.style.display = 'none';
  }
}

/**
 * 检查浏览器兼容性
 */
function checkBrowserCompatibility() {
  const features = {
    svg: !!document.createElementNS && 
         !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect,
    fetch: typeof fetch !== 'undefined',
    promise: typeof Promise !== 'undefined',
    es6: (function() {
      try {
        eval('const x = () => {}');
        return true;
      } catch (e) {
        return false;
      }
    })()
  };

  const unsupported = Object.entries(features)
    .filter(([_, supported]) => !supported)
    .map(([feature]) => feature);

  if (unsupported.length > 0) {
    showError({
      title: '浏览器不兼容',
      message: '您的浏览器不支持必需的功能',
      details: `不支持的功能: ${unsupported.join(', ')}`,
      action: '请使用Chrome、Firefox、Safari或Edge的最新版本'
    });
    return false;
  }

  return true;
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
  // 指标切换
  const metricSelector = document.getElementById('metric-selector');
  if (metricSelector) {
    metricSelector.addEventListener('change', (e) => {
      const metric = e.target.value;
      eventBus.emit(EVENTS.METRIC_CHANGED, { metric });
    });
  }

  // 省份筛选
  const provinceFilter = document.getElementById('province-filter');
  if (provinceFilter) {
    provinceFilter.addEventListener('change', (e) => {
      const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
      eventBus.emit(EVENTS.PROVINCES_FILTERED, { provinces: selected });
    });
  }

  // 订阅事件
  eventBus.on(EVENTS.METRIC_CHANGED, ({ metric }) => {
    if (components.countryRanking) {
      components.countryRanking.updateMetric(metric);
    }
  });

  eventBus.on(EVENTS.PROVINCES_FILTERED, ({ provinces }) => {
    if (components.chinaTimeline) {
      components.chinaTimeline.updateProvinces(provinces);
    }
  });

  eventBus.on(EVENTS.ERROR_OCCURRED, (error) => {
    handleError(error);
  });
}

/**
 * 错误处理
 */
function handleError(error) {
  console.error('Application error:', error);
  
  showError({
    title: '应用错误',
    message: error.message || '发生未知错误',
    details: error.stack || error.toString(),
    action: '请刷新页面重试，或联系技术支持'
  });
}

/**
 * 初始化应用
 */
async function init() {
  try {
    console.log('=== 应用初始化开始 ===');
    
    // 检查浏览器兼容性
    if (!checkBrowserCompatibility()) {
      return;
    }
    console.log('✓ 浏览器兼容性检查通过');

    // 显示加载指示器
    showLoadingIndicator();
    hideError();

    // 初始化事件总线和缓存
    eventBus = new EventBus();
    dataCache = new DataCache();
    console.log('✓ 事件总线和缓存初始化完成');

    // 加载数据
    console.log('开始加载数据...');
    const dataLoader = new DataLoader();
    const { geoData, usData, nationsData, globalData, chinaData } = await dataLoader.loadAll();
    console.log('✓ 所有数据加载完成');
    console.log('  - GeoJSON特征数:', geoData.features.length);
    console.log('  - 美国州数据:', usData.length);
    console.log('  - 各国数据:', nationsData.length);
    console.log('  - 全球数据记录:', globalData.length);
    console.log('  - 中国省份数据:', chinaData.length);

    // 缓存数据
    dataCache.set('geoData', geoData);
    dataCache.set('usData', usData);
    dataCache.set('nationsData', nationsData);
    dataCache.set('globalData', globalData);
    dataCache.set('chinaData', chinaData);
    console.log('✓ 数据缓存完成');

    // 初始化组件
    console.log('开始初始化组件...');
    
    // 初始化世界地图（带切换到美国和中国地图的回调）
    components.worldMap = new WorldMap('us-map-container', nationsData, 
      () => switchToUSMap(),  // 点击美国的回调
      () => switchToChinaMap() // 点击中国的回调
    );
    console.log('✓ 世界地图组件初始化完成');
    
    // 初始化美国地图（但不立即渲染）
    components.usMap = new USMap('us-map-container', geoData, usData);
    console.log('✓ 美国地图组件初始化完成');
    
    // 初始化中国地图（但不立即渲染）
    components.chinaMap = new ChinaMap('us-map-container', () => switchToWorldMap(), chinaData);
    console.log('✓ 中国地图组件初始化完成');
    
    components.countryRanking = new CountryRanking('country-ranking-container', nationsData);
    console.log('✓ 国家排名组件初始化完成');
    
    components.chinaTimeline = new ChinaTimeline('china-timeline-container', globalData);
    console.log('✓ 中国时间序列组件初始化完成');

    // 设置事件监听器
    setupEventListeners();
    console.log('✓ 事件监听器设置完成');

    // 渲染组件 - 默认显示世界地图
    console.log('开始渲染组件...');
    await components.worldMap.render();
    console.log('✓ 世界地图渲染完成');
    
    components.countryRanking.render('confirmed');
    console.log('✓ 国家排名图表渲染完成');
    
    components.chinaTimeline.render([]); // 初始显示所有省份
    console.log('✓ 中国时间序列图表渲染完成');

    // 隐藏加载指示器
    hideLoadingIndicator();

    // 发布数据加载完成事件
    eventBus.emit(EVENTS.DATA_LOADED, { geoData, usData, nationsData, globalData, chinaData });

    console.log('=== 应用初始化成功 ===');

  } catch (error) {
    console.error('=== 应用初始化失败 ===');
    console.error(error);
    hideLoadingIndicator();
    handleError(error);
  }
}

// 页面加载完成后初始化应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// 导出供调试使用
window.app = {
  eventBus,
  dataCache,
  components,
  reinit: init
};
