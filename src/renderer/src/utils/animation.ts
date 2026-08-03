export class AnimationPerformanceMonitor {
  private frameCount = 0
  private lastTime = performance.now()
  private fps = 60
  private animationFrameId: number | null = null
  private samplingInterval: ReturnType<typeof setInterval> | null = null

  startSampling(intervalMs = 2000): void {
    if (this.samplingInterval) return
    
    // 启动requestAnimationFrame循环来计数帧
    const animate = () => {
      this.frameCount++
      this.animationFrameId = requestAnimationFrame(animate)
    }
    this.animationFrameId = requestAnimationFrame(animate)
    
    // 启动定时器来计算FPS
    this.samplingInterval = setInterval(() => {
      const currentTime = performance.now()
      const deltaTime = currentTime - this.lastTime
      if (deltaTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / deltaTime)
        this.frameCount = 0
        this.lastTime = currentTime
      }
    }, intervalMs)
  }

  stopSampling(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    if (this.samplingInterval) {
      clearInterval(this.samplingInterval)
      this.samplingInterval = null
    }
  }

  measure(): number {
    this.frameCount++
    return this.fps
  }

  shouldReduceAnimations(): boolean {
    return this.fps < 30
  }
}

export const animationMonitor = new AnimationPerformanceMonitor()

export function getAnimationClass(animationName: string): string {
  if (animationMonitor.shouldReduceAnimations()) {
    return ''
  }
  return `animate__animated animate__${animationName}`
}
