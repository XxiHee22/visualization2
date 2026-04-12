/**
 * 数据加载器 - 负责加载、解析和验证所有数据源
 */

export class DataLoader {
  constructor() {
    this.DATA_PATHS = {
      usTopoJSON: 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json',
      usCovidData: 'https://XxiHee22.github.io/visualization2/visualization_dataset/COVID-19 Data.xlsx',
      nationsCovidData: 'https://XxiHee22.github.io/visualization2/visualization_dataset/COVID19_nations.xlsx',
      globalCovidData: 'https://XxiHee22.github.io/visualization2/visualization_dataset/covid_19_data_2.csv',
      chinaCovidData: 'https://XxiHee22.github.io/visualization2/visualization_dataset/covid_data_China.xlsx'
    };
  }

  /**
   * 加载所有数据文件
   * @returns {Promise<Object>} 包含所有解析后数据的对象
   */
  async loadAll() {
    try {
      const [geoData, usData, nationsData, globalData, chinaData] = await Promise.all([
        this.loadUSMapData(),
        this.loadUSCovidData(),
        this.loadNationsCovidData(),
        this.loadGlobalCovidData(),
        this.loadChinaCovidData()
      ]);

      return { geoData, usData, nationsData, globalData, chinaData };
    } catch (error) {
      console.error('Failed to load data:', error);
      throw error;
    }
  }

  /**
   * 加载美国地图数据（从CDN加载TopoJSON）
   * @returns {Promise<Object>} GeoJSON特征集合
   */
  async loadUSMapData() {
    console.log('从CDN加载美国地图数据...');
    const response = await fetch(this.DATA_PATHS.usTopoJSON);
    const us = await response.json();
    
    // 将TopoJSON转换为GeoJSON
    const states = topojson.feature(us, us.objects.states);
    
    console.log(`✓ 地图数据加载成功: ${states.features.length} 个州`);
    
    return states;
  }

  /**
   * 加载美国COVID数据（Excel）
   * @returns {Promise<Array>} 美国各州数据数组
   */
  async loadUSCovidData() {
    try {
      const data = await this._fetchWithRetry(this.DATA_PATHS.usCovidData, 'arraybuffer');
      
      // 使用xlsx.js解析Excel文件
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // 转换为标准格式
      const usData = jsonData.map(row => {
        let stateName = row['英文州名'] || row.State || row.state || row.NAME || '';
        // 标准化州名称
        stateName = this.normalizeStateName(stateName);
        
        return {
          state: stateName,
          confirmed: this.parseNumber(row['累计确诊'] || row.Confirmed || row.confirmed || 0),
          deaths: this.parseNumber(row['死亡'] || row.Deaths || row.deaths || 0),
          recovered: this.parseNumber(row['治愈'] || row.Recovered || row.recovered || 0)
        };
      });
      
      // 验证数据
      if (!this.validateData(usData, ['state', 'confirmed', 'deaths', 'recovered'])) {
        console.warn('US COVID data validation failed, some fields may be missing');
      }
      
      return usData;
    } catch (error) {
      console.error('Failed to load US COVID data from Excel, using mock data:', error);
      // 返回模拟数据，让应用继续运行
      return this._getMockUSData();
    }
  }

  /**
   * 加载各国COVID数据（Excel - nations）
   * @returns {Promise<Array>} 各国数据数组
   */
  async loadNationsCovidData() {
    try {
      console.log('加载各国COVID数据...');
      const data = await this._fetchWithRetry(this.DATA_PATHS.nationsCovidData, 'arraybuffer');
      
      // 使用xlsx.js解析Excel文件
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`✓ Nations数据加载成功: ${jsonData.length} 个国家`);
      console.log('列名:', Object.keys(jsonData[0]));
      
      // 转换为标准格式
      const nationsData = jsonData.map(row => ({
        country: row['国家'] || row['Country'] || row['country'] || '',
        confirmed: this.parseNumber(row['累计确诊病例'] || row['Confirmed'] || row['confirmed'] || 0),
        deaths: this.parseNumber(row['累计死亡病例'] || row['Deaths'] || row['deaths'] || 0),
        recovered: this.parseNumber(row['累计治愈病例'] || row['Recovered'] || row['recovered'] || 0)
      }));
      
      console.log(`✓ 转换完成: ${nationsData.length} 个国家`);
      console.log('第一个国家示例:', nationsData[0]);
      
      return nationsData;
    } catch (error) {
      console.error('Failed to load nations COVID data:', error);
      throw error;
    }
  }

  /**
   * 获取模拟的美国COVID数据
   */
  _getMockUSData() {
    return [
      { state: 'California', confirmed: 1234567, deaths: 12345, recovered: 1000000 },
      { state: 'Texas', confirmed: 987654, deaths: 9876, recovered: 800000 },
      { state: 'Florida', confirmed: 876543, deaths: 8765, recovered: 700000 },
      { state: 'New York', confirmed: 765432, deaths: 7654, recovered: 600000 },
      { state: 'Illinois', confirmed: 654321, deaths: 6543, recovered: 500000 },
      { state: 'Pennsylvania', confirmed: 543210, deaths: 5432, recovered: 400000 }
    ];
  }

  /**
   * 加载中国COVID数据（Excel）
   * @returns {Promise<Array>} 中国各省数据数组
   */
  async loadChinaCovidData() {
    try {
      console.log('=== 开始加载中国COVID数据 ===');
      const data = await this._fetchWithRetry(this.DATA_PATHS.chinaCovidData, 'arraybuffer');
      
      // 使用xlsx.js解析Excel文件
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      console.log('Excel工作表名称:', sheetName);
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`✓ 中国数据加载成功: ${jsonData.length} 行`);
      
      if (jsonData.length > 0) {
        console.log('Excel列名:', Object.keys(jsonData[0]));
        console.log('第一行原始数据:', jsonData[0]);
      }
      
      // 转换为标准格式 - 尝试多种可能的列名
      const chinaData = jsonData.map(row => {
        // 省份名称可能的列名
        const provinceName = row['省份'] || row['Province'] || row['province'] || row['地区'] || row['省'] || '';
        
        const converted = {
          province: provinceName,
          confirmed: this.parseNumber(row['累计确诊'] || row['确诊'] || row['Confirmed'] || row['confirmed'] || row['累计确诊病例'] || 0),
          deaths: this.parseNumber(row['死亡'] || row['累计死亡'] || row['Deaths'] || row['deaths'] || row['累计死亡病例'] || 0),
          recovered: this.parseNumber(row['治愈'] || row['累计治愈'] || row['Recovered'] || row['recovered'] || row['累计治愈病例'] || 0)
        };
        
        return converted;
      });
      
      console.log(`✓ 转换完成: ${chinaData.length} 个省份`);
      console.log('转换后第一个省份:', chinaData[0]);
      console.log('转换后前3个省份:', chinaData.slice(0, 3));
      console.log('=== 中国COVID数据加载完成 ===');
      
      return chinaData;
    } catch (error) {
      console.error('=== 加载中国COVID数据失败 ===');
      console.error('错误详情:', error);
      // 返回空数组而不是抛出错误，让应用继续运行
      return [];
    }
  }

  /**
   * 加载全球COVID时间序列数据（CSV）
   * @returns {Promise<Array>} 全球时间序列数据数组
   */
  async loadGlobalCovidData() {
    console.log('开始加载全球COVID数据...');
    const data = await this._fetchWithRetry(this.DATA_PATHS.globalCovidData);
    const lines = data.trim().split('\n');
    
    console.log(`CSV文件包含 ${lines.length} 行数据`);
    
    if (lines.length < 2) {
      throw new Error('CSV file is empty or invalid');
    }
    
    // 解析CSV头部
    const headers = lines[0].split(',').map(h => h.trim());
    console.log('CSV头部:', headers);
    
    // 解析数据行（限制数量以提高性能）
    const globalData = [];
    const maxLines = Math.min(lines.length, 5000); // 限制最多处理5000行
    
    for (let i = 1; i < maxLines; i++) {
      if (i % 1000 === 0) {
        console.log(`已处理 ${i} 行...`);
      }
      
      const values = this._parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;
      
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      
      globalData.push({
        date: this.parseDate(row.ObservationDate || row['Observation Date'] || ''),
        province: row['Province/State'] || row.Province || '',
        country: this.normalizeCountryName(row['Country/Region'] || row.Country || ''),
        confirmed: this.parseNumber(row.Confirmed || 0),
        deaths: this.parseNumber(row.Deaths || 0),
        recovered: this.parseNumber(row.Recovered || 0)
      });
    }
    
    console.log(`成功解析 ${globalData.length} 条记录`);
    
    // 验证数据
    if (!this.validateData(globalData, ['date', 'country', 'confirmed'])) {
      console.warn('Global COVID data validation failed, some fields may be missing');
    }
    
    return globalData;
  }

  /**
   * 解析CSV行（处理引号内的逗号）
   */
  _parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * 带重试机制的fetch
   * @param {string} url - 请求URL
   * @param {string} responseType - 响应类型 ('text' | 'arraybuffer')
   * @param {number} maxRetries - 最大重试次数
   */
  async _fetchWithRetry(url, responseType = 'text', maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        if (responseType === 'arraybuffer') {
          return await response.arrayBuffer();
        }
        return await response.text();
      } catch (error) {
        if (i === maxRetries - 1) {
          throw new Error(`Failed to load ${url} after ${maxRetries} attempts: ${error.message}`);
        }
        // 指数退避
        await this._sleep(Math.pow(2, i) * 1000);
      }
    }
  }

  /**
   * 延迟函数
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 验证数据完整性
   * @param {Array} data - 待验证数据
   * @param {Array<string>} requiredFields - 必需字段列表
   * @returns {boolean} 验证是否通过
   */
  validateData(data, requiredFields) {
    if (!Array.isArray(data) || data.length === 0) {
      return false;
    }
    
    // 检查前10条记录
    const samplesToCheck = Math.min(10, data.length);
    for (let i = 0; i < samplesToCheck; i++) {
      const record = data[i];
      for (const field of requiredFields) {
        if (!(field in record)) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * 解析日期
   * @param {string} dateString - 日期字符串
   * @returns {Date} Date对象
   */
  parseDate(dateString) {
    if (!dateString) return new Date(0);
    
    // 尝试多种日期格式
    // 格式1: MM/DD/YYYY
    // 格式2: YYYY-MM-DD
    // 格式3: M/D/YYYY H:MM
    
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    return new Date(0);
  }

  /**
   * 解析数值
   * @param {*} value - 数值或字符串
   * @returns {number} 解析后的数值
   */
  parseNumber(value) {
    if (typeof value === 'number') return value;
    if (!value || value === '') return 0;
    
    // 移除千分位分隔符
    const cleaned = String(value).replace(/,/g, '');
    const num = parseFloat(cleaned);
    
    return isNaN(num) ? 0 : num;
  }

  /**
   * 标准化国家名称
   * @param {string} name - 原始国家名称
   * @returns {string} 标准化后的名称
   */
  normalizeCountryName(name) {
    const mapping = {
      'Mainland China': 'China',
      'US': 'United States',
      'UK': 'United Kingdom',
      'South Korea': 'Korea, South',
      'Taiwan': 'Taiwan*',
      'Hong Kong': 'Hong Kong SAR',
      'Macau': 'Macau SAR'
    };
    
    return mapping[name] || name;
  }

  /**
   * 标准化美国州名称
   * @param {string} name - 原始州名称
   * @returns {string} 标准化后的名称
   */
  normalizeStateName(name) {
    if (!name) return '';
    
    // 去除首尾空格
    name = name.trim();
    
    // 转换为标题大小写（每个单词首字母大写）
    // 特别处理 "of" 这样的小词
    const titleCase = name
      .split(' ')
      .map(word => {
        const lower = word.toLowerCase();
        // "of" 保持小写，其他单词首字母大写
        if (lower === 'of') {
          return 'of';
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
    
    return titleCase;
  }
}
