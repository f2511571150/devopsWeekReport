# Azure DevOps Weekly Report Generator

一个基于 Electron 的桌面应用，用于自动生成 Azure DevOps 的周报。

## 功能特点

- 自动获取本周的任务数据
  - 新建的任务
  - 完成的任务
  - 修复的 Bug
  - 活跃的任务
- 支持多项目管理
- 自动生成周报内容
- 一键复制到剪贴板
- 支持页面截图

## 技术栈

- Electron
- Vue 3
- Element Plus
- Azure DevOps API

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建应用
npm run build

# 构建 Windows 安装包
npm run build:win

# 构建 macOS 安装包
npm run build:mac
```

## 构建说明

构建过程会在 `dist` 目录下生成对应的安装包：

### Windows 安装包
运行 `npm run build:win` 后会生成：
- `dist/oneweekreport-1.0.0-setup.exe`：Windows 安装程序
- 安装完成后可以在开始菜单找到应用程序

### macOS 安装包
运行 `npm run build:mac` 后会生成：
- `dist/oneweekreport-1.0.0.dmg`：macOS 安装镜像
- 双击 .dmg 文件，将应用拖入 Applications 文件夹即可完成安装

注意事项：
1. 首次运行需要安装项目依赖：`npm install`
2. macOS 版本首次打开可能需要在"系统偏好设置"中允许运行
3. 确保您的 Node.js 环境已正确配置

## 配置说明

1. 点击"设置"按钮
2. 填写以下信息：
   - Personal Access Token (可以点击右侧链接快速生成)
   - Organization 名称
   - 项目列表 (支持多个项目)
3. 保存设置后即可使用

## License

MIT
