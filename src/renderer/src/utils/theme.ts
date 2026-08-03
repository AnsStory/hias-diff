/**
 * 获取文档根元素的主色调颜色值
 * 该函数用于获取Element UI组件库中定义的主颜色变量值
 * @returns {string} 返回主色调的颜色值，如果没有找到则返回空字符串
 */
export const getElColorPrimary = () => {
  const el = document.documentElement
  return getComputedStyle(el).getPropertyValue(`--el-color-primary`)
}
/**
 * 设置 Element Plus 主题主色、深浅系列变量
 * @param theme 十六进制颜色，如 #409EFF
 */
export function handleThemeStyle(theme: string): void {
  document.documentElement.style.setProperty('--el-color-primary', theme)
  for (let i = 1; i <= 9; i++) {
    document.documentElement.style.setProperty(
      `--el-color-primary-light-${i}`,
      `${getLightColor(theme, i / 10)}`
    )
  }
  for (let i = 1; i <= 9; i++) {
    document.documentElement.style.setProperty(
      `--el-color-primary-dark-${i}`,
      `${getDarkColor(theme, i / 10)}`
    )
  }
}

/**
 * hex 颜色 #xxxxxx 转为 rgb 数组 [r,g,b]
 * @param str 十六进制颜色 #RRGGBB
 * @returns [red, green, blue] 0~255
 */
export function hexToRgb(str: string): [number, number, number] {
  str = str.replace('#', '')
  const hexs = str.match(/../g)
  if (!hexs || hexs.length !== 3) {
    throw new Error('hex颜色格式错误，请传入 #RRGGBB 格式')
  }
  const rgbArr: number[] = []
  for (let i = 0; i < 3; i++) {
    rgbArr.push(parseInt(hexs[i], 16))
  }
  return [rgbArr[0], rgbArr[1], rgbArr[2]]
}

/**
 * 三通道rgb转hex #RRGGBB
 * @param r 红色 0-255
 * @param g 绿色 0-255
 * @param b 蓝色 0-255
 * @returns 格式化hex颜色
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const hexs = [r.toString(16), g.toString(16), b.toString(16)]
  for (let i = 0; i < 3; i++) {
    if (hexs[i].length === 1) {
      hexs[i] = `0${hexs[i]}`
    }
  }
  return `#${hexs.join('')}`
}

/**
 * 颜色提亮
 * @param color hex色值 #xxxxxx
 * @param level 提亮系数 0~1
 * @returns 变浅后的hex
 */
export function getLightColor(color: string, level: number): string {
  const rgb = hexToRgb(color)
  for (let i = 0; i < 3; i++) {
    rgb[i] = Math.floor((255 - rgb[i]) * level + rgb[i])
  }
  return rgbToHex(rgb[0], rgb[1], rgb[2])
}

/**
 * 颜色加深
 * @param color hex色值 #xxxxxx
 * @param level 加深系数 0~1
 * @returns 加深后的hex
 */
export function getDarkColor(color: string, level: number): string {
  const rgb = hexToRgb(color)
  for (let i = 0; i < 3; i++) {
    rgb[i] = Math.floor(rgb[i] * (1 - level))
  }
  return rgbToHex(rgb[0], rgb[1], rgb[2])
}
