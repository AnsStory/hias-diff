import { markRaw } from 'vue'
import { defineStore } from 'pinia'
import { computeDiff } from '../core/diff/engine'
import type { DiffResult } from '../core/diff/types'
import { detectLanguage } from '../core/highlight/languages'

export const MAX_FILE_SIZE = 20 * 1024 * 1024

export const useDiffStore = defineStore('diff', {
  state: () => ({
    leftText: '',
    rightText: '',
    leftFileName: '',
    rightFileName: '',
    language: 'plaintext',
    ignoreTrailingWhitespace: false,
    ignoreCase: false,
    ignoreQuotes: false,
    ignoreDashes: false,
    ignorePatterns: [] as string[],
    screen: 'input' as 'input' | 'result',
    viewMode: 'split' as 'split' | 'unified',
    // diff 结果行数可能很大，markRaw 避免深层响应式带来的开销
    result: null as DiffResult | null
  }),
  actions: {
    runDiff() {
      this.result = markRaw(
        computeDiff(this.leftText, this.rightText, {
          ignoreTrailingWhitespace: this.ignoreTrailingWhitespace,
          ignoreCase: this.ignoreCase,
          ignoreQuotes: this.ignoreQuotes,
          ignoreDashes: this.ignoreDashes,
          ignorePatterns: this.ignorePatterns
        })
      )
      this.screen = 'result'
    },
    backToInput() {
      this.screen = 'input'
    },
    reset() {
      this.$reset()
      document.title = 'hias-diff'
    },
    swapSides() {
      ;[this.leftText, this.rightText] = [this.rightText, this.leftText]
      ;[this.leftFileName, this.rightFileName] = [this.rightFileName, this.leftFileName]
      this.updateTitle()
      if (this.screen === 'result') this.runDiff()
    },
    setFile(side: 'left' | 'right', name: string, content: string) {
      if (side === 'left') {
        this.leftText = content
        this.leftFileName = name
      } else {
        this.rightText = content
        this.rightFileName = name
      }
      const detected = detectLanguage(name)
      if (detected !== 'plaintext') this.language = detected
      this.updateTitle()
    },
    clearSide(side: 'left' | 'right') {
      if (side === 'left') {
        this.leftText = ''
        this.leftFileName = ''
      } else {
        this.rightText = ''
        this.rightFileName = ''
      }
      this.updateTitle()
    },
    clearAll() {
      this.leftText = ''
      this.rightText = ''
      this.leftFileName = ''
      this.rightFileName = ''
      this.updateTitle()
    },
    updateTitle() {
      if (this.leftFileName || this.rightFileName) {
        document.title = `${this.leftFileName || '未命名'} ↔ ${this.rightFileName || '未命名'} - hias-diff`
      } else {
        document.title = 'hias-diff'
      }
    }
  }
})
