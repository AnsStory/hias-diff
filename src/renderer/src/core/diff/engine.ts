import { diffArrays, diffWordsWithSpace } from 'diff'
import type { DiffCell, DiffOptions, DiffResult, DiffRow, InlineRange } from './types'

/** 按行拆分，兼容 \r\n / \r / \n */
export function splitLines(text: string): string[] {
  return text.split(/\r\n|\r|\n/)
}

/** 各种引号（直/弯/上下）统一归一为 "，用于“忽略引号”比较 */
const QUOTE_CHARS =
  /[\u0022\u0027\u0060\u00B4\u2018\u2019\u201A\u201B\u201C\u201D\u201E\u201F\u2032\u2033]/g
/** 各种破折号/连字符统一归一为 -，用于“忽略破折号”比较 */
const DASH_CHARS = /[\u002D\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g

function normalizeLine(line: string, options: DiffOptions): string {
  let result = line
  if (options.ignoreTrailingWhitespace) result = result.replace(/[ \t]+$/, '')
  if (options.ignoreQuotes) result = result.replace(QUOTE_CHARS, '"')
  if (options.ignoreDashes) result = result.replace(DASH_CHARS, '-')
  if (options.ignorePatterns?.length) {
    for (const pattern of options.ignorePatterns) {
      if (pattern) result = result.split(pattern).join('')
    }
  }
  if (options.ignoreCase) result = result.toLowerCase()
  return result
}

function mergeRanges(ranges: InlineRange[]): InlineRange[] {
  if (ranges.length <= 1) return ranges
  const merged: InlineRange[] = [ranges[0]]
  for (let i = 1; i < ranges.length; i++) {
    const last = merged[merged.length - 1]
    if (ranges[i].start <= last.end) {
      last.end = Math.max(last.end, ranges[i].end)
    } else {
      merged.push(ranges[i])
    }
  }
  return merged
}

/** 对一对"修改前/修改后"行做字符级（按词）diff，返回两侧高亮区间 */
function inlineDiff(
  oldLine: string,
  newLine: string,
  options: DiffOptions
): { leftRanges: InlineRange[]; rightRanges: InlineRange[] } {
  const parts = diffWordsWithSpace(oldLine, newLine, { ignoreCase: options.ignoreCase })
  const leftRanges: InlineRange[] = []
  const rightRanges: InlineRange[] = []
  let leftPos = 0
  let rightPos = 0
  for (const part of parts) {
    const len = part.value.length
    if (part.removed) {
      leftRanges.push({ start: leftPos, end: leftPos + len })
      leftPos += len
    } else if (part.added) {
      rightRanges.push({ start: rightPos, end: rightPos + len })
      rightPos += len
    } else {
      leftPos += len
      rightPos += len
    }
  }
  return { leftRanges: mergeRanges(leftRanges), rightRanges: mergeRanges(rightRanges) }
}

function emptyCell(): DiffCell {
  return { lineNumber: null, text: '', type: 'empty', ranges: [] }
}

/**
 * 两层 diff 流水线：
 * 1. 行级：diffArrays（带归一化 comparator）得到新增/删除/不变块
 * 2. 行内：相邻"删除↔新增"块逐行配对，做词级 diff 标出高亮区间
 */
export function computeDiff(
  oldText: string,
  newText: string,
  options: DiffOptions = {}
): DiffResult {
  const oldLines = splitLines(oldText)
  const newLines = splitLines(newText)
  const changes = diffArrays(oldLines, newLines, {
    comparator: (a, b) => normalizeLine(a, options) === normalizeLine(b, options)
  })

  const rows: DiffRow[] = []
  let oldIndex = 0
  let newIndex = 0
  let additions = 0
  let deletions = 0

  const pushRow = (left: DiffCell, right: DiffCell): void => {
    rows.push({ index: rows.length, left, right })
  }

  let i = 0
  while (i < changes.length) {
    const change = changes[i]
    if (!change.added && !change.removed) {
      for (let k = 0; k < change.value.length; k++) {
        pushRow(
          { lineNumber: oldIndex + 1, text: oldLines[oldIndex], type: 'unchanged', ranges: [] },
          { lineNumber: newIndex + 1, text: newLines[newIndex], type: 'unchanged', ranges: [] }
        )
        oldIndex++
        newIndex++
      }
      i++
      continue
    }

    // jsdiff 对同一位置的变更先输出 removed 再输出 added
    let removedCount = 0
    let addedCount = 0
    if (change.removed) {
      removedCount = change.value.length
      i++
      if (i < changes.length && changes[i].added) {
        addedCount = changes[i].value.length
        i++
      }
    } else {
      addedCount = change.value.length
      i++
    }

    const pairCount = Math.min(removedCount, addedCount)
    for (let k = 0; k < pairCount; k++) {
      const leftText = oldLines[oldIndex]
      const rightText = newLines[newIndex]
      const { leftRanges, rightRanges } = inlineDiff(leftText, rightText, options)
      pushRow(
        { lineNumber: oldIndex + 1, text: leftText, type: 'modified', ranges: leftRanges },
        { lineNumber: newIndex + 1, text: rightText, type: 'modified', ranges: rightRanges }
      )
      oldIndex++
      newIndex++
      deletions++
      additions++
    }
    for (let k = pairCount; k < removedCount; k++) {
      pushRow(
        { lineNumber: oldIndex + 1, text: oldLines[oldIndex], type: 'removed', ranges: [] },
        emptyCell()
      )
      oldIndex++
      deletions++
    }
    for (let k = pairCount; k < addedCount; k++) {
      pushRow(emptyCell(), {
        lineNumber: newIndex + 1,
        text: newLines[newIndex],
        type: 'added',
        ranges: []
      })
      newIndex++
      additions++
    }
  }

  return {
    rows,
    stats: { additions, deletions },
    identical: additions === 0 && deletions === 0
  }
}
