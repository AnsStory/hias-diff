import { markRaw } from 'vue'
import { defineStore } from 'pinia'
import { computeDiff } from '../core/diff/engine'
import type { DiffResult } from '../core/diff/types'

export const useDiffStore = defineStore('diff', {
  state: () => ({
    leftText: '',
    rightText: '',
    language: 'plaintext',
    ignoreTrailingWhitespace: false,
    ignoreCase: false,
    ignoreQuotes: false,
    ignoreDashes: false,
    ignorePatterns: [] as string[],
    screen: 'input' as 'input' | 'result',
    viewMode: 'split' as 'split' | 'unified',
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
    },
    swapSides() {
      ;[this.leftText, this.rightText] = [this.rightText, this.leftText]
      if (this.screen === 'result') this.runDiff()
    },
    clearSide(side: 'left' | 'right') {
      if (side === 'left') this.leftText = ''
      else this.rightText = ''
    },
    clearAll() {
      this.leftText = ''
      this.rightText = ''
    }
  }
})
