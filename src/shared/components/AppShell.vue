<template>
  <div class="shell">
    <div class="shell__glow"></div>
    <main class="shell__content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.shell__glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 15% 20%, rgba(183, 101, 52, 0.12), transparent 30%),
    radial-gradient(circle at 85% 15%, rgba(41, 122, 153, 0.12), transparent 24%);
  pointer-events: none;
}

.shell__content {
  position: relative;
  z-index: 1;
  width: min(1080px, calc(100% - 32px));
  margin: 0 auto;
  padding: 32px 0 48px;
}
</style>
