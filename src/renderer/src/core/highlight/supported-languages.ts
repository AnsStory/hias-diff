/**
 * 受支持的语言子集：只打包常用语言的语法，避免 shiki 全量引入导致产物膨胀。
 * 用户在下拉框选择未收录语言时，自动回退为纯文本高亮。
 */
export type SupportedLangId =
  | 'plaintext'
  // 前端
  | 'javascript' | 'jsx' | 'typescript' | 'tsx'
  | 'vue' | 'svelte' | 'astro'
  | 'html' | 'xml' | 'css' | 'scss' | 'less' | 'postcss'
  | 'svg'
  // 数据 / 配置
  | 'json' | 'jsonc' | 'json5' | 'jsonl'
  | 'yaml' | 'toml' | 'ini' | 'dotenv' | 'csv'
  // 文档
  | 'markdown' | 'mdx' | 'rst' | 'asciidoc' | 'tex' | 'latex'
  // 脚本
  | 'python' | 'ruby' | 'perl' | 'lua' | 'r' | 'php'
  // Shell / 构建
  | 'shellscript' | 'powershell' | 'bat' | 'fish'
  | 'make' | 'cmake' | 'docker' | 'nginx'
  // 编译型
  | 'c' | 'cpp' | 'csharp' | 'java' | 'kotlin' | 'scala' | 'groovy'
  | 'go' | 'rust' | 'swift' | 'dart' | 'zig' | 'nim'
  | 'objective-c' | 'objective-cpp'
  // 函数式
  | 'haskell' | 'elixir' | 'erlang' | 'clojure' | 'fsharp' | 'ocaml' | 'julia'
  // 其它
  | 'sql' | 'graphql' | 'proto'
  | 'diff' | 'bash'
  // 模板
  | 'handlebars' | 'pug' | 'jinja'
  // 科学 / 硬件
  | 'matlab' | 'fortran-free-form' | 'vhdl' | 'verilog' | 'asm'
  | 'solidity'

/** 懒加载 map：key 与 shiki 内置 id 对齐，值为动态 import loader */
const LANG_LOADERS: Record<string, () => Promise<unknown>> = {
  javascript:       () => import('shiki/langs/javascript.mjs'),
  jsx:              () => import('shiki/langs/jsx.mjs'),
  typescript:       () => import('shiki/langs/typescript.mjs'),
  tsx:              () => import('shiki/langs/tsx.mjs'),
  vue:              () => import('shiki/langs/vue.mjs'),
  svelte:           () => import('shiki/langs/svelte.mjs'),
  astro:            () => import('shiki/langs/astro.mjs'),
  html:             () => import('shiki/langs/html.mjs'),
  xml:              () => import('shiki/langs/xml.mjs'),
  css:              () => import('shiki/langs/css.mjs'),
  scss:             () => import('shiki/langs/scss.mjs'),
  less:             () => import('shiki/langs/less.mjs'),
  postcss:          () => import('shiki/langs/postcss.mjs'),
  svg:              () => import('shiki/langs/xml.mjs'),
  json:             () => import('shiki/langs/json.mjs'),
  jsonc:            () => import('shiki/langs/jsonc.mjs'),
  json5:            () => import('shiki/langs/json5.mjs'),
  jsonl:            () => import('shiki/langs/jsonl.mjs'),
  yaml:             () => import('shiki/langs/yaml.mjs'),
  toml:             () => import('shiki/langs/toml.mjs'),
  ini:              () => import('shiki/langs/ini.mjs'),
  dotenv:           () => import('shiki/langs/dotenv.mjs'),
  csv:              () => import('shiki/langs/csv.mjs'),
  markdown:         () => import('shiki/langs/markdown.mjs'),
  mdx:              () => import('shiki/langs/mdx.mjs'),
  rst:              () => import('shiki/langs/rst.mjs'),
  asciidoc:         () => import('shiki/langs/asciidoc.mjs'),
  tex:              () => import('shiki/langs/tex.mjs'),
  latex:            () => import('shiki/langs/latex.mjs'),
  python:           () => import('shiki/langs/python.mjs'),
  ruby:             () => import('shiki/langs/ruby.mjs'),
  perl:             () => import('shiki/langs/perl.mjs'),
  lua:              () => import('shiki/langs/lua.mjs'),
  r:                () => import('shiki/langs/r.mjs'),
  php:              () => import('shiki/langs/php.mjs'),
  shellscript:      () => import('shiki/langs/shellscript.mjs'),
  powershell:       () => import('shiki/langs/powershell.mjs'),
  bat:              () => import('shiki/langs/bat.mjs'),
  fish:             () => import('shiki/langs/fish.mjs'),
  make:             () => import('shiki/langs/make.mjs'),
  cmake:            () => import('shiki/langs/cmake.mjs'),
  docker:           () => import('shiki/langs/docker.mjs'),
  nginx:            () => import('shiki/langs/nginx.mjs'),
  c:                () => import('shiki/langs/c.mjs'),
  cpp:              () => import('shiki/langs/cpp.mjs'),
  csharp:           () => import('shiki/langs/csharp.mjs'),
  java:             () => import('shiki/langs/java.mjs'),
  kotlin:           () => import('shiki/langs/kotlin.mjs'),
  scala:            () => import('shiki/langs/scala.mjs'),
  groovy:           () => import('shiki/langs/groovy.mjs'),
  go:               () => import('shiki/langs/go.mjs'),
  rust:             () => import('shiki/langs/rust.mjs'),
  swift:            () => import('shiki/langs/swift.mjs'),
  dart:             () => import('shiki/langs/dart.mjs'),
  zig:              () => import('shiki/langs/zig.mjs'),
  nim:              () => import('shiki/langs/nim.mjs'),
  'objective-c':    () => import('shiki/langs/objective-c.mjs'),
  'objective-cpp':  () => import('shiki/langs/objective-cpp.mjs'),
  haskell:          () => import('shiki/langs/haskell.mjs'),
  elixir:           () => import('shiki/langs/elixir.mjs'),
  erlang:           () => import('shiki/langs/erlang.mjs'),
  clojure:          () => import('shiki/langs/clojure.mjs'),
  fsharp:           () => import('shiki/langs/fsharp.mjs'),
  ocaml:            () => import('shiki/langs/ocaml.mjs'),
  julia:            () => import('shiki/langs/julia.mjs'),
  sql:              () => import('shiki/langs/sql.mjs'),
  graphql:          () => import('shiki/langs/graphql.mjs'),
  proto:            () => import('shiki/langs/proto.mjs'),
  diff:             () => import('shiki/langs/diff.mjs'),
  bash:             () => import('shiki/langs/bash.mjs'),
  handlebars:       () => import('shiki/langs/handlebars.mjs'),
  pug:              () => import('shiki/langs/pug.mjs'),
  jinja:            () => import('shiki/langs/jinja.mjs'),
  matlab:           () => import('shiki/langs/matlab.mjs'),
  'fortran-free-form': () => import('shiki/langs/fortran-free-form.mjs'),
  vhdl:             () => import('shiki/langs/vhdl.mjs'),
  verilog:          () => import('shiki/langs/verilog.mjs'),
  asm:              () => import('shiki/langs/asm.mjs'),
  solidity:         () => import('shiki/langs/solidity.mjs'),
}

export function getLangLoader(lang: string): (() => Promise<unknown>) | undefined {
  return LANG_LOADERS[lang]
}

export function isSupportedLang(lang: string): boolean {
  return lang in LANG_LOADERS
}

export const SUPPORTED_LANG_IDS = Object.keys(LANG_LOADERS)
