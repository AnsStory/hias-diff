import { markRaw, ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { computeDiff } from '../core/diff/engine'
import type { DiffResult } from '../core/diff/types'

/** 合并操作的历史记录项 */
interface MergeHistoryEntry {
  leftText: string
  rightText: string
  description: string
}

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

  /** 撤销栈：保存合并操作的历史记录 */
  const undoStack = ref<MergeHistoryEntry[]>([])
  /** 重做栈：保存被撤销的操作 */
  const redoStack = ref<MergeHistoryEntry[]>([])
  /** 最大历史记录数 */
  const MAX_HISTORY = 50

  /** 是否可以撤销 */
  const canUndo = computed(() => undoStack.value.length > 0)
  /** 是否可以重做 */
  const canRedo = computed(() => redoStack.value.length > 0)

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

  /**
   * 保存当前状态到撤销栈（在执行合并操作前调用）
   * @param description 操作描述
   */
  function pushUndoState(description: string): void {
    undoStack.value.push({
      leftText: leftText.value,
      rightText: rightText.value,
      description
    })
    // 限制历史记录数量
    if (undoStack.value.length > MAX_HISTORY) {
      undoStack.value.shift()
    }
    // 执行新操作时清空重做栈
    redoStack.value = []
  }

  /** 撤销上一次合并操作 */
  function undo(): boolean {
    if (undoStack.value.length === 0) return false
    const entry = undoStack.value.pop()!
    // 保存当前状态到重做栈
    redoStack.value.push({
      leftText: leftText.value,
      rightText: rightText.value,
      description: entry.description
    })
    // 恢复历史状态
    leftText.value = entry.leftText
    rightText.value = entry.rightText
    runDiff()
    return true
  }

  /** 重做被撤销的操作 */
  function redo(): boolean {
    if (redoStack.value.length === 0) return false
    const entry = redoStack.value.pop()!
    // 保存当前状态到撤销栈
    undoStack.value.push({
      leftText: leftText.value,
      rightText: rightText.value,
      description: entry.description
    })
    // 恢复重做状态
    leftText.value = entry.leftText
    rightText.value = entry.rightText
    runDiff()
    return true
  }

  /** 清空撤销/重做栈 */
  function clearHistory(): void {
    undoStack.value = []
    redoStack.value = []
  }

  function backToInput() {
    screen.value = 'input'
    clearHistory()
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
    clearHistory()
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
    undoStack,
    redoStack,
    canUndo,
    canRedo,
    runDiff,
    backToInput,
    reset,
    swapSides,
    clearSide,
    clearAll,
    pushUndoState,
    undo,
    redo,
    clearHistory
  }
})
