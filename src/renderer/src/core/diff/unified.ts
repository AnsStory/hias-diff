import type { DiffResult, UnifiedRow } from './types'

/** 由并排行模型派生统一视图行：变更块内先输出全部删除行，再输出全部新增行 */
export function buildUnifiedRows(result: DiffResult): UnifiedRow[] {
  const rows: UnifiedRow[] = []
  const src = result.rows
  let i = 0
  while (i < src.length) {
    const row = src[i]
    if (row.left.type === 'unchanged') {
      rows.push({
        type: 'unchanged',
        lineNumberOld: row.left.lineNumber,
        lineNumberNew: row.right.lineNumber,
        text: row.right.text,
        ranges: [],
        rowIndex: row.index
      })
      i++
      continue
    }
    let j = i
    while (j < src.length && src[j].left.type !== 'unchanged') j++
    for (let k = i; k < j; k++) {
      const cell = src[k].left
      if (cell.type !== 'empty') {
        rows.push({
          type: 'removed',
          lineNumberOld: cell.lineNumber,
          lineNumberNew: null,
          text: cell.text,
          ranges: cell.ranges,
          rowIndex: src[k].index
        })
      }
    }
    for (let k = i; k < j; k++) {
      const cell = src[k].right
      if (cell.type !== 'empty') {
        rows.push({
          type: 'added',
          lineNumberOld: null,
          lineNumberNew: cell.lineNumber,
          text: cell.text,
          ranges: cell.ranges,
          rowIndex: src[k].index
        })
      }
    }
    i = j
  }
  return rows
}

/** 每个连续差异块的首行索引，用于"上一处/下一处"跳转 */
export function getDiffBlockIndices(result: DiffResult): number[] {
  return getDiffBlocks(result).map((b) => b.start)
}

/** 一个连续差异块在 DiffResult.rows 中的行区间 */
export interface DiffBlockRange {
  /** 起始行索引（含） */
  start: number
  /** 结束行索引（不含） */
  end: number
}

/** 所有连续差异块的行区间，用于变更导航与"合并"操作 */
export function getDiffBlocks(result: DiffResult): DiffBlockRange[] {
  const blocks: DiffBlockRange[] = []
  const rows = result.rows
  let i = 0
  while (i < rows.length) {
    if (rows[i].left.type === 'unchanged') {
      i++
      continue
    }
    let j = i
    while (j < rows.length && rows[j].left.type !== 'unchanged') j++
    blocks.push({ start: rows[i].index, end: rows[j - 1].index + 1 })
    i = j
  }
  return blocks
}
