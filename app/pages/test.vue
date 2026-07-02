<script setup lang="ts">
const SCENE = 'https://prod.spline.design/ctfpPmq7XLx77Ni2/scene.splinecode'
</script>

<template>
  <div>
    <ClientOnly>
      <SplineScene :scene="SCENE" no-drag />
    </ClientOnly>
  </div>
</template>
