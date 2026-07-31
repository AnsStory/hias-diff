import { app, shell, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import { join, basename } from 'path'
import { readFile } from 'fs/promises'
import { decodeBytes, looksBinary } from '../shared/encoding'

const MAX_FILE_SIZE = 20 * 1024 * 1024

function buildMenu(win: BrowserWindow): void {
  const menu = Menu.buildFromTemplate([
    {
      label: '文件',
      submenu: [
        {
          label: '新建对比',
          accelerator: 'CmdOrCtrl+N',
          click: () => win.webContents.send('menu:new-diff')
        },
        { type: 'separator' },
        { role: 'quit', label: '退出' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于 hias-diff',
          click: () => {
            dialog.showMessageBox(win, {
              type: 'info',
              title: '关于',
              message: 'hias-diff',
              detail: '本地离线的文本/代码差异对比工具。\n所有对比在本机完成，数据不会离开您的电脑。'
            })
          }
        }
      ]
    }
  ])
  Menu.setApplicationMenu(menu)
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 560,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  buildMenu(mainWindow)
}

app.whenReady().then(() => {
  ipcMain.handle('dialog:open-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: '所有文件', extensions: ['*'] }]
    })
    if (canceled || filePaths.length === 0) return null
    const filePath = filePaths[0]
    const name = basename(filePath)
    try {
      const buffer = await readFile(filePath)
      if (buffer.length > MAX_FILE_SIZE) return { name, error: 'too-large' }
      if (looksBinary(buffer)) return { name, error: 'binary' }
      // 自动识别编码并转码（UTF-8 / GBK / Big5 等）
      return { name, content: decodeBytes(buffer).text }
    } catch {
      return { name, error: 'read-failed' }
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
