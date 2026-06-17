# Finco Capital — Site Structure Plan

Derived from the Figma `final` page (`node 1:11344`). Source: 10 full-page designs + shared component definitions. Target stack: **Nuxt 4 · Vue 3 · Tailwind v4 · @nuxt/content · @nuxtjs/i18n (mn / en) · motion-v · @nuxt/image**.

The site is a bilingual (Mongolian-first) marketing + careers site for **Finco Capital ББСБ ХХК**, a Mongolian non-bank financial institution behind the *Beep* and *FincoBiz* products.

---

## 1. Pages

| # | Route | Page | Figma node | Notes |
|---|-------|------|-----------|-------|
| 1 | `/` | **Home** (Beep landing) | `1:14110` | App hero, stat counters (71,000 / ₮770сая / 26,000+), product highlights, Beep & FincoBiz showcase, news/blog grid |
| 2 | `/about` | **About Us** — Бидний тухай | `1:12179` | Hero, value prop, company-story timeline (2023–2026), leadership profile, team list, ecosystem diagram |
| 3 | `/products` | **Products — Individual** — Иргэдэд | `1:13609` | Hero + audience toggle, 5-card product grid (Барьцаат / Автомашины / Ногоон / Хэрэглээний / Цалингийн зээл), FAQ |
| 4 | `/business` | **Products — Business** — Бизнест | `1:13833` | Hero + audience toggle, 8-card business product grid, FAQ |
| 5 | `/products/[slug]` | **Product Detail** — e.g. Автомашины зээл | `1:13320` | Hero with term stats (amount / rate / period), tabs (info / requirements / FAQ), related-products carousel, FAQ |
| 6 | `/services/[slug]` | **Trust Service Detail** — Итгэлцлийн үйлчилгээ | `1:14670` | Hero, related-products carousel, FAQ |
| 7 | `/branches` | **Branch Locations** — Салбарын хаяг байршил | `1:12835` | Branch list (accordion-style), branch photo + map |
| 8 | `/careers` | **Careers** — Нээлттэй ажлын байр | `1:14443` | Hero, recruitment-process timeline, perks list, open-position listings |
| 9 | `/careers/[slug]` | **Job Detail + Application** — Хүний нөөцийн ажилтан | `1:12554` | Job info, requirements, multi-step application form (accordion) |
| 10 | `/careers/exam` | **Exam Login** — Шалгалт | `1:13057` | Login (registry no. + password), exam duration card |

**Layouts**
- `default` — Announcement bar + Header + `<slot/>` + Footer (pages 1–9).
- `minimal` — Header + `<slot/>`, no footer / reduced chrome (exam login `/careers/exam`).

---

## 2. Sections (per page)

Sections are page-level composition blocks. Shared ones are marked **[shared]**.

**Home `/`**
- `HeroBeep` — phone mockup + headline + CTA
- `ValuePropRow` — 2–3 feature blurbs over gradient
- `StatStrip` — animated counters (uses `Counter.vue`)
- `ProductHighlights` — product card row + carousel controls
- `BeepShowcase` — dark feature panel with badges
- `FincoBizShowcase` — light product panel
- `NewsGrid` — blog/news cards
- `CtaBanner` — dark closing CTA

**About `/about`**
- `PageHero` **[shared]**
- `StoryTimeline` — year milestones 2023–2026
- `LeadershipProfile` — portrait + quote
- `TeamList` — member rows (avatar + role + bio)
- `EcosystemDiagram` — branching product map

**Products / Business `/products`, `/business`**
- `PageHero` **[shared]** + `AudienceToggle` (Иргэнд / Бизнест)
- `ProductCardGrid` **[shared]**
- `FaqAccordion` **[shared]**

**Product / Service Detail `/products/[slug]`, `/services/[slug]`**
- `PageHero` **[shared]** + `LoanTermsStats` (detail only)
- `DetailTabs` — Ерөнхий мэдээлэл / Тавигдах шаардлага / Бусад
- `RelatedProductsCarousel` **[shared]** — Санал болгох бусад бүтээгдэхүүн
- `FaqAccordion` **[shared]**

**Branches `/branches`**
- `PageHero` **[shared]**
- `BranchExplorer` — branch selector list + photo + embedded map

**Careers `/careers`**
- `PageHero` **[shared]**
- `RecruitmentTimeline` — 6-step process
- `PerksList` — benefits bullets
- `JobListings` — open-position rows

**Job Detail `/careers/[slug]`**
- `PageHero` **[shared]** (breadcrumb + back)
- `JobInfo` — general info + requirements columns
- `ApplicationForm` — accordion sections (Ерөнхий мэдээлэл / Ажлын туршлага / Бусад / Хавсаргах)

**Exam Login `/careers/exam`**
- `ExamLogin` — login card + duration info, no footer

---

## 3. Base components

Reusable primitives + composites. Existing files marked **(exists)**.

**Layout & chrome**
- `AnnouncementBar` — top promo strip (Beep Wallet · Дэлгэрэнгүй →)
- `SiteHeader` / `AppNav` — logo, nav links, locale globe, mobile menu
- `SiteFooter` — 4-column link groups (Бидний тухай / Иргэнд / Бизнест / Бусад) + contact row
- `PageHero` — breadcrumb + back button + title (variants: image-bg dark, plain light)
- `LocaleSwitcher` **(exists)**
- `MotionReveal` **(exists)** — scroll-in animation wrapper

**Content composites**
- `ProductCard` — image with gradient overlay + title (+ optional description on hover)
- `ProductCardGrid` — responsive card grid
- `RelatedProductsCarousel` — horizontal scroller + `IconButton` prev/next
- `FaqAccordion` + `AccordionItem` — Түгээмэл асуултууд
- `DetailTabs` / `Tabs` + `TabList` + `TabPanel`
- `Timeline` — shared by `StoryTimeline` & `RecruitmentTimeline` (vertical & horizontal variants)
- `StatCounter` — built on `Counter.vue` **(exists)**
- `TeamMemberCard` / `LeadershipProfile`
- `NewsCard`
- `BranchCard` / `BranchList`
- `MapEmbed`
- `JobListingItem`
- `LoanTermsStats` — amount / rate / period pill row
- `AudienceToggle` — segmented Иргэнд / Бизнест switch

**Form & UI atoms**
- `Button` — variants: `primary` (blue), `accent` (blurple), `secondary`, `outline`, `ghost`; sizes sm/md/lg; optional trailing arrow icon
- `IconButton` — circular (carousel arrows)
- `Input` / `FormField` — label + input + validation
- `PasswordInput` — with reveal toggle
- `Chip` / `Badge` — contact chips, category tags, "Ногоон зээл" dot label
- `Card` / `GlassCard` — base surface + glassmorphism variant
- `Icon` — wraps the HugeIcons / Lucide set used in Figma
- `Alert` **(exists)**

---

## 4. Design tokens

From Figma variables (`get_variable_defs`). Wire into `app/assets/css/main.css` as Tailwind v4 `@theme` tokens.

**Color**
| Token | Value | Use |
|-------|-------|-----|
| `--color-primary` | `#214784` | Brand blue — primary buttons, links, headings accent |
| `--color-teal` | `#13CFB9` | Beep brand accent / highlights |
| `--color-accent` (Blurple) | `≈#5B5BD6` *(confirm in Figma)* | Purple CTAs, map pins, secondary accent |
| `--color-dark` | `#28303F` | Dark hero/footer backgrounds |
| `--color-foreground` | `#09090B` | Body text |
| `--color-muted` | `#F4F4F5` | Muted surfaces |
| `--color-secondary` | `#F5F5F5` | Secondary surface |
| `--color-secondary-foreground` | `#171717` / `#383838` | Text on secondary |
| `--color-input` | `#E6E6E6` | Input borders |
| `--color-white` | `#FFFFFF` | — |

**Radius:** `--radius: 12px`; `--radius-sm: 8px` (`calc(var(--radius) - 2px)`).

**Spacing scale (px):** `0 · 4 · 8 · 16 · 24` (Tailwind `p-0/1/2/4/6`); widths `16 · 40 · 48` (`w-4/10/12`); height `32` (`h-8`).

**Typography:** sizes `xs 12 · sm 14 · base 16` (extend up for headings); line-height `leading-4 16 · leading-5 20`; weight `medium 500`. Font managed via `@nuxt/fonts` — confirm family from Figma text styles.

**Shadow:** `shadow-2xs` → `0 1px 2px rgba(26,26,26,0.05)`.

---

## 5. Build order (suggested)

1. **Tokens** → `main.css` `@theme` + Tailwind config.
2. **Chrome** → `AnnouncementBar`, `SiteHeader`, `SiteFooter`, `default` layout.
3. **Atoms** → `Button`, `IconButton`, `Input`, `Chip`, `Card`, `Icon`.
4. **Composites** → `PageHero`, `ProductCard(+Grid)`, `FaqAccordion`, `Tabs`, `Timeline`, `RelatedProductsCarousel`.
5. **Pages** → Home → Products/Business → Detail pages → About → Careers flow → Branches.
6. **i18n** → extract all Mongolian copy into `i18n/locales/mn.json` + `en.json`; product/job/branch data into `@nuxt/content` collections (`content/mn`, `content/en`).

---

### Open items to confirm
- Exact **Blurple** hex and the **font family** (not exposed in structural metadata — pull from a text node's design context).
- Whether product/job/branch listings are **content-driven** (`@nuxt/content`) or hardcoded — recommend content collections for the bilingual catalog.
- Map provider for `MapEmbed` (static image vs. live map).
