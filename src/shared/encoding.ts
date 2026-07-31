import { detect } from 'jschardet'

/**
 * 字节序列的编码自动识别与转码。
 *
 * 该模块不依赖任何框架，同时被渲染层（浏览器，通过 @shared 别名）与主进程
 * （Node，通过相对路径）复用，保证两端「打开文件 / 拖拽文件」的解码行为一致。
 */

export interface DecodeResult {
  /** 解码后的文本（已剥离 BOM） */
  text: string
  /** 最终采用的编码标签（TextDecoder 口径） */
  encoding: string
}

/** jschardet 返回的编码名 → TextDecoder 可识别的标签 */
const LABEL_MAP: Record<string, string> = {
  ascii: 'utf-8',
  'utf-8': 'utf-8',
  'utf-16le': 'utf-16le',
  'utf-16be': 'utf-16be',
  gb2312: 'gbk',
  gbk: 'gbk',
  gb18030: 'gb18030',
  big5: 'big5',
  shift_jis: 'shift_jis',
  sjis: 'shift_jis',
  'euc-jp': 'euc-jp',
  'euc-kr': 'euc-kr',
  'windows-1250': 'windows-1250',
  'windows-1251': 'windows-1251',
  'windows-1252': 'windows-1252',
  'windows-1253': 'windows-1253',
  'windows-1255': 'windows-1255',
  'iso-8859-1': 'iso-8859-1',
  'iso-8859-2': 'iso-8859-2',
  'iso-8859-5': 'iso-8859-5',
  'iso-8859-7': 'iso-8859-7',
  'koi8-r': 'koi8-r',
  'tis-620': 'windows-874',
  tis620: 'windows-874'
}

/** 统计检测只取样前 64KB，足够稳定且避免大文件卡顿 */
const DETECT_SAMPLE = 64 * 1024

/** Uint8Array → latin1「二进制字符串」，供 jschardet 使用（浏览器无 Buffer） */
function toBinaryString(bytes: Uint8Array): string {
  let s = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    s += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + CHUNK) as unknown as number[]
    )
  }
  return s
}

function decodeWith(bytes: Uint8Array, label: string): string {
  return new TextDecoder(label).decode(bytes)
}

/**
 * 自动识别字节序列的编码并解码为字符串。
 *
 * 判定顺序：BOM → 严格 UTF-8 → jschardet 统计检测 → 回退 UTF-8。
 * 始终返回可用文本，不会抛错。
 */
export function decodeBytes(input: Uint8Array): DecodeResult {
  // 1) BOM 最可靠，优先并剥离
  if (input.length >= 3 && input[0] === 0xef && input[1] === 0xbb && input[2] === 0xbf) {
    return { text: decodeWith(input.subarray(3), 'utf-8'), encoding: 'utf-8' }
  }
  if (input.length >= 2 && input[0] === 0xff && input[1] === 0xfe) {
    return { text: decodeWith(input.subarray(2), 'utf-16le'), encoding: 'utf-16le' }
  }
  if (input.length >= 2 && input[0] === 0xfe && input[1] === 0xff) {
    return { text: decodeWith(input.subarray(2), 'utf-16be'), encoding: 'utf-16be' }
  }

  // 2) 无 BOM 时优先尝试严格 UTF-8：命中最常见场景，且非法字节会抛错，判定可靠
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(input), encoding: 'utf-8' }
  } catch {
    // 非 UTF-8，落到统计检测
  }

  // 3) jschardet 统计检测（取样前 64KB）
  let label = 'utf-8'
  try {
    const sample = input.length > DETECT_SAMPLE ? input.subarray(0, DETECT_SAMPLE) : input
    const result = detect(toBinaryString(sample))
    if (result && result.encoding) {
      const norm = result.encoding.toLowerCase()
      label = LABEL_MAP[norm] ?? norm
    }
  } catch {
    // 检测失败则保持 utf-8
  }

  // 4) 用识别到的编码解码；不支持或失败则回退 UTF-8（非严格，不再抛错）
  try {
    return { text: decodeWith(input, label), encoding: label }
  } catch {
    return { text: decodeWith(input, 'utf-8'), encoding: 'utf-8' }
  }
}

/** 首 sampleSize 字节含 NUL 即判为二进制文件 */
export function looksBinary(input: Uint8Array, sampleSize = 8192): boolean {
  // UTF-16 文本天然含大量 NUL 字节，带 BOM（FF FE / FE FF）即视为文本，避免误杀
  if (
    input.length >= 2 &&
    ((input[0] === 0xff && input[1] === 0xfe) || (input[0] === 0xfe && input[1] === 0xff))
  ) {
    return false
  }
  const n = Math.min(input.length, sampleSize)
  for (let i = 0; i < n; i++) {
    if (input[i] === 0) return true
  }
  return false
}
