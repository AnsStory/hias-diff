import { createHighlighter, type Highlighter } from 'shiki'
import type { TokenSpan } from './segment'
import { getLangLoader } from './supported-languages'

/** 明暗两套 shiki 主题：暗色模式用 github-dark，避免亮色语法色在暗底不可读 */
export type HighlightTheme = 'github-light' | 'github-dark'
const THEMES: HighlightTheme[] = ['github-light', 'github-dark']

let highlighterPromise: Promise<Highlighter> | null = null
/** 每种语言的加载 Promise，避免并发（左右两侧）重复 loadLanguage */
const langLoads = new Map<string, Promise<boolean>>()

/** shiki 单例，预置明暗主题；语言按需懒加载，避免一次性打进全部语法 */
function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({ themes: THEMES, langs: [] })
  }
  return highlighterPromise
}

/** 确保指定语言已加载（幂等、并发安全）；非法或加载失败返回 false */
function ensureLanguage(highlighter: Highlighter, lang: string): Promise<boolean> {
  if (highlighter.getLoadedLanguages().includes(lang)) return Promise.resolve(true)
  let loading = langLoads.get(lang)
  if (!loading) {
    const loader = getLangLoader(lang)
    if (!loader) {
      loading = Promise.resolve(false)
    } else {
      loading = highlighter
        .loadLanguage(loader as any)
        .then(() => true)
        .catch(() => false)
    }
    langLoads.set(lang, loading)
  }
  return loading
}

/**
 * 对整侧文本做语法 tokenize，返回按行组织的 token。
 * 纯文本 / 未知语言 / tokenize 失败返回 null（渲染时退化为无语法色）。
 */
export async function tokenizeLines(
  text: string,
  lang: string,
  theme: HighlightTheme = 'github-light'
): Promise<TokenSpan[][] | null> {
  if (lang === 'plaintext' || text === '') return null
  try {
    const highlighter = await getHighlighter()
    const ready = await ensureLanguage(highlighter, lang)
    if (!ready) return null
    // shiki 按 \n 分行，统一换行符以对齐 diff 引擎的分行结果
    const normalized = text.replace(/\r\n?/g, '\n')
    const tokenLines = highlighter.codeToTokensBase(normalized, {
      lang: lang as never,
      theme
    })
    return tokenLines.map((line) =>
      line.map((token) => ({ content: token.content, color: token.color }))
    )
  } catch {
    return null
  }
}
