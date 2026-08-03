export class AnimationPerformanceMonitor {
  private frameCount = 0
  private lastTime = performance.now()
  private fps = 60

  measure(): number {
    this.frameCount++
    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastTime

    if (deltaTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / deltaTime)
      this.frameCount = 0
      this.lastTime = currentTime
    }

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
