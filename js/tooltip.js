/**
 * Tooltip组件 - 显示鼠标悬停时的详细信息
 */

export class Tooltip {
  constructor() {
    this.tooltip = document.getElementById('tooltip');
    if (!this.tooltip) {
      console.error('Tooltip element not found');
    }
  }

  /**
   * 显示提示框
   * @param {Object} data - 要显示的数据
   * @param {MouseEvent} event - 鼠标事件（用于定位）
   */
  show(data, event) {
    if (!this.tooltip) return;

    // 格式化数据为HTML
    this.tooltip.innerHTML = this.format(data);

    // 定位提示框
    const x = event.pageX + 15;
    const y = event.pageY + 15;

    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
    this.tooltip.style.display = 'block';
  }

  /**
   * 隐藏提示框
   */
  hide() {
    if (!this.tooltip) return;
    this.tooltip.style.display = 'none';
  }

  /**
   * 格式化数据为HTML
   * @param {Object} data - 数据对象
   * @returns {string} HTML字符串
   */
  format(data) {
    // 根据数据类型格式化
    if (data.state) {
      // 美国地图数据
      return `
        <h4>${data.state}</h4>
        <p><strong>确诊:</strong> ${this._formatNumber(data.confirmed)}</p>
        <p><strong>死亡:</strong> ${this._formatNumber(data.deaths)}</p>
        <p><strong>治愈:</strong> ${this._formatNumber(data.recovered)}</p>
      `;
    } else if (data.country) {
      // 国家排名数据
      return `
        <h4>${data.country}</h4>
        <p><strong>确诊:</strong> ${this._formatNumber(data.confirmed)}</p>
        <p><strong>死亡:</strong> ${this._formatNumber(data.deaths)}</p>
        <p><strong>治愈:</strong> ${this._formatNumber(data.recovered)}</p>
      `;
    } else if (data.province && data.date) {
      // 中国省份时间序列数据
      return `
        <h4>${data.province}</h4>
        <p><strong>日期:</strong> ${this._formatDate(data.date)}</p>
        <p><strong>治愈:</strong> ${this._formatNumber(data.recovered)}</p>
      `;
    }

    // 默认格式
    return '<p>无数据</p>';
  }

  /**
   * 格式化数字（添加千分位分隔符）
   * @param {number} num - 数字
   * @returns {string}
   */
  _formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('zh-CN');
  }

  /**
   * 格式化日期
   * @param {Date} date - 日期对象
   * @returns {string}
   */
  _formatDate(date) {
    if (!date || !(date instanceof Date)) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
}
