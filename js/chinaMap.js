/**
 * 中国地图交互显示 - 核心模块
 * 使用ECharts渲染中国地图
 */

/**
 * 验证GeoJSON数据格式
 * @param {Object} data - 待验证的GeoJSON数据
 * @returns {Object} 验证结果 { valid: boolean, error: string|null }
 */
function validateGeoJSON(data) {
  // 验证数据存在且为对象
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      error: 'GeoJSON数据无效：数据不是有效的对象'
    };
  }

  // 验证类型为FeatureCollection
  if (data.type !== 'FeatureCollection') {
    return {
      valid: false,
      error: `GeoJSON数据无效：类型必须为FeatureCollection，当前为 ${data.type || '未定义'}`
    };
  }

  // 验证features数组存在
  if (!Array.isArray(data.features)) {
    return {
      valid: false,
      error: 'GeoJSON数据无效：缺少features数组'
    };
  }

  // 验证每个feature的几何类型
  for (let i = 0; i < data.features.length; i++) {
    const feature = data.features[i];
    
    // 验证feature结构
    if (!feature || typeof feature !== 'object') {
      return {
        valid: false,
        error: `GeoJSON数据无效：features[${i}]不是有效的对象`
      };
    }

    // 验证geometry存在
    if (!feature.geometry || typeof feature.geometry !== 'object') {
      return {
        valid: false,
        error: `GeoJSON数据无效：features[${i}]缺少有效的geometry`
      };
    }

    // 验证几何类型为Polygon或MultiPolygon
    const geometryType = feature.geometry.type;
    if (geometryType !== 'Polygon' && geometryType !== 'MultiPolygon') {
      return {
        valid: false,
        error: `GeoJSON数据无效：features[${i}]的几何类型必须为Polygon或MultiPolygon，当前为 ${geometryType || '未定义'}`
      };
    }
  }

  // 所有验证通过
  return {
    valid: true,
    error: null
  };
}

/**
 * 加载地图数据
 * @param {string} mapUrl - GeoJSON数据URL
 * @returns {Promise<Object>} Promise对象，解析为GeoJSON数据
 * @throws {Error} 当加载失败或数据无效时抛出错误
 */
async function loadMapData(mapUrl) {
  // 验证URL参数
  if (!mapUrl || typeof mapUrl !== 'string') {
    throw new Error('无效的地图数据URL');
  }

  try {
    // 发起网络请求
    const response = await fetch(mapUrl);

    // 检查HTTP响应状态
    if (!response.ok) {
      throw new Error(`加载地图数据失败: HTTP ${response.status} ${response.statusText}`);
    }

    // 解析JSON数据
    const data = await response.json();

    // 基本验证：确保返回的是对象
    if (!data || typeof data !== 'object') {
      throw new Error('地图数据格式无效：不是有效的JSON对象');
    }

    return data;
  } catch (error) {
    // 处理网络错误
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`网络请求失败：无法连接到 ${mapUrl}`);
    }

    // 处理JSON解析错误
    if (error instanceof SyntaxError) {
      throw new Error('地图数据格式无效：JSON解析失败');
    }

    // 重新抛出其他错误
    throw error;
  }
}

/**
 * @typedef {Object} ProvinceInfo
 * @property {string} name - 省份名称
 * @property {string} code - 省份代码
 * @property {string} capital - 省会城市
 * @property {number} [population] - 人口（万人）
 * @property {number} [area] - 面积（平方公里）
 */

/**
 * @typedef {Object} MapConfig
 * @property {string} containerId - 容器元素ID
 * @property {Object} mapData - GeoJSON地图数据
 * @property {ProvinceInfo[]} provinces - 省份信息数组
 */

/**
 * 中国地图查看器类
 */
class ChinaMapViewer {
  /**
   * 构造函数
   * @param {MapConfig} config - 地图配置对象
   * @throws {Error} 当容器元素不存在时抛出错误
   */
  constructor(config) {
    // 验证配置对象
    if (!config || typeof config !== 'object') {
      throw new Error('配置对象无效');
    }

    // 验证containerId
    if (!config.containerId || typeof config.containerId !== 'string') {
      throw new Error('容器元素ID无效');
    }

    // 验证容器元素存在性
    const container = document.getElementById(config.containerId);
    if (!container) {
      throw new Error(`容器元素不存在: ${config.containerId}`);
    }

    // 验证mapData
    if (!config.mapData || typeof config.mapData !== 'object') {
      throw new Error('地图数据无效');
    }

    // 验证provinces数组
    if (!Array.isArray(config.provinces)) {
      throw new Error('省份数据必须是数组');
    }

    // 保存配置
    this.containerId = config.containerId;
    this.container = container;
    this.mapData = config.mapData;
    this.provinces = config.provinces;
    this.chartInstance = null;

    // 创建省份数据映射
    this.provinceDataMap = {};
    this.provinces.forEach(province => {
      this.provinceDataMap[province.name] = province;
    });
  }

  /**
   * 初始化地图
   */
  init() {
    // 创建ECharts实例
    this.chartInstance = echarts.init(this.container);

    // 注册地图数据
    echarts.registerMap('china', this.mapData);

    // 重新创建省份数据映射（使用最新的provinces数据）
    this.provinceDataMap = {};
    this.provinces.forEach(province => {
      this.provinceDataMap[province.name] = province;
    });
    
    console.log('省份数据映射已更新:', Object.keys(this.provinceDataMap).length, '个省份');
    console.log('示例省份数据:', this.provinceDataMap['湖北']);

    // 准备地图数据 - 为每个省份添加COVID数值
    // 需要同时创建带"省"字和不带"省"字的版本，以匹配地图数据
    const mapDataWithValues = [];
    
    this.provinces.forEach(province => {
      const dataItem = {
        name: province.name,  // 不带"省"的名称
        value: province.confirmed || 0,
        confirmed: province.confirmed || 0,
        deaths: province.deaths || 0,
        recovered: province.recovered || 0
      };
      
      mapDataWithValues.push(dataItem);
      
      // 同时添加带后缀的版本（省、市、自治区等）
      // 这样可以匹配地图GeoJSON中的名称
      const suffixVariants = [
        province.name + '省',
        province.name + '市',
        province.name + '自治区'
      ];
      
      // 特殊处理
      if (province.name === '内蒙古') {
        suffixVariants.push('内蒙古自治区');
      }
      if (province.name === '广西') {
        suffixVariants.push('广西壮族自治区');
      }
      if (province.name === '西藏') {
        suffixVariants.push('西藏自治区');
      }
      if (province.name === '宁夏') {
        suffixVariants.push('宁夏回族自治区');
      }
      if (province.name === '新疆') {
        suffixVariants.push('新疆维吾尔自治区');
      }
      if (province.name === '香港') {
        suffixVariants.push('香港特别行政区');
      }
      if (province.name === '澳门') {
        suffixVariants.push('澳门特别行政区');
      }
      
      // 添加所有变体
      suffixVariants.forEach(variantName => {
        mapDataWithValues.push({
          name: variantName,
          value: province.confirmed || 0,
          confirmed: province.confirmed || 0,
          deaths: province.deaths || 0,
          recovered: province.recovered || 0
        });
      });
    });

    // 计算确诊人数的最大值和最小值，用于颜色映射
    const confirmedValues = mapDataWithValues.map(d => d.confirmed).filter(v => v > 0);
    const maxConfirmed = confirmedValues.length > 0 ? Math.max(...confirmedValues) : 1000;
    const minConfirmed = confirmedValues.length > 0 ? Math.min(...confirmedValues) : 0;

    console.log('确诊人数范围:', minConfirmed, '-', maxConfirmed);
    console.log('地图数据示例:', mapDataWithValues.slice(0, 3));

    // 保存this引用，用于tooltip formatter
    const self = this;

    // 配置地图选项
    const option = {
      tooltip: {
        trigger: 'item',
        transitionDuration: 0,
        enterable: false,
        confine: true,  // 限制在图表区域内
        position: function (point) {
          // 固定位置跟随鼠标，避免抖动
          return [point[0] + 15, point[1] + 15];
        },
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: 'transparent',
        textStyle: {
          color: 'white',
          fontSize: 14,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif'
        },
        padding: [12, 16],
        formatter: (params) => {
          let provinceName = params.name;
          
          // 标准化省份名称：去掉"省"、"市"、"自治区"、"特别行政区"等后缀
          let normalizedName = provinceName
            .replace(/省$/, '')
            .replace(/市$/, '')
            .replace(/自治区$/, '')
            .replace(/特别行政区$/, '')
            .replace(/维吾尔$/, '')
            .replace(/回族$/, '')
            .replace(/壮族$/, '');
          
          // 特殊处理
          if (normalizedName === '内蒙古') normalizedName = '内蒙古';
          if (normalizedName === '广西') normalizedName = '广西';
          if (normalizedName === '西藏') normalizedName = '西藏';
          if (normalizedName === '宁夏') normalizedName = '宁夏';
          if (normalizedName === '新疆') normalizedName = '新疆';
          if (normalizedName === '香港') normalizedName = '香港';
          if (normalizedName === '澳门') normalizedName = '澳门';
          
          // 使用保存的self引用访问provinceDataMap
          const data = self.provinceDataMap[normalizedName];
          
          if (data) {
            let html = `<div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.3); padding-bottom: 5px;">${provinceName}</div>`;
            html += `<div style="font-size: 14px; line-height: 1.6;">`;
            
            // 显示COVID数据 - 所有标签使用黄色
            if (data.confirmed !== undefined && data.confirmed > 0) {
              html += `<div><strong style="color: #ffd700;">确诊:</strong> ${data.confirmed.toLocaleString()}</div>`;
            }
            if (data.deaths !== undefined && data.deaths > 0) {
              html += `<div><strong style="color: #ffd700;">死亡:</strong> ${data.deaths.toLocaleString()}</div>`;
            }
            if (data.recovered !== undefined && data.recovered > 0) {
              html += `<div><strong style="color: #ffd700;">治愈:</strong> ${data.recovered.toLocaleString()}</div>`;
            }
            
            html += `</div>`;
            return html;
          }
          return `<div style="font-size: 16px; font-weight: bold;">${provinceName}</div>`;
        }
      },
      visualMap: {
        min: minConfirmed,
        max: maxConfirmed,
        text: ['高', '低'],
        realtime: false,
        calculable: true,
        orient: 'horizontal',  // 横向显示
        inRange: {
          color: ['#fee5d9', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#99000d']
        },
        outOfRange: {
          color: '#fee5d9'  // 超出范围或没有数据的区域使用最浅的红色
        },
        textStyle: {
          color: '#333',
          fontSize: 12  // 从32缩小到12
        },
        itemWidth: 15,  // 从40缩小到15
        itemHeight: 150,  // 从400缩小到150
        right: '5%',  // 右下角
        bottom: '5%'
      },
      series: [{
        name: '中国地图',
        type: 'map',
        map: 'china',
        roam: false,
        zoom: 1.5,
        top: '25%',  // 从10%改为15%，向下移动
        data: mapDataWithValues,
        label: {
          show: false
        },
        emphasis: {
          label: { 
            show: false
          },
          itemStyle: {
            areaColor: null,  // 不改变颜色
            borderColor: '#333',
            borderWidth: 2,
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1
        }
      }]
    };

    this.chartInstance.setOption(option);
  }

  /**
   * 更新省份数据
   * @param {ProvinceInfo[]} data - 新的省份数据数组
   */
  updateProvinceData(data) {
    if (!Array.isArray(data)) {
      throw new Error('省份数据必须是数组');
    }

    // 验证必需字段
    for (const province of data) {
      if (!province.name || !province.code) {
        throw new Error('省份数据缺少必需字段（name或code）');
      }
    }

    this.provinces = data;
    this.provinceDataMap = {};
    data.forEach(province => {
      this.provinceDataMap[province.name] = province;
    });

    // 重新设置选项以更新地图
    if (this.chartInstance) {
      this.chartInstance.setOption(this.chartInstance.getOption());
    }
  }

  /**
   * 调整地图大小
   */
  resize() {
    if (this.chartInstance) {
      this.chartInstance.resize();
    }
  }

  /**
   * 销毁地图实例
   */
  destroy() {
    if (this.chartInstance) {
      this.chartInstance.dispose();
      this.chartInstance = null;
    }
    this.container.innerHTML = '';
  }
}

// 省份数据
const provinceData = [
  { name: '北京', code: '110000', capital: '北京', population: 2189, area: 16410 },
  { name: '天津', code: '120000', capital: '天津', population: 1560, area: 11966 },
  { name: '河北', code: '130000', capital: '石家庄', population: 7556, area: 188800 },
  { name: '山西', code: '140000', capital: '太原', population: 3718, area: 156700 },
  { name: '内蒙古', code: '150000', capital: '呼和浩特', population: 2534, area: 1183000 },
  { name: '辽宁', code: '210000', capital: '沈阳', population: 4375, area: 148000 },
  { name: '吉林', code: '220000', capital: '长春', population: 2704, area: 187400 },
  { name: '黑龙江', code: '230000', capital: '哈尔滨', population: 3773, area: 473000 },
  { name: '上海', code: '310000', capital: '上海', population: 2428, area: 6340 },
  { name: '江苏', code: '320000', capital: '南京', population: 8051, area: 107200 },
  { name: '浙江', code: '330000', capital: '杭州', population: 5737, area: 105500 },
  { name: '安徽', code: '340000', capital: '合肥', population: 6102, area: 140100 },
  { name: '福建', code: '350000', capital: '福州', population: 3941, area: 124000 },
  { name: '江西', code: '360000', capital: '南昌', population: 4648, area: 166900 },
  { name: '山东', code: '370000', capital: '济南', population: 10070, area: 157100 },
  { name: '河南', code: '410000', capital: '郑州', population: 9605, area: 167000 },
  { name: '湖北', code: '420000', capital: '武汉', population: 5775, area: 185900 },
  { name: '湖南', code: '430000', capital: '长沙', population: 6622, area: 211800 },
  { name: '广东', code: '440000', capital: '广州', population: 11346, area: 179800 },
  { name: '广西', code: '450000', capital: '南宁', population: 4926, area: 237600 },
  { name: '海南', code: '460000', capital: '海口', population: 917, area: 35400 },
  { name: '重庆', code: '500000', capital: '重庆', population: 3075, area: 82400 },
  { name: '四川', code: '510000', capital: '成都', population: 8302, area: 486000 },
  { name: '贵州', code: '520000', capital: '贵阳', population: 3856, area: 176200 },
  { name: '云南', code: '530000', capital: '昆明', population: 4721, area: 394100 },
  { name: '西藏', code: '540000', capital: '拉萨', population: 337, area: 1228400 },
  { name: '陕西', code: '610000', capital: '西安', population: 3864, area: 205600 },
  { name: '甘肃', code: '620000', capital: '兰州', population: 2637, area: 425800 },
  { name: '青海', code: '630000', capital: '西宁', population: 592, area: 722300 },
  { name: '宁夏', code: '640000', capital: '银川', population: 688, area: 66400 },
  { name: '新疆', code: '650000', capital: '乌鲁木齐', population: 2523, area: 1664900 },
  { name: '台湾', code: '710000', capital: '台北', population: 2359, area: 36000 },
  { name: '香港', code: '810000', capital: '香港', population: 748, area: 1106 },
  { name: '澳门', code: '820000', capital: '澳门', population: 68, area: 32 }
];

/**
 * 中国地图组件 - 兼容原有接口
 */
export class ChinaMap {
  constructor(containerId, onBackClick, covidData = []) {
    this.containerId = containerId;
    this.onBackClick = onBackClick;
    this.covidData = covidData;
    this.mapViewer = null;
  }

  /**
   * 渲染地图
   */
  async render() {
    console.log('=== ChinaMap.render() 开始 ===');
    const container = document.getElementById(this.containerId);
    
    if (!container) {
      console.error(`Container ${this.containerId} not found`);
      return;
    }
    console.log('✓ 容器找到:', this.containerId);

    try {
      // 显示加载提示
      container.innerHTML = '<div style="text-align:center;padding:50px;color:#666;font-size:24px;">正在加载地图数据...</div>';

      // 加载中国地图数据 - 使用本地文件
      const mapUrl = 'https://XxiHee22.github.io/visualization2/visualization_dataset/Chinamap.geojson';
      console.log('加载中国地图数据（本地文件）...');
      const mapData = await loadMapData(mapUrl);
      console.log('✓ 地图数据加载成功');

      // 验证数据
      const validation = validateGeoJSON(mapData);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      console.log('✓ 数据验证通过');

      // 合并省份基础数据和COVID数据
      console.log('=== 开始合并COVID数据 ===');
      console.log('COVID数据数组长度:', this.covidData.length);
      console.log('COVID数据前3条:', this.covidData.slice(0, 3));
      
      // 创建COVID数据映射
      const covidDataMap = {};
      this.covidData.forEach(item => {
        if (item.province) {
          covidDataMap[item.province] = item;
        }
      });
      console.log('COVID数据映射键:', Object.keys(covidDataMap));
      console.log('COVID数据映射示例 (湖北):', covidDataMap['湖北']);
      
      // 合并数据
      const mergedProvinceData = provinceData.map(province => {
        const covidInfo = covidDataMap[province.name] || {};
        const merged = {
          ...province,
          confirmed: covidInfo.confirmed || 0,
          deaths: covidInfo.deaths || 0,
          recovered: covidInfo.recovered || 0
        };
        
        // 如果有COVID数据，打印出来
        if (covidInfo.confirmed) {
          console.log(`✓ ${province.name} 匹配成功:`, covidInfo);
        }
        
        return merged;
      });
      
      console.log('合并后的省份数据示例 (前3个):', mergedProvinceData.slice(0, 3));
      console.log('=== COVID数据合并完成 ===');

      // 清空容器
      container.innerHTML = '';

      // 创建地图查看器
      this.mapViewer = new ChinaMapViewer({
        containerId: this.containerId,
        mapData: mapData,
        provinces: mergedProvinceData
      });

      // 初始化地图
      this.mapViewer.init();
      console.log('✓ 地图初始化完成');

      // 添加返回按钮
      this._addBackButton();
      
      // 添加交互说明
      this._addInteractionHint();

      // 窗口大小改变时调整地图
      window.addEventListener('resize', () => {
        if (this.mapViewer) {
          this.mapViewer.resize();
        }
      });

      console.log('=== ChinaMap.render() 完成 ===');

    } catch (error) {
      console.error('地图初始化失败:', error);
      
      // 清空容器
      container.innerHTML = '';
      
      // 创建错误提示容器
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'text-align:center;padding:50px;color:#d32f2f;font-size:24px;';
      errorDiv.textContent = `加载失败: ${error.message}`;
      container.appendChild(errorDiv);
      
      // 即使加载失败也显示返回按钮
      this._addBackButton();
    }
  }

  /**
   * 添加返回按钮
   */
  _addBackButton() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // 检查是否已存在返回按钮
    if (document.getElementById('china-back-btn')) return;

    const button = document.createElement('button');
    button.id = 'china-back-btn';
    button.textContent = '← 返回';
    button.style.cssText = `
      position: absolute;
      top: -30px;
      left: 10px;
      padding: 10px 20px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;

    button.addEventListener('click', () => {
      if (this.onBackClick) {
        this.onBackClick();
      }
    });

    button.addEventListener('mouseover', () => {
      button.style.background = '#45a049';
    });

    button.addEventListener('mouseout', () => {
      button.style.background = '#4CAF50';
    });

    container.style.position = 'relative';
    container.appendChild(button);
  }

  /**
   * 添加重要提示
   */
  _addImportantNotice() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // 检查是否已存在提示
    if (document.getElementById('china-important-notice')) return;

    const notice = document.createElement('div');
    notice.id = 'china-important-notice';
    notice.innerHTML = `
      <div style="font-size: 18px; margin-bottom: 12px; color: #e74c3c; font-weight: bold; text-align: center;">
        ⚠️ 重要提示 ⚠️
      </div>
      <div style="font-size: 15px; line-height: 1.8; color: #2c3e50; text-align: center;">
        老师您好，中国地图的信息源使用 aliyun，这个 API 因为敏感原因在 GitHub Pages 部署会被完全拒绝，因此加载不出来。<br><br>
        <strong style="color: #e74c3c; font-size: 16px;">请您在 VSCode 本地用 Live Server 运行以查看效果！</strong>
      </div>
    `;
    notice.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 30px 40px;
      background: linear-gradient(135deg, #fff5e6 0%, #ffe8cc 100%);
      border: 4px solid #e74c3c;
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(231, 76, 60, 0.4);
      z-index: 10000;
      max-width: 700px;
      min-width: 500px;
      animation: pulse 2s ease-in-out infinite;
    `;

    // 添加动画样式
    if (!document.getElementById('china-notice-animation')) {
      const style = document.createElement('style');
      style.id = 'china-notice-animation';
      style.textContent = `
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 10px 40px rgba(231, 76, 60, 0.4);
          }
          50% {
            box-shadow: 0 10px 50px rgba(231, 76, 60, 0.6);
          }
        }
      `;
      document.head.appendChild(style);
    }

    container.appendChild(notice);
  }

  /**
   * 添加交互说明
   */
  _addInteractionHint() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // 检查是否已存在说明
    if (document.getElementById('china-interaction-hint')) return;

    const hint = document.createElement('div');
    hint.id = 'china-interaction-hint';
    hint.innerHTML = `
      <div style="font-size: 14px; margin-bottom: 8px; color: #667eea; font-weight: 600;">
        💡 交互提示
      </div>
      <div style="font-size: 12px; line-height: 1.6; color: #555;">
        • 鼠标悬停在省份上，颜色条会显示对应数值位置<br>
        • 鼠标悬停在颜色条上，会高亮对应数值范围的省份<br>
        • 可拖动颜色条手柄筛选数据范围
      </div>
    `;
    hint.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      padding: 15px 20px;
      background: rgba(255, 255, 255, 0.95);
      border: 2px solid #667eea;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999;
      max-width: 400px;
    `;

    container.appendChild(hint);
  }

  /**
   * 销毁组件
   */
  destroy() {
    console.log('ChinaMap.destroy() 调用');
    
    // 移除返回按钮
    const button = document.getElementById('china-back-btn');
    if (button) {
      button.remove();
    }
    
    // 移除交互说明
    const hint = document.getElementById('china-interaction-hint');
    if (hint) {
      hint.remove();
    }

    // 销毁地图查看器
    if (this.mapViewer) {
      this.mapViewer.destroy();
      this.mapViewer = null;
    }
  }
}
