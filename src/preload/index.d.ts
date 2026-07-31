export interface OpenFileResult {
  name: string
  content?: string
  error?: 'binary' | 'too-large' | 'read-failed'
}

declare global {
  interface Window {
    api?: {
      openFile: () => Promise<OpenFileResult | null>
      onNewDiff: (callback: () => void) => void
    }
  }
}

export {}
