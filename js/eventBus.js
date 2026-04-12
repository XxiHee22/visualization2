/**
 * 事件总线 - 实现发布-订阅模式，用于组件间解耦通信
 */

// 事件名称常量
export const EVENTS = {
  DATA_LOADED: 'data:loaded',
  METRIC_CHANGED: 'metric:changed',
  PROVINCES_FILTERED: 'provinces:filtered',
  ERROR_OCCURRED: 'error:occurred'
};

export class EventBus {
  constructor() {
    this.events = new Map();
  }

  /**
   * 订阅事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
  }

  /**
   * 发布事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  emit(event, data) {
    if (!this.events.has(event)) {
      return;
    }
    
    const callbacks = this.events.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error);
      }
    });
  }

  /**
   * 取消订阅
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (!this.events.has(event)) {
      return;
    }
    
    const callbacks = this.events.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * 清除所有事件监听器
   */
  clear() {
    this.events.clear();
  }
}
