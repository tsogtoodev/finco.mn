import type { Collections } from '@nuxt/content'

export type AboutContent = NonNullable<Collections['pages']['about']>
export type BadgeBlock = AboutContent['mission']['blocks'][number]
export type ValueItem = AboutContent['values']['items'][number]
export type Milestone = AboutContent['history']['milestones'][number]
export type BoardMember = AboutContent['board']['members'][number]

// Reactive accessor for the About page's copy — the `about` group of the
// pages/about doc (`pages` collection), locale-keyed so switching language
// re-queries instead of serving stale copy. Nullable until the doc loads /
// when a locale's doc is missing; the page guards on it.
export async function useAboutContent() {
  const page = await usePageContent('about')
  return computed<AboutContent | null>(() => page.value?.about ?? null)
}
