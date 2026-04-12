# 需求文档

## 简介

本项目旨在构建一个交互式COVID-19数据可视化工具，用于探索和分析美国各州及全球COVID-19疫情数据。该工具将部署到GitHub Pages，提供三个核心可视化图表：美国地图、国家排名柱状图和中国省份时间序列折线图。用户可以通过鼠标悬停、下拉菜单和多选框等交互方式探索数据。

## 术语表

- **Visualization_System**: 整个COVID-19交互式可视化网页应用
- **US_Map_Chart**: 美国地图可视化组件（图表1）
- **Country_Ranking_Chart**: 国家排名柱状图组件（图表2）
- **China_Timeline_Chart**: 中国省份时间序列折线图组件（图表3）
- **Data_Loader**: 数据加载和解析模块
- **Tooltip_Component**: 鼠标悬停时显示详细信息的提示框组件
- **Metric_Selector**: 指标选择器（用于切换确诊/死亡/治愈数据）
- **Province_Filter**: 省份筛选器（用于选择特定省份）
- **GeoJSON_Data**: 美国地图几何数据（National_Obesity_By_State.geojson）
- **US_COVID_Data**: 美国各州COVID-19数据（COVID-19 Data.xlsx）
- **Global_COVID_Data**: 全球COVID-19时间序列数据（covid_19_data_2.csv）
- **Confirmed_Cases**: 确诊病例数
- **Deaths**: 死亡病例数
- **Recovered**: 治愈病例数

## 需求

### 需求 1: 数据加载与解析

**用户故事:** 作为开发者，我希望系统能够加载和解析所有必需的数据文件，以便可视化组件能够正确显示数据。

#### 验收标准

1. WHEN 应用初始化时，THE Data_Loader SHALL 加载 GeoJSON_Data 文件并解析为地图几何数据
2. WHEN 应用初始化时，THE Data_Loader SHALL 加载 US_COVID_Data 文件并解析为美国各州的 Confirmed_Cases、Deaths 和 Recovered 数据
3. WHEN 应用初始化时，THE Data_Loader SHALL 加载 Global_COVID_Data 文件并解析为全球时间序列数据
4. IF 任何数据文件加载失败，THEN THE Data_Loader SHALL 显示错误消息并记录错误详情
5. WHEN 数据解析完成时，THE Data_Loader SHALL 验证数据完整性（包含必需字段）

### 需求 2: 美国地图可视化

**用户故事:** 作为用户，我希望看到美国地图并能够查看各州的COVID-19数据，以便了解疫情在美国的地理分布。

#### 验收标准

1. WHEN 页面加载完成时，THE US_Map_Chart SHALL 使用 GeoJSON_Data 渲染美国地图
2. WHEN 地图渲染时，THE US_Map_Chart SHALL 根据 US_COVID_Data 为每个州填充颜色（基于 Confirmed_Cases 数值）
3. WHEN 用户鼠标悬停在某个州上时，THE US_Map_Chart SHALL 触发 Tooltip_Component 显示该州的详细数据
4. WHEN Tooltip_Component 显示时，THE Tooltip_Component SHALL 包含州名称、Confirmed_Cases、Deaths 和 Recovered 数值
5. WHEN 用户鼠标移出州边界时，THE Tooltip_Component SHALL 隐藏

### 需求 3: 国家排名柱状图

**用户故事:** 作为用户，我希望看到COVID-19数据排名前6的国家，并能够切换不同的指标，以便比较各国疫情严重程度。

#### 验收标准

1. WHEN 页面加载完成时，THE Country_Ranking_Chart SHALL 显示 Confirmed_Cases 排名前6的国家的柱状图
2. WHEN 柱状图渲染时，THE Country_Ranking_Chart SHALL 使用 Global_COVID_Data 的最新日期数据
3. WHEN 用户通过 Metric_Selector 选择不同指标时，THE Country_Ranking_Chart SHALL 更新柱状图显示对应指标（Confirmed_Cases、Deaths 或 Recovered）的排名前6国家
4. WHEN 柱状图更新时，THE Country_Ranking_Chart SHALL 在500毫秒内完成过渡动画
5. THE Metric_Selector SHALL 提供三个选项：Confirmed、Deaths、Recovered
6. WHEN 柱状图显示时，THE Country_Ranking_Chart SHALL 为每个柱子标注数值

### 需求 4: 中国省份时间序列折线图

**用户故事:** 作为用户，我希望看到中国各省份的确诊人数随时间变化的趋势，并能够筛选特定省份，以便分析疫情发展轨迹。

#### 验收标准

1. WHEN 页面加载完成时，THE China_Timeline_Chart SHALL 显示所有中国大陆省份的 Confirmed_Cases 时间序列折线图
2. WHEN 折线图渲染时，THE China_Timeline_Chart SHALL 使用 Global_COVID_Data 中 Country/Region 为 "Mainland China" 的数据
3. WHEN 用户通过 Province_Filter 选择特定省份时，THE China_Timeline_Chart SHALL 仅显示选中省份的折线
4. WHEN 折线图更新时，THE China_Timeline_Chart SHALL 在500毫秒内完成过渡动画
5. THE Province_Filter SHALL 提供多选功能，允许用户同时选择多个省份
6. WHEN 折线图显示时，THE China_Timeline_Chart SHALL 为每条折线使用不同颜色并提供图例
7. WHEN 用户鼠标悬停在折线上时，THE China_Timeline_Chart SHALL 显示该时间点的具体数值

### 需求 5: 响应式布局与用户界面

**用户故事:** 作为用户，我希望界面清晰易用且在不同设备上都能正常显示，以便在各种环境下使用该工具。

#### 验收标准

1. THE Visualization_System SHALL 提供清晰的标题和说明文字，描述每个图表的用途
2. THE Visualization_System SHALL 将三个图表合理布局在页面上（建议垂直排列或网格布局）
3. WHEN 浏览器窗口宽度小于768像素时，THE Visualization_System SHALL 调整布局为单列显示
4. THE Visualization_System SHALL 为所有交互控件（Metric_Selector、Province_Filter）提供清晰的标签
5. THE Visualization_System SHALL 使用一致的配色方案和字体样式
6. WHEN 页面加载时，THE Visualization_System SHALL 显示加载指示器直到所有数据加载完成

### 需求 6: 静态部署与浏览器兼容性

**用户故事:** 作为开发者，我希望应用能够作为纯静态网页部署到GitHub Pages，并在主流浏览器中正常运行，以便用户可以轻松访问。

#### 验收标准

1. THE Visualization_System SHALL 作为纯静态网页运行，不依赖服务器端处理
2. THE Visualization_System SHALL 将所有数据文件（GeoJSON_Data、US_COVID_Data、Global_COVID_Data）作为静态资源加载
3. THE Visualization_System SHALL 在 Chrome、Firefox、Safari 和 Edge 最新版本中正常运行
4. THE Visualization_System SHALL 提供 index.html 作为入口文件
5. WHEN 部署到 GitHub Pages 时，THE Visualization_System SHALL 正确加载所有资源（使用相对路径）

### 需求 7: 数据准确性与性能

**用户故事:** 作为用户，我希望看到准确的数据并且应用响应迅速，以便高效地探索数据。

#### 验收标准

1. WHEN 显示数值时，THE Visualization_System SHALL 保留原始数据的精度（不进行不必要的四舍五入）
2. WHEN 聚合数据时（如计算国家总数），THE Visualization_System SHALL 正确处理同一国家多个省份/州的数据
3. WHEN 用户进行交互操作时，THE Visualization_System SHALL 在200毫秒内响应（不包括动画时间）
4. THE Visualization_System SHALL 在初始加载后缓存解析的数据，避免重复解析
5. WHEN 渲染大量数据点时（如中国省份折线图），THE Visualization_System SHALL 优化渲染性能，保持60fps的流畅度

### 需求 8: 错误处理与用户反馈

**用户故事:** 作为用户，我希望在出现问题时能够得到清晰的提示，以便了解发生了什么并采取相应措施。

#### 验收标准

1. IF 数据文件不存在或无法访问，THEN THE Visualization_System SHALL 显示友好的错误消息
2. IF 数据格式不正确，THEN THE Visualization_System SHALL 显示具体的错误信息（如"缺少必需字段"）
3. IF 浏览器不支持必需的功能（如SVG），THEN THE Visualization_System SHALL 显示浏览器兼容性警告
4. WHEN 数据加载中时，THE Visualization_System SHALL 显示加载进度或动画
5. IF 用户选择的筛选条件导致无数据显示，THEN THE Visualization_System SHALL 显示"无数据"提示
