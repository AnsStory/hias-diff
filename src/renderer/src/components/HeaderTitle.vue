<script setup>
import { computed } from 'vue'
import { getAnimationClass } from '../utils/animation'

const animationClass = computed(() => getAnimationClass('bounceIn'))
</script>

<template>
  <div class="HeaderTitle">
    <span :class="[animationClass, 'brand-name', 'brand-name--double-line']">
      <span class="brand-logo shine-img">
        <img src="/favicon.svg" alt="logo" />
      </span>
      hias<span>.</span>diff
    </span>
  </div>
</template>

<style lang="css" scoped>
.HeaderTitle {
  display: flex;
  align-items: center;
  cursor: pointer;
}
.brand-logo {
  margin-right: 4px;
  width: 24px;
  height: 24px;
}

.brand-name {
  position: relative;
  display: flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
  font-size: inherit;
  letter-spacing: 1.5px;
  padding: 4px 0;
  font-weight: 800;
  color: var(--el-color-primary-light-2);
}

.brand-name--double-line {
  position: relative;
}

.brand-name--double-line:hover {
  color: var(--el-color-primary);
}

.brand-name--double-line::before,
.brand-name--double-line::after {
  content: '';
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--el-color-primary);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.4s cubic-bezier(0.785, 0.135, 0.15, 0.86);
}

.brand-name--double-line::before {
  top: 0;
  transform-origin: right;
}

.brand-name--double-line::after {
  bottom: 0;
  transform-origin: left;
}

.brand-name--double-line:hover::before,
.brand-name--double-line:hover::after {
  transform: scaleX(1);
}

.brand-name--double-line:hover::before {
  transform-origin: left;
}

.brand-name--double-line:hover::after {
  transform-origin: right;
}

.brand-slogan {
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>
