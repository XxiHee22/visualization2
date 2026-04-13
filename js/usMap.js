/**
 * 美国地图组件 - 渲染美国地图，显示各州COVID数据
 */

import { Tooltip } from './tooltip.js';

export class USMap {
  constructor(containerId, geoData, covidData) {
    this.containerId = containerId;
    this.geoData = geoData;
    this.covidData = covidData;
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
    
    // 创建州名称到数据的映射
    this._createDataMap();
  }

  /**
   * 创建州名称到COVID数据的映射
   */
  _createDataMap() {
    this.dataMap = new Map();
    this.covidData.forEach(d => {
      if (d.state) {
        this.dataMap.set(d.state, d);
      }
    });
    console.log(`数据映射创建: ${this.dataMap.size} 个州`);
    if (this.dataMap.size > 0) {
      const firstState = Array.from(this.dataMap.keys())[0];
      console.log(`第一个州示例: "${firstState}"`);
    }
  }

  /**
   * 获取州名称（从GeoJSON属性中）
   */
  _getStateName(feature) {
    // TopoJSON的states数据使用name属性
    return feature.properties.name || feature.properties.NAME || '';
  }

  /**
   * 创建地图投影
   */
  _createProjection() {
    // 使用Albers USA投影（适合美国地图）
    const scaleFactor = this.width / 960 * 550;
    this.projection = d3.geoAlbersUsa()
      .scale(scaleFactor)
      .translate([this.width / 2, this.height / 2]);
    
    this.path = d3.geoPath().projection(this.projection);
    
    console.log(`投影设置: scale=${scaleFactor}, translate=[${this.width/2}, ${this.height/2}]`);
  }

  /**
   * 创建颜色比例尺
   */
  _createColorScale() {
    // 获取所有确诊数
    const confirmedValues = this.covidData.map(d => d.confirmed);
    const maxConfirmed = d3.max(confirmedValues) || 1;
    
    // 创建颜色比例尺（从浅到深）
    this.colorScale = d3.scaleSequential()
      .domain([0, maxConfirmed])
      .interpolator(d3.interpolateReds);
    
    console.log(`颜色比例尺: 0 - ${maxConfirmed.toLocaleString()}`);
  }

  /**
   * 渲染地图
   */
  render() {
    console.log('=== USMap.render() 开始 ===');
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
    this.height = this.width * 0.55; // 与世界地图保持一致的比例
    console.log(`✓ 容器尺寸: ${this.width} x ${this.height}`);

    // 创建投影和颜色比例尺
    this._createProjection();
    this._createColorScale();
    console.log('✓ 投影和颜色比例尺创建完成');

    // 创建SVG
    this.svg = d3.select(`#${this.containerId}`)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    this.g = this.svg.append('g');
    console.log('✓ SVG创建完成');

    // 检查数据
    console.log(`GeoJSON特征数: ${this.geoData.features.length}`);
    console.log(`COVID数据州数: ${this.covidData.length}`);
    console.log(`数据映射大小: ${this.dataMap.size}`);
    
    // 检查匹配情况
    let matchCount = 0;
    this.geoData.features.forEach(feature => {
      const stateName = this._getStateName(feature);
      if (this.dataMap.has(stateName)) {
        matchCount++;
      } else {
        console.warn(`未找到匹配: "${stateName}"`);
      }
    });
    console.log(`✓ 匹配成功: ${matchCount}/${this.geoData.features.length} 个州`);

    // 渲染州
    const paths = this.g.selectAll('path')
      .data(this.geoData.features)
      .enter()
      .append('path')
      .attr('class', 'state')
      .attr('d', this.path)
      .attr('fill', d => {
        const stateName = this._getStateName(d);
        const stateData = this.dataMap.get(stateName);
        if (stateData) {
          return this.colorScale(stateData.confirmed);
        }
        return '#ccc'; // 无数据的州显示灰色
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', '1px')
      .attr('data-name', d => this._getStateName(d));
    
    console.log(`✓ 渲染了 ${paths.size()} 个州路径`);

    // 绑定事件
    this._bindEvents();

    // 添加图例
    this._createLegend();
    
    console.log('=== USMap.render() 完成 ===');
  }

  /**
   * 绑定鼠标事件
   */
  _bindEvents() {
    const self = this;
    
    this.g.selectAll('path.state')
      .on('mouseover', function(event, d) {
        const stateName = self._getStateName(d);
        const stateData = self.dataMap.get(stateName);
        
        if (stateData) {
          self._showTooltip(stateData, event);
        }
        
        // 高亮效果
        d3.select(this)
          .style('opacity', 0.8)
          .style('stroke', '#333')
          .style('stroke-width', '2px');
      })
      .on('mousemove', function(event, d) {
        const stateName = self._getStateName(d);
        const stateData = self.dataMap.get(stateName);
        
        if (stateData) {
          self._showTooltip(stateData, event);
        }
      })
      .on('mouseout', function() {
        self._hideTooltip();
        
        // 移除高亮
        d3.select(this)
          .style('opacity', 1)
          .style('stroke', '#fff')
          .style('stroke-width', '1px');
      });
  }

  /**
   * 显示提示框
   */
  _showTooltip(data, event) {
    this.tooltip.show(data, event);
  }

  /**
   * 隐藏提示框
   */
  _hideTooltip() {
    this.tooltip.hide();
  }

  /**
   * 创建图例
   */
  _createLegend() {
    const legendWidth = 200;
    const legendHeight = 15;
    const legendX = this.width - legendWidth - 20;
    const legendY = this.height - 50;

    // 创建图例组
    const legend = this.svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${legendX}, ${legendY})`);

    // 创建渐变
    const defs = this.svg.append('defs');
    const linearGradient = defs.append('linearGradient')
      .attr('id', 'legend-gradient');

    // 创建更细腻的渐变
    const gradientStops = 10;
    const maxConfirmed = d3.max(this.covidData.map(d => d.confirmed)) || 0;
    
    for (let i = 0; i <= gradientStops; i++) {
      const offset = (i / gradientStops * 100) + '%';
      const value = (i / gradientStops) * maxConfirmed;
      linearGradient.append('stop')
        .attr('offset', offset)
        .attr('stop-color', this.colorScale(value));
    }

    // 绘制图例矩形
    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)')
      .style('stroke', '#999')
      .style('stroke-width', '1px');

    // 添加"低"标签（左侧）
    legend.append('text')
      .attr('x', -5)
      .attr('y', legendHeight / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '12px')
      .style('fill', '#333')
      .text('低');

    // 添加"高"标签（右侧）
    legend.append('text')
      .attr('x', legendWidth + 5)
      .attr('y', legendHeight / 2)
      .attr('text-anchor', 'start')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '12px')
      .style('fill', '#333')
      .text('高');

    // 添加最小值标签（左下）
    legend.append('text')
      .attr('x', 0)
      .attr('y', legendHeight + 15)
      .attr('text-anchor', 'start')
      .style('font-size', '11px')
      .style('fill', '#666')
      .text('0');

    // 添加最大值标签（右下）
    legend.append('text')
      .attr('x', legendWidth)
      .attr('y', legendHeight + 15)
      .attr('text-anchor', 'end')
      .style('font-size', '11px')
      .style('fill', '#666')
      .text(Math.round(maxConfirmed).toLocaleString());
  }

  /**
   * 更新数据
   * @param {Array} newData - 新的COVID数据
   */
  update(newData) {
    this.covidData = newData;
    this._createDataMap();
    this._createColorScale();
    
    // 更新州的颜色
    const self = this;
    this.g.selectAll('path.state')
      .transition()
      .duration(500)
      .attr('fill', d => {
        const stateName = self._getStateName(d);
        const stateData = self.dataMap.get(stateName);
        if (stateData) {
          return self.colorScale(stateData.confirmed);
        }
        return '#ccc';
      });
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
