import type { InlineRange } from '../diff/types'

export interface TokenSpan {
  content: string
  color?: string
}

export interface Segment {
  text: string
  /** 语法前景色，无高亮时为 null */
  color: string | null
  /** 是否处于行内 diff 高亮区间（渲染为加深背景） */
  emphasized: boolean
}

/**
 * 将一行文本按"语法 token 边界 + diff 区间边界"切分为渲染片段，
 * 语法色作为前景色、diff 高亮作为背景色叠加。
 */
export function segmentLine(
  text: string,
  tokens: TokenSpan[] | null,
  ranges: InlineRange[]
): Segment[] {
  if (text.length === 0) return []

  const points = new Set<number>([0, text.length])
  if (tokens) {
    let pos = 0
    for (const token of tokens) {
      pos += token.content.length
      if (pos > 0 && pos < text.length) points.add(pos)
    }
  }
  for (const range of ranges) {
    if (range.start > 0 && range.start < text.length) points.add(range.start)
    if (range.end > 0 && range.end < text.length) points.add(range.end)
  }

  const sorted = [...points].sort((a, b) => a - b)
  const segments: Segment[] = []
  let tokenIndex = 0
  let tokenStart = 0
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i]
    const end = sorted[i + 1]
    if (end <= start) continue
    let color: string | null = null
    if (tokens) {
      while (
        tokenIndex < tokens.length &&
        tokenStart + tokens[tokenIndex].content.length <= start
      ) {
        tokenStart += tokens[tokenIndex].content.length
        tokenIndex++
      }
      color = tokens[tokenIndex]?.color ?? null
    }
    const emphasized = ranges.some((range) => range.start <= start && end <= range.end)
    segments.push({ text: text.slice(start, end), color, emphasized })
  }
  return segments
}
