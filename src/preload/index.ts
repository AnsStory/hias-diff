import { contextBridge, ipcRenderer } from 'electron'

export interface OpenFileResult {
  name: string
  content?: string
  error?: 'binary' | 'too-large' | 'read-failed'
}

const api = {
  openFile: (): Promise<OpenFileResult | null> => ipcRenderer.invoke('dialog:open-file'),
  onNewDiff: (callback: () => void): void => {
    ipcRenderer.on('menu:new-diff', () => callback())
  }
}

contextBridge.exposeInMainWorld('api', api)
