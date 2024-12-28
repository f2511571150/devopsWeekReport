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
```

## 配置说明

1. 点击"设置"按钮
2. 填写以下信息：
   - Personal Access Token (可以点击右侧链接快速生成)
   - Organization 名称
   - 项目列表 (支持多个项目)
3. 保存设置后即可使用

## License

MIT
