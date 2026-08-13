import { splineDeviceAllowed } from '~/utils/splineQuality'

export function useSplineEnabled() {
  const enabled = ref(false)
  onMounted(() => {
    enabled.value = splineDeviceAllowed()
  })
  return enabled
}
