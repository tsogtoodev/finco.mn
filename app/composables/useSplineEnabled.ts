import { splineDeviceAllowed } from '~/utils/splineQuality'

// Whether this visitor gets the live Spline scene or the static image that sits
// behind it.
//
// Deliberately starts FALSE and only flips after mount, which does three things
// at once:
//   • SSR renders the fallback image, so the section is complete in the first
//     paint instead of appearing after hydration (these are large decorative
//     surfaces — several are the biggest thing in their section).
//   • Hydration matches, because server and first client render agree.
//   • The device check can use client-only signals (reduced motion, core count,
//     GPU string) without a mismatch.
//
// Call sites use it as `v-if` / `v-else` around the scene and its poster, which
// is why <SplineScene> no longer needs wrapping in <ClientOnly>: this ref is the
// client-only gate.
export function useSplineEnabled() {
  const enabled = ref(false)
  onMounted(() => {
    enabled.value = splineDeviceAllowed()
  })
  return enabled
}
