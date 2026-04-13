/**
 * 中国省份时间序列折线图组件
 */

import { filterChinaData, groupByProvince, filterByProvinces, getAllProvinces } from './dataAggregation.js';
import { Tooltip } from './tooltip.js';

export class ChinaTimeline {
  constructor(containerId, globalData) {
    this.containerId = containerId;
    this.globalData = globalData;
    this.tooltip = new Tooltip();
    
    // 图表尺寸
    this.width = 1400;
    this.height = 800;
    this.margin = { top: 60, right: 150, bottom: 100, left: 100 };  // 增加底部边距从120到150
    
    // SVG容器
    this.svg = null;
    this.g = null;
    
    // 比例尺
    this.xScale = null;
    this.yScale = null;
    
    // 折线生成器
    this.line = null;
    
    // 颜色比例尺
    this.colorScale = null;
    
    // 数据
    this.chinaData = null;
    this.timeSeriesData = null;
    this.selectedProvinces = [];
    
    // 处理数据
    this._filterChinaData();
    this._groupByProvince();
  }

  /**
   * 过滤中国大陆数据
   */
  _filterChinaData() {
    this.chinaData = filterChinaData(this.globalData);
  }

  /**
   * 按省份分组
   */
  _groupByProvince() {
    this.timeSeriesData = groupByProvince(this.chinaData);
  }

  /**
   * 创建比例尺
   */
  _createScales(data) {
    // 获取所有日期和数值
    const allDates = [];
    const allValues = [];
    
    data.forEach(d => {
      d.timeSeries.forEach(t => {
        allDates.push(t.date);
        allValues.push(t.recovered); // 改为治愈数
      });
    });

    // X轴：时间
    this.xScale = d3.scaleTime()
      .domain(d3.extent(allDates))
      .range([0, this.width - this.margin.left - this.margin.right]);

    // Y轴：治愈数 - 使用对数比例尺
    const maxValue = d3.max(allValues) || 1;
    const minValue = d3.min(allValues.filter(v => v > 0)) || 1;
    
    this.yScale = d3.scaleLog()
      .domain([Math.max(minValue, 1), maxValue * 1.1])
      .range([this.height - this.margin.top - this.margin.bottom, 0])
      .clamp(true);
  }

  /**
   * 创建折线生成器
   */
  _createLineGenerator() {
    this.line = d3.line()
      .defined(d => d.recovered > 0) // 只绘制大于0的点
      .x(d => this.xScale(d.date))
      .y(d => this.yScale(Math.max(d.recovered, 1))) // 确保至少为1
      .curve(d3.curveMonotoneX); // 平滑曲线
  }

  /**
   * 创建颜色比例尺
   */
  _createColorScale(provinces) {
    this.colorScale = d3.scaleOrdinal()
      .domain(provinces)
      .range(d3.schemeCategory10);
  }

  /**
   * 渲染折线图
   */
  render(provinces = []) {
    this.selectedProvinces = provinces;
    
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container ${this.containerId} not found`);
      return;
    }

    // 清空容器
    container.innerHTML = '';

    // 获取容器尺寸
    const containerWidth = container.clientWidth;
    this.width = containerWidth > 0 ? containerWidth : 1400;
    this.height = this.width * 0.55;

    // 筛选数据
    const displayData = filterByProvinces(this.timeSeriesData, provinces);
    
    if (displayData.length === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 50px; color: #999;">请选择省份查看数据</p>';
      return;
    }

    // 创建比例尺和折线生成器
    this._createScales(displayData);
    this._createLineGenerator();
    this._createColorScale(displayData.map(d => d.province));

    // 创建SVG
    this.svg = d3.select(`#${this.containerId}`)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    this.g = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    // 绘制坐标轴
    this._createAxes();

    // 绘制折线
    this._drawLines(displayData);

    // 创建图例
    this._createLegend(displayData);

    // 填充省份选择器
    this._populateProvinceFilter();
  }

  /**
   * 创建坐标轴
   */
  _createAxes() {
    // X轴
    this.g.append('g')
      .attr('class', 'x-axis axis')
      .attr('transform', `translate(0, ${this.height - this.margin.top - this.margin.bottom})`)
      .call(d3.axisBottom(this.xScale).ticks(8).tickFormat(d3.timeFormat('%m/%d')));

    // Y轴 - 使用对数刻度的合理数量
    this.g.append('g')
      .attr('class', 'y-axis axis')
      .call(d3.axisLeft(this.yScale)
        .ticks(8, ",.0f")
        .tickValues([1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000]
          .filter(v => v >= this.yScale.domain()[0] && v <= this.yScale.domain()[1])));

    // 轴标签
    this.g.append('text')
      .attr('class', 'x-axis-label')
      .attr('x', (this.width - this.margin.left - this.margin.right) / 2)
      .attr('y', this.height - this.margin.top - this.margin.bottom + 135)  // 增加距离从90到110
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .text('日期');

    this.g.append('text')
      .attr('class', 'y-axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(this.height - this.margin.top - this.margin.bottom) / 2)
      .attr('y', -80)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('治愈病例数'); // 改为治愈病例数
  }

  /**
   * 绘制折线
   */
  _drawLines(data) {
    const self = this;
    
    // 绘制每个省份的折线
    data.forEach(d => {
      this.g.append('path')
        .datum(d.timeSeries)
        .attr('class', 'line')
        .attr('d', this.line)
        .attr('stroke', this.colorScale(d.province))
        .attr('stroke-width', 5)
        .attr('fill', 'none')
        .on('mouseover', function() {
          d3.select(this).attr('stroke-width', 8);
        })
        .on('mouseout', function() {
          d3.select(this).attr('stroke-width', 5);
        });

      // 添加数据点
      this.g.selectAll(`.dot-${d.province.replace(/\s+/g, '-')}`)
        .data(d.timeSeries.filter(t => t.recovered > 0)) // 只显示大于0的点
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', t => this.xScale(t.date))
        .attr('cy', t => this.yScale(Math.max(t.recovered, 1))) // 确保至少为1
        .attr('r', 3)
        .attr('fill', this.colorScale(d.province))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, t) {
          self.tooltip.show({
            province: d.province,
            date: t.date,
            recovered: t.recovered // 改为治愈数
          }, event);
          d3.select(this).attr('r', 5);
        })
        .on('mousemove', function(event, t) {
          self.tooltip.show({
            province: d.province,
            date: t.date,
            recovered: t.recovered // 改为治愈数
          }, event);
        })
        .on('mouseout', function() {
          self.tooltip.hide();
          d3.select(this).attr('r', 4);
        });
    });
  }

  /**
   * 创建图例
   */
  _createLegend(data) {
    const legend = this.g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${this.width - this.margin.left - this.margin.right + 20}, -50)`);

    const legendItems = legend.selectAll('.legend-item')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`);

    legendItems.append('line')
      .attr('x1', 0)
      .attr('x2', 30)
      .attr('y1', 10)
      .attr('y2', 10)
      .attr('stroke', d => this.colorScale(d.province))
      .attr('stroke-width', 4);

    legendItems.append('text')
      .attr('x', 40)
      .attr('y', 20)
      .style('font-size', '16px')
      .text(d => d.province);
  }

  /**
   * 填充省份选择器
   */
  _populateProvinceFilter() {
    const select = document.getElementById('province-filter');
    if (!select) return;

    // 清空现有选项
    select.innerHTML = '';

    // 获取所有省份
    const provinces = getAllProvinces(this.timeSeriesData);

    // 添加选项
    provinces.forEach(province => {
      const option = document.createElement('option');
      option.value = province;
      option.textContent = province;
      
      // 如果在选中列表中，设置为选中
      if (this.selectedProvinces.includes(province)) {
        option.selected = true;
      }
      
      select.appendChild(option);
    });
  }

  /**
   * 更新省份筛选
   */
  updateProvinces(provinces) {
    this.selectedProvinces = provinces;
    
    // 筛选数据
    const displayData = filterByProvinces(this.timeSeriesData, provinces);
    
    if (displayData.length === 0) {
      const container = document.getElementById(this.containerId);
      container.innerHTML = '<p style="text-align: center; padding: 50px; color: #999;">请选择省份查看数据</p>';
      return;
    }

    // 更新比例尺
    this._createScales(displayData);
    this._createLineGenerator();
    this._createColorScale(displayData.map(d => d.province));

    // 更新坐标轴
    this.g.select('.y-axis')
      .transition()
      .duration(500)
      .call(d3.axisLeft(this.yScale)
        .ticks(8, ",.0f")
        .tickValues([1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000]
          .filter(v => v >= this.yScale.domain()[0] && v <= this.yScale.domain()[1])))
     .selectAll('text')
      .style('font-size', '12px');

    // 移除旧折线和数据点
    this.g.selectAll('.line').remove();
    this.g.selectAll('.dot').remove();
    this.g.select('.legend').remove();

    // 绘制新折线
    this._drawLines(displayData);

    // 更新图例
    this._createLegend(displayData);
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
