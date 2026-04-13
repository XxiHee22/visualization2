/**
 * 国家排名柱状图组件
 */

import { Tooltip } from './tooltip.js';

export class CountryRanking {
  constructor(containerId, nationsData) {
    this.containerId = containerId;
    this.nationsData = nationsData; // 直接使用nations数据
    this.tooltip = new Tooltip();
    
    // 图表尺寸
    this.width = 1200;
    this.height = 600;
    this.margin = { top: 60, right: 100, bottom: 150, left: 150 };
    
    // SVG容器
    this.svg = null;
    this.g = null;
    
    // 比例尺
    this.xScale = null;
    this.yScale = null;
    
    // 当前指标
    this.currentMetric = 'confirmed';
  }

  /**
   * 获取Top 6国家
   */
  _getTopCountries(metric) {
    return this.nationsData
      .filter(d => d[metric] > 0) // 过滤掉0值
      .sort((a, b) => b[metric] - a[metric]) // 降序排序
      .slice(0, 6); // 取前6个
  }

  /**
   * 创建坐标轴
   */
  _createAxes(data) {
    // X轴：国家名称
    this.xScale = d3.scaleBand()
      .domain(data.map(d => d.country))
      .range([0, this.width - this.margin.left - this.margin.right])
      .padding(0.4);

    // Y轴：数值
    const maxValue = d3.max(data, d => d[this.currentMetric]) || 1;
    this.yScale = d3.scaleLinear()
      .domain([0, maxValue * 1.1]) // 留10%空间
      .range([this.height - this.margin.top - this.margin.bottom, 0]);

    // 绘制X轴
    this.g.append('g')
      .attr('class', 'x-axis axis')
      .attr('transform', `translate(0, ${this.height - this.margin.top - this.margin.bottom})`)
      .call(d3.axisBottom(this.xScale))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('dx', '-0.5em')
      .attr('dy', '0.5em');

    // 绘制Y轴
    this.g.append('g')
      .attr('class', 'y-axis axis')
      .call(d3.axisLeft(this.yScale).ticks(5).tickFormat(d => d.toLocaleString()));

    // Y轴标签
    this.g.append('text')
      .attr('class', 'y-axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(this.height - this.margin.top - this.margin.bottom) / 2)
      .attr('y', -80)
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .text(this._getMetricLabel());
  }

  /**
   * 获取指标标签
   */
  _getMetricLabel() {
    const labels = {
      confirmed: '确诊病例数',
      deaths: '死亡病例数',
      recovered: '治愈病例数'
    };
    return labels[this.currentMetric] || '病例数';
  }

  /**
   * 渲染柱状图
   */
  render(metric = 'confirmed') {
    this.currentMetric = metric;
    
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container ${this.containerId} not found`);
      return;
    }

    // 清空容器
    container.innerHTML = '';

    // 获取容器尺寸
    const containerWidth = container.clientWidth;
    this.width = containerWidth > 0 ? containerWidth : 1200;
    this.height = this.width * 0.5 + 100; // 保持2:1比例并增加20px高度

    // 获取Top 6国家
    const topCountries = this._getTopCountries(this.currentMetric);

    // 创建SVG
    this.svg = d3.select(`#${this.containerId}`)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    this.g = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    // 创建坐标轴
    this._createAxes(topCountries);

    // 绘制柱子
    const self = this;
    this.g.selectAll('.bar')
      .data(topCountries)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => this.xScale(d.country))
      .attr('y', d => this.yScale(d[this.currentMetric]))
      .attr('width', this.xScale.bandwidth())
      .attr('height', d => this.height - this.margin.top - this.margin.bottom - this.yScale(d[this.currentMetric]))
      .attr('fill', '#667eea')
      .on('mouseover', function(event, d) {
        self.tooltip.show(d, event);
        d3.select(this).style('opacity', 0.8);
      })
      .on('mousemove', function(event, d) {
        self.tooltip.show(d, event);
      })
      .on('mouseout', function() {
        self.tooltip.hide();
        d3.select(this).style('opacity', 1);
      });

    // 添加数值标注
    this.g.selectAll('.bar-label')
      .data(topCountries)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', d => this.xScale(d.country) + this.xScale.bandwidth() / 2)
      .attr('y', d => this.yScale(d[this.currentMetric]) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text(d => d[this.currentMetric].toLocaleString());
  }

  /**
   * 更新指标
   */
  updateMetric(metric) {
    this.currentMetric = metric;
    
    // 获取新的Top 6国家
    const topCountries = this._getTopCountries(metric);

    // 更新Y轴
    const maxValue = d3.max(topCountries, d => d[this.currentMetric]) || 1;
    this.yScale.domain([0, maxValue * 1.1]);

    this.g.select('.y-axis')
      .transition()
      .duration(500)
      .call(d3.axisLeft(this.yScale).ticks(5).tickFormat(d => d.toLocaleString()));

    // 更新Y轴标签
    this.g.select('.y-axis-label')
      .text(this._getMetricLabel());

    // 更新X轴
    this.xScale.domain(topCountries.map(d => d.country));
    this.g.select('.x-axis')
      .transition()
      .duration(500)
      .call(d3.axisBottom(this.xScale))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('dx', '-0.5em')
      .attr('dy', '0.5em');

    // 更新柱子
    this._transitionBars(topCountries);
  }

  /**
   * 动画过渡柱子
   */
  _transitionBars(newData) {
    const self = this;
    
    // 更新现有柱子
    const bars = this.g.selectAll('.bar')
      .data(newData, d => d.country);

    // 移除旧柱子
    bars.exit()
      .transition()
      .duration(500)
      .attr('height', 0)
      .attr('y', this.height - this.margin.top - this.margin.bottom)
      .remove();

    // 更新柱子
    bars.transition()
      .duration(500)
      .attr('x', d => this.xScale(d.country))
      .attr('y', d => this.yScale(d[this.currentMetric]))
      .attr('width', this.xScale.bandwidth())
      .attr('height', d => this.height - this.margin.top - this.margin.bottom - this.yScale(d[this.currentMetric]));

    // 添加新柱子
    bars.enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => this.xScale(d.country))
      .attr('y', this.height - this.margin.top - this.margin.bottom)
      .attr('width', this.xScale.bandwidth())
      .attr('height', 0)
      .attr('fill', '#667eea')
      .on('mouseover', function(event, d) {
        self.tooltip.show(d, event);
        d3.select(this).style('opacity', 0.8);
      })
      .on('mousemove', function(event, d) {
        self.tooltip.show(d, event);
      })
      .on('mouseout', function() {
        self.tooltip.hide();
        d3.select(this).style('opacity', 1);
      })
      .transition()
      .duration(500)
      .attr('y', d => this.yScale(d[this.currentMetric]))
      .attr('height', d => this.height - this.margin.top - this.margin.bottom - this.yScale(d[this.currentMetric]));

    // 更新标注
    const labels = this.g.selectAll('.bar-label')
      .data(newData, d => d.country);

    labels.exit().remove();

    labels.transition()
      .duration(500)
      .attr('x', d => this.xScale(d.country) + this.xScale.bandwidth() / 2)
      .attr('y', d => this.yScale(d[this.currentMetric]) - 5)
      .text(d => d[this.currentMetric].toLocaleString());

    labels.enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', d => this.xScale(d.country) + this.xScale.bandwidth() / 2)
      .attr('y', this.height - this.margin.top - this.margin.bottom)
      .attr('text-anchor', 'middle')
      .style('font-size', '24px')
      .style('font-weight', 'bold')
      .transition()
      .duration(500)
      .attr('y', d => this.yScale(d[this.currentMetric]) - 5)
      .text(d => d[this.currentMetric].toLocaleString());
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
