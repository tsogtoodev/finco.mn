#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public', 'spline')

const SCENES = [
  { id: 'n2ZpeSHKKA8Olc1E', usedBy: 'AboutValues — values cluster' },
  { id: '5QI6kS8kPdn7j7Y3', usedBy: 'AboutMission / AboutMissionV3 — pinned mission scene' },
  { id: 'rAfqlL9pnx29yw5P', usedBy: 'HomeContactCta / ProductContactCta — contact CTA' },
  { id: 'jz0xkk2dguy2XY4p', usedBy: 'MapEmbed — spinning map pin' },
]

const check = process.argv.includes('--check')

function sha(buf) {
  return createHash('sha256').update(buf).digest('hex').slice(0, 12)
}

async function localBytes(path) {
  try {
    return await readFile(path)
  }
  catch {
    return null
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  let stale = 0
  let failed = 0

  for (const { id, usedBy } of SCENES) {
    const url = `https://prod.spline.design/${id}/scene.splinecode`
    const dest = join(OUT_DIR, `${id}.splinecode`)

    let remote
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      remote = Buffer.from(await res.arrayBuffer())
    }
    catch (err) {
      failed++
      console.error(`✗ ${id}  fetch failed: ${err.message}  (${usedBy})`)
      continue
    }

    const local = await localBytes(dest)
    const same = local && local.equals(remote)
    const size = `${(remote.length / 1024).toFixed(0)}KB`

    if (same) {
      console.log(`= ${id}  up to date  ${size}  (${usedBy})`)
      continue
    }

    stale++
    if (check) {
      console.error(`✗ ${id}  STALE: local ${local ? sha(local) : 'missing'} vs remote ${sha(remote)}  (${usedBy})`)
      continue
    }
    await writeFile(dest, remote)
    console.log(`↓ ${id}  ${local ? 'updated' : 'added'}  ${size}  (${usedBy})`)
  }

  if (failed) {
    console.error(`\n${failed} scene(s) could not be fetched.`)
    process.exit(1)
  }
  if (check && stale) {
    console.error(`\n${stale} scene(s) out of date — run: node scripts/sync-spline.mjs`)
    process.exit(1)
  }
  if (!check && stale) console.log(`\n${stale} file(s) written to public/spline — commit them.`)
}

await main()
