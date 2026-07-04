# 旅心流 (TravelFlow) - AI旅游规划助手

## 项目简介

旅心流是一个基于用户情绪、实时天气和预算动态调整行程的AI旅游规划助手。该项目为TRAE AI创造力大赛的演示原型，展示了产品的核心交互流程和创新概念。

## 核心特性

- **情绪智能选择**: 6种情绪状态（愉悦、放松、冒险、浪漫、沉思、活力），每种情绪配有独特的视觉氛围和配色方案
- **动态背景**: 根据所选情绪自动切换背景渐变色和流动粒子动画
- **实时天气整合**: 展示目的地天气信息，支持多城市切换
- **智能预算管理**: 可视化预算设置工具，自动匹配活动推荐
- **个性化行程生成**: AI根据情绪、天气、预算生成定制化行程时间轴
- **实时动态调整**: 支持情绪和预算的实时调整，行程自动更新

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite 4
- **样式**: Tailwind CSS 3
- **状态管理**: Zustand
- **动画**: Framer Motion
- **图标**: Lucide React
- **路由**: React Router DOM v6

## 安装与运行

### 前置要求

- Node.js 16+ (推荐使用 Node.js 18+)
- npm 或 pnpm 包管理器

### 安装步骤

1. **安装Node.js**
   - 访问 [Node.js官网](https://nodejs.org/) 下载并安装最新版本
   - 安装完成后，在终端运行 `node -v` 和 `npm -v` 验证安装

2. **安装依赖**
   ```bash
   npm install
   # 或使用 pnpm
   pnpm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   # 或
   pnpm dev
   ```

4. **访问应用**
   - 打开浏览器访问 http://localhost:5173

### 其他命令

- **构建生产版本**: `npm run build`
- **预览生产版本**: `npm run preview`
- **TypeScript类型检查**: `npm run check`

## 项目结构

```
travel-flow/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── EmotionWheel.tsx    # 情绪轮盘
│   │   ├── WeatherCard.tsx     # 天气卡片
│   │   ├── BudgetSlider.tsx    # 预算滑块
│   │   ├── Timeline.tsx        # 行程时间轴
│   │   ├── ActivityCard.tsx    # 活动卡片
│   │   └── FloatingPanel.tsx   # 浮动控制面板
│   ├── pages/               # 页面组件
│   │   ├── EmotionSelect.tsx   # 情绪选择页
│   │   └── ItineraryPlan.tsx   # 行程规划页
│   ├── data/                # Mock数据
│   │   ├── emotions.ts         # 情绪配置
│   │   ├── weather.ts          # 天气数据
│   │   └── activities.ts       # 活动库
│   ├── hooks/               # 自定义Hooks
│   │   └── useAppStore.ts      # Zustand状态管理
│   ├── utils/               # 工具函数
│   │   ├── itineraryGenerator.ts # 行程生成算法
│   │   └── colorUtils.ts        # 颜色计算工具
│   ├── App.tsx              # 主应用组件
│   ├── main.tsx             # 应用入口
│   └── index.css            # 全局样式
├── public/
│   └── index.html           # HTML模板
├── package.json             # 项目配置
├── vite.config.ts           # Vite配置
├── tailwind.config.js       # Tailwind配置
└── tsconfig.json            # TypeScript配置
```

## 功能说明

### 1. 情绪选择页面 (/)

- **情绪轮盘**: 圆形可视化选择器，6个情绪分区
- **视觉反馈**: 选择情绪后背景动态变化
- **天气预览**: 展示目的地实时天气，支持城市切换
- **情绪描述**: 显示所选情绪的详细描述和相关标签

### 2. 行程规划页面 (/plan)

- **预算设置**: 滑块式预算调整工具（100-1000元）
- **AI生成器**: 点击按钮生成个性化行程
- **行程时间轴**: 垂直时间轴展示活动安排
- **动态调整**: 浮动面板支持实时调整情绪和预算

## 设计特色

### 视觉风格

- **流动性设计**: 柔和渐变、流动粒子动画体现"流"的概念
- **玻璃态效果**: 半透明背景 + backdrop-filter 实现毛玻璃效果
- **动态配色**: 每种情绪配有独特的渐变色系
- **微交互**: 所有交互都有流畅的动画反馈

### 色彩系统

- **愉悦**: 暖橙色 → 金黄色 (#FF6B6B → #FFE66D)
- **放松**: 薄荷绿 → 天蓝色 (#98D8C8 → #7EC8E3)
- **冒险**: 深紫色 → 酒红色 (#7B68EE → #DC143C)
- **浪漫**: 玫瑰粉 → 淡紫色 (#FFB6C1 → #DDA0DD)
- **沉思**: 靛蓝色 → 灰蓝色 (#4169E1 → #708090)
- **活力**: 亮黄色 → 橙红色 (#FFD700 → #FF8C00)

## Mock数据

项目使用本地Mock数据模拟真实场景：

- **情绪数据**: 6种情绪配置，包含完整颜色方案
- **天气数据**: 5个城市（北京、上海、杭州、成都、厦门）
- **活动库**: 18个活动，涵盖不同情绪、天气、预算组合

## 部署说明

### 静态部署

项目支持纯前端静态部署：

```bash
npm run build
```

生成的 `dist/` 目录可部署到：
- Vercel
- Netlify
- GitHub Pages
- 任何静态文件服务器

### Vercel部署

1. 连接GitHub仓库到Vercel
2. 自动识别Vite项目配置
3. 一键部署

## 未来扩展

- 接入真实天气API（如和风天气API）
- 集成AI大模型生成更智能的行程推荐
- 添加用户账号和行程保存功能
- 实现真实的地图和导航集成
- 支持多日行程规划
- 添加社交分享功能

## 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

## 许可证

MIT License

## 联系方式

如有问题或建议，欢迎通过以下方式联系：
- 提交GitHub Issue
- 发送邮件至项目维护者

---

**旅心流 - 让每次旅程都成为心流体验**

Built with ❤️ for TRAE AI Creativity Competition