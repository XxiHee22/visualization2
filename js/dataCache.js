/**
 * 数据缓存模块 - 缓存已解析的数据，避免重复计算
 */

export class DataCache {
  constructor() {
    this.cache = new Map();
    this.CACHE_VALIDITY = 3600000; // 1小时（毫秒）
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {*} value - 缓存值
   */
  set(key, value) {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now()
    });
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {*} 缓存的数据，如果不存在或已过期则返回null
   */
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    // 检查缓存是否过期
    const isValid = (Date.now() - cached.timestamp) < this.CACHE_VALIDITY;
    if (!isValid) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 检查缓存是否存在
   * @param {string} key - 缓存键
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * 删除指定缓存
   * @param {string} key - 缓存键
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * 清除所有缓存
   */
  clear() {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   * @returns {number}
   */
  size() {
    return this.cache.size;
  }
}
