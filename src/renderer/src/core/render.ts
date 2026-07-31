import type { InlineRange } from './diff/types'

/** 结果视图中单行的渲染模型（并排/统一视图共用） */
export interface RenderLine {
  key: number
  /** 并排视图：本侧行号；统一视图：旧行号 */
  gutter1: number | null
  /** 统一视图：新行号 */
  gutter2?: number | null
  /** 统一视图的 +/- 标记 */
  sign?: '+' | '-' | ''
  text: string
  kind: 'added' | 'removed' | 'unchanged' | 'empty'
  ranges: InlineRange[]
  /** 该行在原文中的 0 起行索引，用于查语法 token；占位行为 null */
  syntaxLine: number | null
  /** 使用哪一侧的语法 token */
  side: 'left' | 'right'
  /** 对应 DiffResult.rows 索引，统一视图跳转用 */
  sourceRow: number
}
