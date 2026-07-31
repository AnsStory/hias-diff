import { describe, expect, it } from 'vitest'
import { computeDiff } from '../engine'
import { buildUnifiedRows, getDiffBlockIndices } from '../unified'

describe('computeDiff', () => {
  it('完全相同的文本', () => {
    const r = computeDiff('a\nb\nc', 'a\nb\nc')
    expect(r.identical).toBe(true)
    expect(r.rows).toHaveLength(3)
    expect(r.stats).toEqual({ additions: 0, deletions: 0 })
    expect(r.rows.every((row) => row.left.type === 'unchanged')).toBe(true)
  })

  it('空输入', () => {
    const r = computeDiff('', '')
    expect(r.identical).toBe(true)
    expect(r.rows).toHaveLength(1)
  })

  it('纯新增', () => {
    const r = computeDiff('a', 'a\nb\nc')
    expect(r.stats).toEqual({ additions: 2, deletions: 0 })
    expect(r.rows[1].left.type).toBe('empty')
    expect(r.rows[1].right.type).toBe('added')
    expect(r.rows[1].right.lineNumber).toBe(2)
    expect(r.rows[2].right.lineNumber).toBe(3)
  })

  it('纯删除', () => {
    const r = computeDiff('a\nb\nc', 'a')
    expect(r.stats).toEqual({ additions: 0, deletions: 2 })
    expect(r.rows[1].left.type).toBe('removed')
    expect(r.rows[1].right.type).toBe('empty')
    expect(r.rows[1].left.lineNumber).toBe(2)
  })

  it('修改行配对并给出行内高亮区间', () => {
    const r = computeDiff('hello world', 'hello there')
    expect(r.rows).toHaveLength(1)
    expect(r.rows[0].left.type).toBe('modified')
    expect(r.rows[0].right.type).toBe('modified')
    const leftRange = r.rows[0].left.ranges[0]
    const rightRange = r.rows[0].right.ranges[0]
    expect('hello world'.slice(leftRange.start, leftRange.end)).toBe('world')
    expect('hello there'.slice(rightRange.start, rightRange.end)).toBe('there')
  })

  it('删除多于新增时剩余行为纯删除', () => {
    const r = computeDiff('x1\nx2\nx3', 'y1')
    expect(r.rows[0].left.type).toBe('modified')
    expect(r.rows[1].left.type).toBe('removed')
    expect(r.rows[2].left.type).toBe('removed')
    expect(r.stats).toEqual({ additions: 1, deletions: 3 })
  })

  it('忽略行尾空白', () => {
    const r = computeDiff('a  \t', 'a', { ignoreTrailingWhitespace: true })
    expect(r.identical).toBe(true)
    // 展示时保留原始文本
    expect(r.rows[0].left.text).toBe('a  \t')
    expect(r.rows[0].right.text).toBe('a')
  })

  it('忽略大小写', () => {
    const r = computeDiff('Hello World', 'hello world', { ignoreCase: true })
    expect(r.identical).toBe(true)
  })

  it('忽略引号差异', () => {
    const r = computeDiff('say “hi” and ‘bye’', 'say "hi" and \'bye\'', {
      ignoreQuotes: true
    })
    expect(r.identical).toBe(true)
    // 展示时保留原始弯引号
    expect(r.rows[0].left.text).toBe('say “hi” and ‘bye’')
  })

  it('忽略破折号差异', () => {
    const r = computeDiff('2020—2021', '2020-2021', { ignoreDashes: true })
    expect(r.identical).toBe(true)
  })

  it('自定义忽略规则剔除指定文本', () => {
    const r = computeDiff('TODO: fix this', 'fix this', { ignorePatterns: ['TODO: '] })
    expect(r.identical).toBe(true)
  })

  it('CRLF 与 LF 换行等价', () => {
    const r = computeDiff('a\r\nb\r\nc', 'a\nb\nc')
    expect(r.identical).toBe(true)
    expect(r.rows).toHaveLength(3)
  })

  it('行号在混合变更中保持连续', () => {
    const r = computeDiff('a\nb\nc\nd', 'a\nx\nc\nd\ne')
    const leftNumbers = r.rows.map((row) => row.left.lineNumber)
    const rightNumbers = r.rows.map((row) => row.right.lineNumber)
    expect(leftNumbers).toEqual([1, 2, 3, 4, null])
    expect(rightNumbers).toEqual([1, 2, 3, 4, 5])
  })

  it('1 万行大文本性能', () => {
    const oldText = Array.from({ length: 10000 }, (_, i) => `const value${i} = ${i}`).join('\n')
    const newText = Array.from({ length: 10000 }, (_, i) =>
      i % 100 === 0 ? `const value${i} = ${i + 1}` : `const value${i} = ${i}`
    ).join('\n')
    const start = performance.now()
    const r = computeDiff(oldText, newText)
    const elapsed = performance.now() - start
    expect(r.rows).toHaveLength(10000)
    expect(r.stats.additions).toBe(100)
    expect(r.stats.deletions).toBe(100)
    expect(elapsed).toBeLessThan(2000)
  })
})

describe('buildUnifiedRows', () => {
  it('变更块内先删除后新增', () => {
    const r = computeDiff('a\nold1\nold2\nb', 'a\nnew1\nb')
    const unified = buildUnifiedRows(r)
    expect(unified.map((row) => row.type)).toEqual([
      'unchanged',
      'removed',
      'removed',
      'added',
      'unchanged'
    ])
    expect(unified[1].lineNumberOld).toBe(2)
    expect(unified[1].lineNumberNew).toBeNull()
    expect(unified[3].lineNumberNew).toBe(2)
    expect(unified[3].lineNumberOld).toBeNull()
  })

  it('占位空行不会出现在统一视图', () => {
    const r = computeDiff('a', 'a\nb')
    const unified = buildUnifiedRows(r)
    expect(unified).toHaveLength(2)
    expect(unified[1].type).toBe('added')
  })
})

describe('getDiffBlockIndices', () => {
  it('连续变更行合并为一个块', () => {
    const r = computeDiff('a\nb\nc\nd\ne', 'a\nB\nC\nd\nE')
    expect(getDiffBlockIndices(r)).toEqual([1, 4])
  })

  it('无差异时为空', () => {
    const r = computeDiff('a', 'a')
    expect(getDiffBlockIndices(r)).toEqual([])
  })
})
