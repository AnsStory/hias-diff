# hias-diff

本地离线的文本/代码差异对比桌面工具。

## 功能特性

- 文本/代码差异对比，高亮显示变更
- 亮色/暗色主题切换
- 支持多语言语法高亮（基于 Shiki）
- 支持 Windows、macOS、Linux
- 支持 Web 浏览器访问

## 下载安装

从 [Releases](https://github.com/AnsStory/hias-diff/releases) 页面下载对应平台的压缩包：

| 平台 | 文件 |
|------|------|
| Windows | `hias-diff-0.1.0-win-x64.zip` |
| macOS | `hias-diff-0.1.0-mac-x64.zip` |
| Linux | `hias-diff-0.1.0-linux-x64.zip` |

下载后解压，运行可执行文件即可。

## 开发

### 环境要求

- Node.js >= 18
- npm

### 安装依赖

```bash
npm install
```

### 启动开发模式

```bash
# Electron 桌面应用
npm run dev

# Web 浏览器版本
npm run dev:web
```

### 构建

```bash
# 构建 Windows 版
npm run build:win

# 构建 macOS 版
npm run build:mac

# 构建 Linux 版
npm run build:linux

# 构建 Web 版
npm run build:web
```

## 技术栈

- Electron
- Vue 3 + TypeScript
- Vite
- Element Plus
- Shiki（语法高亮）
- Pinia（状态管理）

## 许可证

[MIT](LICENSE)
