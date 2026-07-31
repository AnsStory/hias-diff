# hias-diff 开发计划

## 摘要

参考 Diffchecker 的核心交互（双栏输入 → 查找差异 → 行级+字符级高亮结果，支持并排/统一视图），构建一款 **Vue 3 + TypeScript + Electron** 桌面应用。所有 diff 计算在渲染进程本地完成，数据不出本机，无后端依赖。

## 技术选型（已定）

| 领域 | 选型 | 理由 |
|---|---|---|
| 脚手架 | **electron-vite** + Vue 3 + TypeScript | 官方推荐的 Electron+Vite 集成，主/预加载/渲染三进程统一构建 |
| diff 引擎 | **jsdiff（`diff` 包）** | 提供 `diffLines`/`diffWordsWithSpace`/`diffChars`，纯 JS 可在渲染进程运行；与 Diffchecker 同类算法（Myers） |
| 语法高亮 | **shiki** | TextMate 语法、VS Code 主题，输出带 token 的结构化结果，便于与 diff 高亮叠加 |
| 输入编辑器 | 原生 `<textarea>`（MVP） | Diffchecker 的输入区即简单文本框；结果区为自渲染只读视图，无需重型编辑器 |
| 状态管理 | Pinia | 管理输入内容、diff 结果、视图选项 |
| 打包 | electron-builder（Windows NSIS，预留 mac/linux 配置） | |
| 测试 | Vitest（diff 引擎单元测试） | |

## 里程碑

### M1：项目脚手架
- 用 `npm create @quick-start/electron`（electron-vite 模板，vue-ts）初始化项目
- 目录结构：
  - `src/main/` — Electron 主进程（窗口、文件对话框 IPC）
  - `src/preload/` — contextBridge 暴露 `openFile` 等安全 API
  - `src/renderer/` — Vue 应用
- 配置 ESLint + Prettier，`npm run dev` 可启动窗口

### M2：diff 核心引擎（纯 TS 模块，UI 无关）
- 位置：`src/renderer/src/core/diff/`
- 基于 jsdiff 实现两层 diff 流水线：
  1. **行级**：`diffLines` 得到新增/删除/不变的行块
  2. **行内**：对成对的"删除↔新增"行块做 `diffWordsWithSpace`，标出字符级差异区间
- 输出统一数据模型 `DiffResult`：
  - `rows: DiffRow[]`（每行含左右行号、类型 `added|removed|modified|unchanged`、行内高亮区间）
  - `stats: { additions, deletions }`
- 支持选项：忽略行尾空白、忽略大小写
- Vitest 单测覆盖：空输入、完全相同、纯新增/删除、修改行的行内区间、大文本（1 万行）性能基准

### M3：核心 UI（Diffchecker 式交互）
- **输入页**（`views/InputView.vue`）：
  - 左右双栏 textarea（原始文本 / 更改后文本），底部"查找差异"主按钮
  - 每栏支持"打开文件"按钮与拖拽文件读入（文本文件经 preload API 读取）
- **结果页**（`views/ResultView.vue`）：
  - **并排视图**：左右两列对齐行渲染，删除行红底、新增行绿底、行内差异深色高亮
  - **统一视图**：单列 `-`/`+` 行模式，顶部切换
  - 差异统计条（+N 增 / −N 删）、上一处/下一处差异跳转按钮
  - "重新编辑"返回输入页、左右互换、复制某侧内容
- 大文件渲染用虚拟滚动（`vue-virtual-scroller` 或自实现按需渲染），保证 1 万行流畅

### M4：语法高亮叠加
- shiki 单例加载（预置常用语言：js/ts/json/xml/html/css/py/java/go/sql/md/yaml 等 + 一个亮色/暗色主题）
- 渲染管线：先对整侧文本做 shiki tokenize → 将 token 颜色与 diff 行/行内背景**叠加**渲染（语法色为前景色，diff 为背景色）
- 语言选择下拉 + 按文件扩展名自动识别；纯文本模式为默认（不做高亮，性能最优）

### M5：文件对比与桌面集成
- 主进程 `dialog.showOpenDialog` 打开文件；拖拽到窗口任一栏直接载入
- 编码处理：按 UTF-8 读取，检测二进制文件并提示不支持
- 应用菜单（新建对比、打开文件、关于）、窗口标题显示对比文件名
- electron-builder 打包 Windows 安装包，产出 `release/` 目录

## 明确不做（MVP 之外，后续迭代）
- 保存/分享 diff 链接（需后端）
- PDF/Word/图片/Excel/文件夹对比
- 导出 PDF/patch
- 实时 diff（随输入即时对比）——M3 后视性能情况作为增强项

## 测试计划
- `npm run test`：diff 引擎单测（Vitest）
- 手动验收：双栏粘贴对比、文件拖拽对比、并排/统一切换、差异跳转、1 万行大文本流畅度、语法高亮与 diff 背景叠加正确

## 假设
- 仅需中文界面（文案硬编码中文，暂不做 i18n）
- MVP 只打包 Windows，mac/linux 配置预留不验证