# 发布指南

本文档说明如何发布新版本。

## 版本号规范

采用 [语义化版本](https://semver.org/lang/zh-CN/)：`主版本号.次版本号.修订号`

- 主版本号：不兼容的 API 修改
- 次版本号：向下兼容的功能性新增
- 修订号：向下兼容的问题修正

## 发布流程

### 1. 更新版本号

修改 `package.json` 中的 `version` 字段：

```json
{
  "version": "0.2.0"
}
```

### 2. 提交代码

```bash
# 暂存所有修改
git add .

# 提交（示例）
git commit -m "feat: 新增 xxx 功能"
```

### 3. 打 tag 并推送

```bash
# 创建 tag（替换 x.x.x 为实际版本号）
git tag vx.x.x

# 推送 tag 到远程
git push origin vx.x.x
```

推送后，GitHub Actions 会自动构建三个平台的安装包并发布到 Releases。

### 4. 补充 Release Notes

在 GitHub Releases 页面补充更新说明。

## 删除并重新创建 Tag

如果 tag 推送后发现需要修改：

```bash
# 删除本地 tag
git tag -d vx.x.x

# 删除远程 tag
git push origin :refs/tags/vx.x.x

# 重新创建并推送
git tag vx.x.x
git push origin vx.x.x
```

## 常用命令速查

| 命令 | 说明 |
|------|------|
| `git tag` | 查看所有 tag |
| `git tag -d vx.x.x` | 删除本地 tag |
| `git push origin vx.x.x` | 推送 tag 到远程 |
| `git push origin :refs/tags/vx.x.x` | 删除远程 tag |
| `git fetch --tags` | 拉取远程所有 tag |

## 自动化构建

推送 tag 后，GitHub Actions 会自动：

1. 在 Windows、macOS、Linux 三个系统上分别构建
2. 生成多种格式的安装包（见下表）
3. 创建 Release 并上传构建产物

工作流配置文件：`.github/workflows/build.yml`

## 制品说明

### Windows

| 文件 | 说明 |
|------|------|
| `hias-diff-x.x.x-win-x64-setup.exe` | NSIS 安装包，推荐 |
| `hias-diff-x.x.x-win-x64-portable.exe` | 便携版，解压即用，不写入注册表 |

### macOS

| 文件 | 说明 |
|------|------|
| `hias-diff-x.x.x-mac-x64.dmg` | DMG 安装包，拖入 Applications 即可 |
| `hias-diff-x.x.x-mac-x64.zip` | 解压后拖入 Applications |

### Linux

| 文件 | 说明 |
|------|------|
| `hias-diff-x.x.x-linux-x64.AppImage` | 通用格式，chmod +x 后直接运行 |
| `hias-diff-x.x.x-linux-x64.deb` | Debian / Ubuntu 安装包 |
| `hias-diff-x.x.x-linux-x64.rpm` | Fedora / RHEL 安装包 |
| `hias-diff-x.x.x-linux-x64.tar.gz` | 通用归档格式 |

> ARM64 设备请选择文件名中带 `arm64` 的对应制品。
