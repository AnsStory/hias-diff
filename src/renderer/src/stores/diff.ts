import { markRaw, ref } from 'vue'
import { defineStore } from 'pinia'
import { computeDiff } from '../core/diff/engine'
import type { DiffResult } from '../core/diff/types'

export const useDiffStore = defineStore('diff', () => {
  const leftText = ref('')
  const rightText = ref('')
  const language = ref('plaintext')
  const ignoreTrailingWhitespace = ref(false)
  const ignoreCase = ref(false)
  const ignoreQuotes = ref(false)
  const ignoreDashes = ref(false)
  const ignorePatterns = ref<string[]>([])
  const screen = ref<'input' | 'result'>('input')
  const viewMode = ref<'split' | 'unified'>('split')
  const result = ref<DiffResult | null>(null)

  function runDiff() {
    result.value = markRaw(
      computeDiff(leftText.value, rightText.value, {
        ignoreTrailingWhitespace: ignoreTrailingWhitespace.value,
        ignoreCase: ignoreCase.value,
        ignoreQuotes: ignoreQuotes.value,
        ignoreDashes: ignoreDashes.value,
        ignorePatterns: ignorePatterns.value
      })
    )
    screen.value = 'result'
  }

  function backToInput() {
    screen.value = 'input'
  }

  function reset() {
    leftText.value = ''
    rightText.value = ''
    language.value = 'plaintext'
    ignoreTrailingWhitespace.value = false
    ignoreCase.value = false
    ignoreQuotes.value = false
    ignoreDashes.value = false
    ignorePatterns.value = []
    screen.value = 'input'
    viewMode.value = 'split'
    result.value = null
  }

  function swapSides() {
    // 交换左右文本
    ;[leftText.value, rightText.value] = [rightText.value, leftText.value]
    if (screen.value === 'result') runDiff()
  }

  function clearSide(side: 'left' | 'right') {
    if (side === 'left') {
      leftText.value = ''
    } else {
      rightText.value = ''
    }
  }

  function clearAll() {
    leftText.value = ''
    rightText.value = ''
  }

  return {
    leftText,
    rightText,
    language,
    ignoreTrailingWhitespace,
    ignoreCase,
    ignoreQuotes,
    ignoreDashes,
    ignorePatterns,
    screen,
    viewMode,
    result,
    runDiff,
    backToInput,
    reset,
    swapSides,
    clearSide,
    clearAll
  }
})
