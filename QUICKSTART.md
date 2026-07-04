# 快速开始指南

## 环境要求

由于当前环境缺少Node.js，你需要先安装Node.js才能运行这个项目。

### 安装Node.js

#### Windows系统

1. **方法一：官网下载安装**
   - 访问 [Node.js官网](https://nodejs.org/)
   - 下载最新的LTS版本（推荐）
   - 双击安装包，按照提示完成安装
   - 安装完成后重启终端或命令行窗口

2. **方法二：使用安装工具**
   - 使用 Chocolatey (Windows包管理器):
     ```powershell
     choco install nodejs
     ```
   - 使用 Scoop:
     ```powershell
     scoop install nodejs
     ```

3. **验证安装**
   ```powershell
   node -v
   npm -v
   ```
   应显示版本号（如 v18.x.x 和 9.x.x）

#### macOS系统

```bash
# 使用 Homebrew
brew install node

# 验证安装
node -v
npm -v
```

#### Linux系统

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node -v
npm -v
```

## 运行项目

### 1. 安装依赖

```bash
npm install
```

或使用更快的pnpm:

```bash
# 先安装pnpm
npm install -g pnpm

# 使用pnpm安装依赖
pnpm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:5173 启动

### 3. 构建生产版本

```bash
npm run build
```

生成的文件在 `dist/` 目录

### 4. 预览生产版本

```bash
npm run preview
```

## 常见问题

### 1. npm命令未找到

**错误信息**: "npm : 无法将"npm"项识别为 cmdlet、函数、脚本文件或可运行程序的名称"

**解决方案**:
- 确保已正确安装Node.js
- 重启终端或命令行窗口
- 检查环境变量是否包含Node.js路径
  - Windows: 系统属性 → 环境变量 → Path中应包含Node.js安装路径

### 2. 端口被占用

**错误信息**: "Port 5173 is already in use"

**解决方案**:
```bash
# 查找占用进程
# Windows
netstat -ano | findstr :5173

# macOS/Linux
lsof -i :5173

# 或使用其他端口
npm run dev -- --port 3000
```

### 3. 依赖安装失败

**解决方案**:
```bash
# 清理缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

### 4. TypeScript类型错误

**解决方案**:
```bash
# 运行类型检查
npm run check

# 查看具体错误信息
tsc --noEmit
```

## 项目文件说明

### 关键配置文件

- **package.json**: 项目依赖和脚本配置
- **vite.config.ts**: Vite构建工具配置
- **tailwind.config.js**: Tailwind CSS配置
- **tsconfig.json**: TypeScript编译配置

### 源代码目录

- **src/components/**: 可复用的UI组件
- **src/pages/**: 页面组件
- **src/data/**: Mock数据文件
- **src/hooks/**: Zustand状态管理
- **src/utils/**: 工具函数

## 下一步

1. ✅ 安装Node.js
2. ✅ 安装项目依赖
3. ✅ 启动开发服务器
4. ✅ 在浏览器中体验"旅心流"
5. ✅ 根据需求调整Mock数据或功能

祝使用愉快！如有问题欢迎反馈。