import { SUPPORTED_LANG_IDS } from './supported-languages'

export interface LanguageOption {
  id: string
  label: string
}

/**
 * 语言下拉选项：纯文本置顶，其余为受支持语言子集（按名称排序）。
 * 只打包常用语言的语法，避免 shiki 全量引入导致产物膨胀。
 */
const LANG_LABELS: Record<string, string> = {
  plaintext: '纯文本',
  javascript: 'JavaScript',
  jsx: 'JSX',
  typescript: 'TypeScript',
  tsx: 'TSX',
  vue: 'Vue',
  svelte: 'Svelte',
  astro: 'Astro',
  html: 'HTML',
  xml: 'XML',
  css: 'CSS',
  scss: 'SCSS',
  less: 'Less',
  postcss: 'PostCSS',
  svg: 'SVG',
  json: 'JSON',
  jsonc: 'JSONC',
  json5: 'JSON5',
  jsonl: 'JSON Lines',
  yaml: 'YAML',
  toml: 'TOML',
  ini: 'INI',
  dotenv: 'dotenv',
  csv: 'CSV',
  markdown: 'Markdown',
  mdx: 'MDX',
  rst: 'reStructuredText',
  asciidoc: 'AsciiDoc',
  tex: 'TeX',
  latex: 'LaTeX',
  python: 'Python',
  ruby: 'Ruby',
  perl: 'Perl',
  lua: 'Lua',
  r: 'R',
  php: 'PHP',
  shellscript: 'Shell',
  powershell: 'PowerShell',
  bat: 'Batch',
  fish: 'Fish',
  make: 'Makefile',
  cmake: 'CMake',
  docker: 'Dockerfile',
  nginx: 'Nginx',
  c: 'C',
  cpp: 'C++',
  csharp: 'C#',
  java: 'Java',
  kotlin: 'Kotlin',
  scala: 'Scala',
  groovy: 'Groovy',
  go: 'Go',
  rust: 'Rust',
  swift: 'Swift',
  dart: 'Dart',
  zig: 'Zig',
  nim: 'Nim',
  'objective-c': 'Objective-C',
  'objective-cpp': 'Objective-C++',
  haskell: 'Haskell',
  elixir: 'Elixir',
  erlang: 'Erlang',
  clojure: 'Clojure',
  fsharp: 'F#',
  ocaml: 'OCaml',
  julia: 'Julia',
  sql: 'SQL',
  graphql: 'GraphQL',
  proto: 'Protocol Buffers',
  diff: 'Diff',
  bash: 'Bash',
  handlebars: 'Handlebars',
  pug: 'Pug',
  jinja: 'Jinja',
  matlab: 'MATLAB',
  'fortran-free-form': 'Fortran',
  vhdl: 'VHDL',
  verilog: 'Verilog',
  asm: 'Assembly',
  solidity: 'Solidity',
}

export const LANGUAGES: LanguageOption[] = [
  { id: 'plaintext', label: '纯文本' },
  ...SUPPORTED_LANG_IDS
    .filter((id) => id !== 'plaintext')
    .map((id) => ({ id, label: LANG_LABELS[id] ?? id }))
    .sort((a, b) => a.label.localeCompare(b.label))
]

/** el-select-v2 需要的 { value, label } 选项格式 */
export const LANGUAGE_OPTIONS = LANGUAGES.map((lang) => ({ value: lang.id, label: lang.label }))

/**
 * 常用文件扩展名 / 特殊文件名 → shiki 语言 id。
 * 未命中的扩展名回退纯文本（仍可在下拉里手动选任意语言）。
 */
const EXTENSION_MAP: Record<string, string> = {
  // 纯文本 / 日志
  txt: 'plaintext',
  log: 'plaintext',
  // JS / TS 家族
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  tsx: 'tsx',
  // 数据 / 配置
  json: 'json',
  jsonc: 'jsonc',
  json5: 'json5',
  jsonl: 'jsonl',
  ndjson: 'jsonl',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  ini: 'ini',
  cfg: 'ini',
  conf: 'ini',
  properties: 'ini',
  env: 'dotenv',
  csv: 'csv',
  tsv: 'csv',
  // 标记 / 样式
  html: 'html',
  htm: 'html',
  xml: 'xml',
  svg: 'xml',
  xhtml: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'scss',
  less: 'less',
  // 前端框架
  vue: 'vue',
  svelte: 'svelte',
  astro: 'astro',
  // 文档
  md: 'markdown',
  markdown: 'markdown',
  mdx: 'mdx',
  rst: 'rst',
  adoc: 'asciidoc',
  asciidoc: 'asciidoc',
  tex: 'tex',
  latex: 'latex',
  bib: 'latex',
  // 脚本
  py: 'python',
  pyw: 'python',
  rb: 'ruby',
  pl: 'perl',
  pm: 'perl',
  lua: 'lua',
  r: 'r',
  php: 'php',
  // Shell / 批处理 / 构建
  sh: 'shellscript',
  bash: 'shellscript',
  zsh: 'shellscript',
  fish: 'fish',
  ps1: 'powershell',
  psm1: 'powershell',
  bat: 'bat',
  cmd: 'bat',
  make: 'make',
  makefile: 'make',
  mk: 'make',
  cmake: 'cmake',
  dockerfile: 'docker',
  nginx: 'nginx',
  // 系统 / 编译型
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  hxx: 'cpp',
  cs: 'csharp',
  java: 'java',
  kt: 'kotlin',
  kts: 'kotlin',
  scala: 'scala',
  groovy: 'groovy',
  go: 'go',
  rs: 'rust',
  swift: 'swift',
  m: 'objective-c',
  mm: 'objective-cpp',
  dart: 'dart',
  zig: 'zig',
  nim: 'nim',
  // 函数式 / 其它语言
  hs: 'haskell',
  ex: 'elixir',
  exs: 'elixir',
  erl: 'erlang',
  clj: 'clojure',
  cljs: 'clojure',
  fs: 'fsharp',
  fsx: 'fsharp',
  ml: 'ocaml',
  jl: 'julia',
  // 数据库 / 查询 / 协议
  sql: 'sql',
  graphql: 'graphql',
  gql: 'graphql',
  proto: 'proto',
  // 版本控制 / 差异
  diff: 'diff',
  patch: 'diff',
  // 模板
  hbs: 'handlebars',
  handlebars: 'handlebars',
  pug: 'pug',
  // 科学 / 硬件
  matlab: 'matlab',
  f90: 'fortran-free-form',
  f95: 'fortran-free-form',
  vhd: 'vhdl',
  vhdl: 'vhdl',
  v: 'verilog',
  sv: 'verilog',
  asm: 'asm',
  s: 'asm',
  // 智能合约
  sol: 'solidity',
}

/** 按文件名（扩展名或特殊全名）自动识别语言，识别不了则回退纯文本 */
export function detectLanguage(fileName: string): string {
  const lower = fileName.toLowerCase()
  const ext = lower.split('.').pop() ?? ''
  return EXTENSION_MAP[ext] ?? 'plaintext'
}
