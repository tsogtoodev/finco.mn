import { aboutContent, type AboutContent } from '~/data/about'

// Reactive accessor for the About page's bilingual copy. Switching locale
// re-resolves the content so headings, bios and the CEO message swap language.
export function useAboutContent(): ComputedRef<AboutContent> {
  const { locale } = useI18n()
  return computed(() => aboutContent[locale.value as 'mn' | 'en'] ?? aboutContent.mn)
}
