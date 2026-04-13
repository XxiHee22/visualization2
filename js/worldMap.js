/**
 * 世界地图组件 - 显示全球COVID数据，点击美国可切换到详细视图
 */

import { Tooltip } from './tooltip.js';

export class WorldMap {
  constructor(containerId, nationsData, onUSClick, onChinaClick) {
    this.containerId = containerId;
    this.nationsData = nationsData;
    this.onUSClick = onUSClick; // 点击美国的回调函数
    this.onChinaClick = onChinaClick; // 点击中国的回调函数
    this.tooltip = new Tooltip();
    
    // 图表尺寸
    this.width = 960;
    this.height = 600;
    this.margin = { top: 20, right: 20, bottom: 20, left: 20 };
    
    // SVG容器
    this.svg = null;
    this.g = null;
    
    // 投影和路径生成器
    this.projection = null;
    this.path = null;
    
    // 颜色比例尺
    this.colorScale = null;
    
    // 创建国家名称到数据的映射
    this._createDataMap();
  }

  /**
   * 创建国家名称到COVID数据的映射
   */
  _createDataMap() {
    this.dataMap = new Map();
    this.nationsData.forEach(d => {
      if (d.country) {
        // 标准化国家名称
        const normalizedName = this._normalizeCountryName(d.country);
        this.dataMap.set(normalizedName, d);
        // 也存储原始名称
        this.dataMap.set(d.country, d);
      }
    });
    console.log(`世界地图数据映射创建: ${this.dataMap.size} 个国家`);
  }

  /**
   * 标准化国家名称（用于匹配TopoJSON中的国家名）
   */
  _normalizeCountryName(name) {
    const mapping = {
      // 中文到英文映射
      '美国': 'United States of America',
      '中国': 'China',
      '印度': 'India',
      '法国': 'France',
      '德国': 'Germany',
      '巴西': 'Brazil',
      '韩国': 'South Korea',
      '日本': 'Japan',
      '意大利': 'Italy',
      '英国': 'United Kingdom',
      '俄罗斯': 'Russia',
      '西班牙': 'Spain',
      '阿根廷': 'Argentina',
      '哥伦比亚': 'Colombia',
      '墨西哥': 'Mexico',
      '波兰': 'Poland',
      '伊朗': 'Iran',
      '乌克兰': 'Ukraine',
      '秘鲁': 'Peru',
      '印度尼西亚': 'Indonesia',
      '土耳其': 'Turkey',
      '越南': 'Vietnam',
      '泰国': 'Thailand',
      '澳大利亚': 'Australia',
      '加拿大': 'Canada',
      '智利': 'Chile',
      '马来西亚': 'Malaysia',
      '比利时': 'Belgium',
      '荷兰': 'Netherlands',
      '捷克': 'Czechia',
      '希腊': 'Greece',
      '葡萄牙': 'Portugal',
      '以色列': 'Israel',
      '瑞士': 'Switzerland',
      '奥地利': 'Austria',
      '瑞典': 'Sweden',
      '匈牙利': 'Hungary',
      '塞尔维亚': 'Serbia',
      '约旦': 'Jordan',
      '摩洛哥': 'Morocco',
      '阿联酋': 'United Arab Emirates',
      '沙特阿拉伯': 'Saudi Arabia',
      '黎巴嫩': 'Lebanon',
      '保加利亚': 'Bulgaria',
      '斯洛伐克': 'Slovakia',
      '丹麦': 'Denmark',
      '芬兰': 'Finland',
      '挪威': 'Norway',
      '爱尔兰': 'Ireland',
      '罗马尼亚': 'Romania',
      '克罗地亚': 'Croatia',
      '立陶宛': 'Lithuania',
      '斯洛文尼亚': 'Slovenia',
      '白俄罗斯': 'Belarus',
      '哈萨克斯坦': 'Kazakhstan',
      '菲律宾': 'Philippines',
      '新加坡': 'Singapore',
      '南非': 'South Africa',
      '埃及': 'Egypt',
      '尼日利亚': 'Nigeria',
      '肯尼亚': 'Kenya',
      '埃塞俄比亚': 'Ethiopia',
      '新西兰': 'New Zealand',
      
      // 英文变体映射
      'USA': 'United States of America',
      'US': 'United States of America',
      'United States': 'United States of America',
      'UK': 'United Kingdom',
      'South Korea': 'South Korea',
      'Republic of Korea': 'South Korea',
      'Czech Republic': 'Czechia',
      'UAE': 'United Arab Emirates'
    };
    
    return mapping[name] || name;
  }

  /**
   * 创建地图投影
   */
  _createProjection() {
    // 使用等距圆柱投影（适合世界地图）
     const scaleFactor = this.width / 960 * 140;
    this.projection = d3.geoNaturalEarth1()
      .scale(scaleFactor)
      .translate([this.width / 2, this.height / 2]);
    
    this.path = d3.geoPath().projection(this.projection);
    
    console.log(`世界地图投影设置完成`);
  }

  /**
   * 创建颜色比例尺
   */
  _createColorScale() {
    // 获取所有确诊数
    const confirmedValues = this.nationsData.map(d => d.confirmed);
    const maxConfirmed = d3.max(confirmedValues) || 1;
    
    // 创建颜色比例尺（从浅到深）
    this.colorScale = d3.scaleSequential()
      .domain([0, maxConfirmed])
      .interpolator(d3.interpolateReds);
    
    console.log(`世界地图颜色比例尺: 0 - ${maxConfirmed.toLocaleString()}`);
  }

  /**
   * 渲染地图
   */
  async render() {
    console.log('=== WorldMap.render() 开始 ===');
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container ${this.containerId} not found`);
      return;
    }
    console.log('✓ 容器找到:', this.containerId);

    // 清空容器
    container.innerHTML = '';

    // 获取容器尺寸
    const containerWidth = container.clientWidth;
    this.width = containerWidth > 0 ? containerWidth : 960;
    this.height = this.width * 0.55;
    console.log(`✓ 容器尺寸: ${this.width} x ${this.height}`);

    // 创建投影和颜色比例尺
    this._createProjection();
    this._createColorScale();

    // 加载世界地图数据
    console.log('加载世界地图数据...');
    const worldData = await this._loadWorldMap();
    console.log(`✓ 世界地图数据加载成功: ${worldData.features.length} 个国家`);

    // 创建SVG
    this.svg = d3.select(`#${this.containerId}`)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    this.g = this.svg.append('g');
    console.log('✓ SVG创建完成');

    // 添加外围轮廓（在国家之前渲染，作为背景）
    this._renderOutline();

    // 渲染国家
    this._renderCountries(worldData);

    // 添加标题提示
    this._addTitle();

    console.log('=== WorldMap.render() 完成 ===');
  }

  /**
   * 加载世界地图数据
   */
  async _loadWorldMap() {
    const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
    const world = await response.json();
    
    // 将TopoJSON转换为GeoJSON
    const countries = topojson.feature(world, world.objects.countries);
    
    return countries;
  }

  /**
   * 渲染外围轮廓
   */
  _renderOutline() {
    // 创建一个球体轮廓（地球的外围边界）
    const outline = {type: "Sphere"};
    
    // 先填充海洋背景
    this.g.append('path')
      .datum(outline)
      .attr('class', 'ocean')
      .attr('d', this.path)
      .attr('fill', '#a8daff') // 浅蓝色海洋
      .style('pointer-events', 'none');
    
    // 再添加外围轮廓边框
    this.g.append('path')
      .datum(outline)
      .attr('class', 'world-outline')
      .attr('d', this.path)
      .attr('fill', 'none')
      .attr('stroke', '#333')
      .attr('stroke-width', '2px')
      .style('pointer-events', 'none'); // 不响应鼠标事件
    
    console.log('✓ 世界地图外围轮廓和海洋背景已添加');
  }

  /**
   * 渲染国家
   */
  _renderCountries(worldData) {
    const self = this;
    
    this.g.selectAll('path')
      .data(worldData.features)
      .enter()
      .append('path')
      .attr('class', 'country')
      .attr('d', this.path)
      .attr('fill', d => {
        const countryName = d.properties.name;
        const countryData = this.dataMap.get(countryName);
        
        // 美国特殊高亮
        if (countryName === 'United States of America') {
          return '#ff6b6b'; // 红色高亮
        }
        
        // 中国特殊高亮
        if (countryName === 'China') {
          return '#ff9f43'; // 橙色高亮
        }
        
        if (countryData) {
          return this.colorScale(countryData.confirmed);
        }
        return '#e0e0e0'; // 无数据的国家显示浅灰色
      })
      .attr('stroke', d => {
        const countryName = d.properties.name;
        if (countryName === 'United States of America') {
          return '#c92a2a'; // 美国边框深红色
        }
        if (countryName === 'China') {
          return '#e67e22'; // 中国边框深橙色
        }
        return '#666'; // 深灰色边框，更明显
      })
      .attr('stroke-width', d => {
        const countryName = d.properties.name;
        if (countryName === 'United States of America' || countryName === 'China') {
          return '2px'; // 美国和中国边框加粗
        }
        return '1px'; // 普通国家边框加粗
      })
      .style('cursor', d => {
        const countryName = d.properties.name;
        if (countryName === 'United States of America' || countryName === 'China') {
          return 'pointer'; // 美国和中国显示手型光标
        }
        return 'default';
      })
      .on('mouseover', function(event, d) {
        const countryName = d.properties.name;
        const countryData = self.dataMap.get(countryName);
        
        if (countryData) {
          self.tooltip.show(countryData, event);
        } else if (countryName === 'United States of America') {
          self.tooltip.show({
            country: '美国',
            confirmed: self.dataMap.get('美国')?.confirmed || 0,
            deaths: self.dataMap.get('美国')?.deaths || 0,
            recovered: self.dataMap.get('美国')?.recovered || 0
          }, event);
        }
        // 中国的tooltip已移除，点击中国进入详细地图查看
        
        // 高亮效果
        d3.select(this)
          .style('opacity', 0.8);
      })
      .on('mousemove', function(event, d) {
        const countryName = d.properties.name;
        const countryData = self.dataMap.get(countryName);
        
        if (countryData) {
          self.tooltip.show(countryData, event);
        } else if (countryName === 'United States of America') {
          self.tooltip.show({
            country: '美国',
            confirmed: self.dataMap.get('美国')?.confirmed || 0,
            deaths: self.dataMap.get('美国')?.deaths || 0,
            recovered: self.dataMap.get('美国')?.recovered || 0
          }, event);
        }
        // 中国的tooltip已移除
      })
      .on('mouseout', function() {
        self.tooltip.hide();
        d3.select(this).style('opacity', 1);
      })
      .on('click', function(event, d) {
        const countryName = d.properties.name;
        if (countryName === 'United States of America') {
          // 点击美国，触发回调
          if (self.onUSClick) {
            self.onUSClick();
          }
        } else if (countryName === 'China') {
          // 点击中国，触发回调
          if (self.onChinaClick) {
            self.onChinaClick();
          }
        }
      });
    
    console.log(`✓ 渲染了 ${worldData.features.length} 个国家`);
  }

  /**
   * 添加标题提示
   */
  _addTitle() {
    const titleGroup = this.svg.append('text')
      .attr('x', this.width / 2)
      .attr('y', 30)  // 从100改为30，向上移动
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#666');
    
    // 添加文本，使用tspan高亮"美国"和"中国"
    titleGroup.append('tspan')
      .text('世界地图收录了70个主要国家的疫情数据，鼠标靠近非灰色国家即可显示详情。点击');
    
    titleGroup.append('tspan')
      .text('美国')
      .style('fill', '#ff6b6b')
      .style('font-weight', 'bold');
    
    titleGroup.append('tspan')
      .text('或');
    
    titleGroup.append('tspan')
      .text('中国')
      .style('fill', '#ff6b6b')
      .style('font-weight', 'bold');
    
    titleGroup.append('tspan')
      .text('可查看详细数据');
  }

  /**
   * 销毁组件
   */
  destroy() {
    if (this.svg) {
      this.svg.remove();
    }
  }
}
