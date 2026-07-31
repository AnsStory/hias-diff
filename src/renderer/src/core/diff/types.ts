export type CellType = 'added' | 'removed' | 'modified' | 'unchanged' | 'empty'

export interface InlineRange {
  /** 起始字符偏移（含） */
  start: number
  /** 结束字符偏移（不含） */
  end: number
}

export interface DiffCell {
  /** 该侧行号（1 起），占位行为 null */
  lineNumber: number | null
  text: string
  type: CellType
  /** 行内字符级差异区间 */
  ranges: InlineRange[]
}

export interface DiffRow {
  index: number
  left: DiffCell
  right: DiffCell
}

export interface DiffStats {
  additions: number
  deletions: number
}

export interface DiffOptions {
  ignoreTrailingWhitespace?: boolean
  ignoreCase?: boolean
  /** 忽略引号差异：各种直/弯引号在比较时视为等价 */
  ignoreQuotes?: boolean
  /** 忽略破折号差异：连字符/短横/长破折号等在比较时视为等价 */
  ignoreDashes?: boolean
  /** 自定义忽略：这些单词/短语/字符在比较时被剔除 */
  ignorePatterns?: string[]
}

export interface DiffResult {
  rows: DiffRow[]
  stats: DiffStats
  identical: boolean
}

export interface UnifiedRow {
  type: 'added' | 'removed' | 'unchanged'
  lineNumberOld: number | null
  lineNumberNew: number | null
  text: string
  ranges: InlineRange[]
  /** 对应 DiffResult.rows 中的行索引，用于差异跳转 */
  rowIndex: number
}
