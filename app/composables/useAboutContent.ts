import type { Collections } from '@nuxt/content'

export type AboutContent = NonNullable<Collections['pages']['about']>
export type BadgeBlock = AboutContent['mission']['blocks'][number]
export type ValueItem = AboutContent['values']['items'][number]
export type Milestone = AboutContent['history']['milestones'][number]
export type BoardMember = AboutContent['board']['members'][number]

export async function useAboutContent() {
  const page = await usePageContent('about')
  return computed<AboutContent | null>(() => page.value?.about ?? null)
}
