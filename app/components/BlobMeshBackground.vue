<script setup lang="ts">
const props = withDefaults(defineProps<{
  bgColor?: string
  color1?: string
  color2?: string
  color3?: string
  topWidth?: number
  bottomWidth?: number
  band?: number
  feather?: number
  centerX?: number
  centerY?: number
  speed?: number
  opacity?: number
}>(), {
  bgColor: '#99FFF9',
  color1: '153,255,249',
  color2: '198,236,233',
  color3: '208,178,255',
  topWidth: 0.48,
  bottomWidth: 1.24,
  band: 0.36,
  feather: 0.2,
  centerX: 0.5,
  centerY: 0.5,
  speed: 1,
  opacity: 1,
})

const geom = computed(() => ({
  topWidth: Number(props.topWidth),
  bottomWidth: Number(props.bottomWidth),
  band: Number(props.band),
  feather: Number(props.feather),
  centerX: Number(props.centerX),
  centerY: Number(props.centerY),
  speed: Number(props.speed),
  opacity: (() => {
    const o = Number(props.opacity)
    return Math.min(1, Math.max(0, o > 1 ? o / 100 : o))
  })(),
}))

const fadeStops = computed(() => {
  const { band, feather, centerY } = geom.value
  const half = band / 2
  return {
    in: `${Math.max(0, (centerY - half - feather) * 100)}%`,
    solidTop: `${(centerY - half) * 100}%`,
    solidBottom: `${(centerY + half) * 100}%`,
    out: `${Math.min(100, (centerY + half + feather) * 100)}%`,
  }
})

const uid = useId()
const canvasEl = ref<HTMLCanvasElement | null>(null)
const pathEl = ref<SVGPathElement | null>(null)
const loaded = ref(false)

const VERTEX_SRC = `
attribute vec3 aPosition;
void main() {
  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
  gl_Position = positionVec4;
}
`

const FRAGMENT_SRC = `
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_dpr;
uniform vec3 u_col1;
uniform vec3 u_col2;
uniform vec3 u_col3;

float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453) / u_dpr;
}

vec4 circle(vec2 st, vec2 center, float radius, float blur, vec3 col){
  float dist = distance(st,center)*2.0;
  vec4 f_col = vec4(1.0-smoothstep(radius, radius + blur, dist));
  f_col.r *= col.r;
  f_col.g *= col.g;
  f_col.b *= col.b;
  return f_col;
}

void main(){
  vec2 fst = gl_FragCoord.xy/u_resolution.xy;
  float aspect = u_resolution.x/u_resolution.y;
  vec2 mst = fst;

  vec3 col1 = u_col1 / 255.;
  vec3 col2 = u_col2 / 255.;
  vec3 col3 = u_col3 / 255.;

  vec4 color = vec4(0.);

  vec2 purpleC = vec2(.5+cos(u_time*.4)*.5*cos(u_time*.2)*.5, .5+cos(u_time*.3)*.5*cos(u_time*.5)*.5);
  float purpleR = .25;
  float purpleB = .75;
  vec3 purpleCol = col1;

  vec2 mintC = vec2(.5+sin(u_time*.4)*.5*cos(u_time*.2)*.5, .5+sin(u_time*.3)*.5*cos(u_time*.5)*.5);
  float mintR = 1.;
  float mintB = 1.;
  vec3 mintCol = col2;

  vec2 greenC = vec2((.5+cos(u_time*.5)*.5*sin(u_time*.2)*.5)*aspect, .5+cos(u_time*.4)*(.5)*sin(u_time*.3)*.5);
  float greenR = 1.;
  float greenB = 1.;
  vec3 greenCol = col3;

  mst.x += cos(u_time*.37+mst.x*15.)*.21 * sin(u_time*.14+mst.y*7.)*.29 * 4.;
  mst.y += sin(u_time*.15+mst.x*13.)*.37 * cos(u_time*.36+mst.y*5.)*.12 * 4.;

  vec4 color1 = vec4(0.);
  vec4 color2 = vec4(0.);
  vec4 color3 = vec4(0.);
  vec4 color4 = vec4(0.);
  vec4 color5 = vec4(0.);

  color1 += vec4(
    (circle(mst, mintC, mintR, mintB, vec3(1.))
    - circle(mst, mintC, mintR, mintB, vec3(1.)) * circle(mst, greenC, greenR, greenB, vec3(1.)))
  );

  color2 += vec4(
    (circle(mst, mintC, mintR, mintB, vec3(1.))
    - circle(mst, mintC, mintR, mintB, vec3(1.)) * circle(mst, purpleC, purpleR, purpleB, vec3(1.)))
  );

  color1 -= color1 * color2;
  color2 -= color1 * color2;

  color3 = color1;
  color4 = color2;
  color3.rgb *= purpleCol;
  color4.rgb *= greenCol;

  color += color3;
  color += color4;

  color5 += vec4(
    (circle(mst, greenC, greenR, greenB, vec3(1.))
    - circle(mst, greenC, greenR, greenB, vec3(1.)) * circle(mst, mintC, mintR, mintB, vec3(1.)))
  );
  color5 -= color1 * color2;
  color5.rgb *= mintCol;
  color += color5;

  color += circle(mst, mintC, mintR, mintB, mintCol)
    * (color1 - circle(mst, mintC, mintR, mintB, vec3(1.)))
    * (color2 - circle(mst, mintC, mintR, mintB, vec3(1.)));

  float noise = rand(fst*10.) * .2;
  color.rgb *= 1. - vec3(noise);

  gl_FragColor = color;
}
`

let rafId: number | null = null
let running = false
let observer: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null
let cleanupGl: (() => void) | null = null

onMounted(() => {
  const canvas = canvasEl.value
  const path = pathEl.value
  if (!canvas || !path) return

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const col1 = props.color1.split(',').map(Number)
  const col2 = props.color2.split(',').map(Number)
  const col3 = props.color3.split(',').map(Number)

  function updateMask() {
    const rect = canvas!.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    const { centerX, topWidth, bottomWidth } = geom.value
    const topL = (centerX - topWidth / 2) * w
    const topR = (centerX + topWidth / 2) * w
    const botL = (centerX - bottomWidth / 2) * w
    const botR = (centerX + bottomWidth / 2) * w
    path!.setAttribute(
      'd',
      `M${botL},${0.954 * h} L${topL},${0.046 * h} H${topR} L${botR},${0.954 * h} H${botL} Z`,
    )
  }

  watch(geom, updateMask)

  const gl
    = canvas.getContext('webgl', { antialias: false, alpha: true, powerPreference: 'low-power' })
      || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)
  if (!gl) {
    loaded.value = true
    return
  }

  function compile(type: number, source: string) {
    const shader = gl!.createShader(type)!
    gl!.shaderSource(shader, source)
    gl!.compileShader(shader)
    if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
      console.warn(gl!.getShaderInfoLog(shader))
      gl!.deleteShader(shader)
      return null
    }
    return shader
  }

  const vs = compile(gl.VERTEX_SHADER, VERTEX_SRC)
  const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SRC)
  if (!vs || !fs) {
    loaded.value = true
    return
  }

  const program = gl.createProgram()!
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(program))
    loaded.value = true
    return
  }

  const aPosition = gl.getAttribLocation(program, 'aPosition')
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)

  const uResolution = gl.getUniformLocation(program, 'u_resolution')
  const uTime = gl.getUniformLocation(program, 'u_time')
  const uDpr = gl.getUniformLocation(program, 'u_dpr')
  const uCol1 = gl.getUniformLocation(program, 'u_col1')
  const uCol2 = gl.getUniformLocation(program, 'u_col2')
  const uCol3 = gl.getUniformLocation(program, 'u_col3')

  const startTime = Date.now()
  let width = 0
  let height = 0

  function resizeCanvas() {
    const w = Math.round(canvas!.clientWidth * dpr)
    const h = Math.round(canvas!.clientHeight * dpr)
    if (canvas!.width !== w || canvas!.height !== h) {
      canvas!.width = w
      canvas!.height = h
      updateMask()
    }
    width = canvas!.width
    height = canvas!.height
  }

  function drawFrame() {
    gl!.viewport(0, 0, width, height)
    gl!.clearColor(0, 0, 0, 0)
    gl!.clear(gl!.COLOR_BUFFER_BIT)
    gl!.useProgram(program)
    gl!.enableVertexAttribArray(aPosition)
    gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer)
    gl!.vertexAttribPointer(aPosition, 2, gl!.FLOAT, false, 0, 0)
    gl!.uniform2fv(uResolution, [width, height])
    gl!.uniform1f(uTime, 0.005 * geom.value.speed * (Date.now() - startTime))
    gl!.uniform1f(uDpr, dpr)
    gl!.uniform3fv(uCol1, col1)
    gl!.uniform3fv(uCol2, col2)
    gl!.uniform3fv(uCol3, col3)
    gl!.drawArrays(gl!.TRIANGLES, 0, 6)
  }

  function loop() {
    if (!running) return
    resizeCanvas()
    drawFrame()
    if (!loaded.value && width > 0 && height > 0) loaded.value = true
    rafId = requestAnimationFrame(loop)
  }

  resizeObserver = new ResizeObserver(() => {
    updateMask()
    if (reducedMotion) {
      resizeCanvas()
      drawFrame()
    }
  })
  resizeObserver.observe(canvas)
  updateMask()
  resizeCanvas()

  if (reducedMotion) {
    drawFrame()
    loaded.value = true
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries[entries.length - 1]?.isIntersecting ?? false
      if (visible && !running) {
        running = true
        if (!rafId) rafId = requestAnimationFrame(loop)
      }
      else if (!visible && running) {
        running = false
        if (rafId) {
          cancelAnimationFrame(rafId)
          rafId = null
        }
      }
    },
    { rootMargin: '200px' },
  )
  observer.observe(canvas)

  const handleVisibility = () => {
    if (document.hidden && rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    else if (!document.hidden && running && !rafId) {
      rafId = requestAnimationFrame(loop)
    }
  }
  document.addEventListener('visibilitychange', handleVisibility)

  cleanupGl = () => {
    document.removeEventListener('visibilitychange', handleVisibility)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
})

onBeforeUnmount(() => {
  running = false
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  observer?.disconnect()
  observer = null
  resizeObserver?.disconnect()
  resizeObserver = null
  cleanupGl?.()
  cleanupGl = null
})
</script>

<template>
  <div class="blob-mesh" aria-hidden="true">
    <canvas
      ref="canvasEl"
      class="blob-mesh__canvas"
      :class="{ 'is-loaded': loaded }"
      :style="{
        backgroundColor: bgColor,
        maskImage: `url(#${uid}-mask)`,
        WebkitMaskImage: `url(#${uid}-mask)`,
        '--mesh-opacity': geom.opacity,
      }"
    />
    <svg class="blob-mesh__defs" xmlns="http://www.w3.org/2000/svg" width="0" height="0">
      <defs>
        <filter :id="`${uid}-blur`" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="20" />
        </filter>
        <linearGradient :id="`${uid}-fade`" x1="50%" y1="0%" x2="50%" y2="100%" gradientUnits="userSpaceOnUse">
          <stop :offset="fadeStops.in" stop-color="#737373" stop-opacity="0" />
          <stop :offset="fadeStops.solidTop" stop-color="#D9D9D9" stop-opacity="1" />
          <stop :offset="fadeStops.solidBottom" stop-color="#D9D9D9" stop-opacity="1" />
          <stop :offset="fadeStops.out" stop-color="#737373" stop-opacity="0" />
        </linearGradient>
        <mask :id="`${uid}-mask`" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
          <path ref="pathEl" :fill="`url(#${uid}-fade)`" :filter="`url(#${uid}-blur)`" />
        </mask>
      </defs>
    </svg>
  </div>
</template>

<style scoped>
.blob-mesh {
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.blob-mesh__canvas {
  width: 100%;
  height: 100%;
  display: block;
  mask-size: 100% 100%;
  -webkit-mask-size: 100% 100%;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
  opacity: 0;
  transition: opacity 0.6s ease-out;
}

.blob-mesh__canvas.is-loaded {
  opacity: var(--mesh-opacity, 1);
}

.blob-mesh__defs {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
