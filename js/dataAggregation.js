/**
 * 数据聚合函数 - 用于处理和聚合COVID数据
 */

/**
 * 按国家聚合数据
 * @param {Array} data - 全球COVID数据
 * @param {string} metric - 指标类型 ('confirmed' | 'deaths' | 'recovered')
 * @returns {Array} 聚合后的国家数据
 */
export function aggregateByCountry(data, metric = 'confirmed') {
  // 按国家分组
  const grouped = d3.group(data, d => d.country);
  
  // 聚合每个国家的数据
  const aggregated = Array.from(grouped, ([country, records]) => {
    // 获取最新日期的数据
    const latestRecords = records.filter(r => {
      const maxDate = d3.max(records, d => d.date);
      return r.date.getTime() === maxDate.getTime();
    });
    
    return {
      country,
      confirmed: d3.sum(latestRecords, d => d.confirmed),
      deaths: d3.sum(latestRecords, d => d.deaths),
      recovered: d3.sum(latestRecords, d => d.recovered),
      lastUpdate: d3.max(latestRecords, d => d.date)
    };
  });
  
  return aggregated;
}

/**
 * 获取Top N国家
 * @param {Array} data - 聚合后的国家数据
 * @param {string} metric - 指标类型
 * @param {number} count - 返回的国家数量
 * @returns {Array} Top N国家数据
 */
export function getTopCountries(data, metric = 'confirmed', count = 6) {
  return data
    .filter(d => d[metric] > 0) // 过滤掉0值
    .sort((a, b) => b[metric] - a[metric]) // 降序排序
    .slice(0, count); // 取前N个
}

/**
 * 过滤中国大陆数据
 * @param {Array} data - 全球COVID数据
 * @returns {Array} 中国大陆数据
 */
export function filterChinaData(data) {
  return data.filter(d => d.country === 'Mainland China' || d.country === 'China');
}

/**
 * 按省份分组时间序列
 * @param {Array} data - 中国COVID数据
 * @returns {Array} 按省份分组的时间序列数据
 */
export function groupByProvince(data) {
  // 按省份分组
  const grouped = d3.group(data, d => d.province);
  
  // 转换为时间序列格式
  const timeSeries = Array.from(grouped, ([province, records]) => {
    // 按日期排序
    const sorted = records.sort((a, b) => a.date - b.date);
    
    // 去重（同一天可能有多条记录，取最大值）
    const dateMap = new Map();
    sorted.forEach(r => {
      const dateKey = r.date.toDateString();
      const existing = dateMap.get(dateKey);
      if (!existing || r.confirmed > existing.confirmed) {
        dateMap.set(dateKey, r);
      }
    });
    
    return {
      province,
      timeSeries: Array.from(dateMap.values()).sort((a, b) => a.date - b.date)
    };
  });
  
  // 过滤掉空省份名称
  return timeSeries.filter(d => d.province && d.province.trim() !== '');
}

/**
 * 按省份筛选数据
 * @param {Array} timeSeriesData - 按省份分组的时间序列数据
 * @param {Array<string>} provinces - 要筛选的省份列表
 * @returns {Array} 筛选后的数据
 */
export function filterByProvinces(timeSeriesData, provinces) {
  if (!provinces || provinces.length === 0) {
    return timeSeriesData; // 空列表返回全部
  }
  
  return timeSeriesData.filter(d => provinces.includes(d.province));
}

/**
 * 获取所有省份列表
 * @param {Array} timeSeriesData - 按省份分组的时间序列数据
 * @returns {Array<string>} 省份名称列表
 */
export function getAllProvinces(timeSeriesData) {
  return timeSeriesData.map(d => d.province).sort();
}
