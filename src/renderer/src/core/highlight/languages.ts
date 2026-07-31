import { bundledLanguagesInfo } from 'shiki'

export interface LanguageOption {
  id: string
  label: string
}

/**
 * 语言下拉选项：纯文本置顶，其余为 shiki 全量语言（按名称排序）。
 * bundledLanguagesInfo 只是元数据（id/name/aliases），语法本体走动态 import，
 * 引入它不会把全部语法打进首屏包。
 */
export const LANGUAGES: LanguageOption[] = [
  { id: 'plaintext', label: '纯文本' },
  ...bundledLanguagesInfo
    .map((info) => ({ id: info.id, label: info.name }))
    .sort((a, b) => a.label.localeCompare(b.label))
]

/** el-select-v2 需要的 { value, label } 选项格式 */
export const LANGUAGE_OPTIONS = LANGUAGES.map((lang) => ({ value: lang.id, label: lang.label }))

/**
 * 常用文件扩展名 / 特殊文件名 → shiki 语言 id。
 * shiki 元数据不含扩展名，故这里显式维护；value 必须是真实存在的 shiki id。
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
  sass: 'sass',
  less: 'less',
  styl: 'stylus',
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
  bib: 'bibtex',
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
  cr: 'crystal',
  vb: 'vb',
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
  lisp: 'common-lisp',
  el: 'emacs-lisp',
  scm: 'scheme',
  rkt: 'racket',
  coffee: 'coffee',
  // 科学 / 硬件
  matlab: 'matlab',
  f: 'fortran-fixed-form',
  for: 'fortran-fixed-form',
  f90: 'fortran-free-form',
  f95: 'fortran-free-form',
  vhd: 'vhdl',
  vhdl: 'vhdl',
  v: 'verilog',
  sv: 'verilog',
  asm: 'asm',
  s: 'asm',
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
  // 智能合约
  sol: 'solidity'
}

/** 按文件名（扩展名或特殊全名）自动识别语言，识别不了则回退纯文本 */
export function detectLanguage(fileName: string): string {
  const lower = fileName.toLowerCase()
  // 无扩展名的特殊文件（Dockerfile / Makefile 等），split 后 pop 得到全名本身
  const ext = lower.split('.').pop() ?? ''
  return EXTENSION_MAP[ext] ?? 'plaintext'
}
