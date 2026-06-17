// Home product carousel data (Figma 1:14183). Bilingual + filtered by the
// Иргэнд / Бизнест audience toggle. Kept as a typed data file (not the @nuxt/
// content `products` collection) so the homepage stays self-contained; slugs
// match the products pages so card links resolve.
export interface HomeProduct {
  slug: string
  audience: 'individual' | 'business'
  title: string
  summary: string
  image: string
}

export const homeProducts: Record<'mn' | 'en', HomeProduct[]> = {
  mn: [
    {
      slug: 'consumer-loan',
      audience: 'individual',
      title: 'Хэрэглээний зээл',
      summary: 'Өдөр тутмын хэрэгцээ болон өрхийн орлого нэмэгдүүлэх жижиг бизнесийг санхүүжүүлэх уян хатан шийдэл',
      image: '/images/home/product-1.png',
    },
    {
      slug: 'auto-loan',
      audience: 'individual',
      title: 'Автомашины зээл',
      summary: 'Шинэ болон дугаартай автомашин худалдан авахад хамгийн хурдан шийдвэр, таатай нөхцөлтэй',
      image: '/images/home/product-2.png',
    },
    {
      slug: 'green-loan',
      audience: 'individual',
      title: 'Ногоон хэрэглээний зээл',
      summary: 'Эрчим хүчний хэмнэлттэй, байгальд ээлтэй шийдлүүдийг санхүүжүүлэх зээл',
      image: '/images/home/product-3.png',
    },
    {
      slug: 'quick-collateral-loan',
      audience: 'individual',
      title: 'Барьцаат шуурхай зээл',
      summary: 'Үл хөдлөх болон хөдлөх хөрөнгөөр баталгаажсан санхүүжилтийг уян хатан нөхцөлөөр авах боломж',
      image: '/images/home/product-base.png',
    },
    {
      slug: 'salary-loan',
      audience: 'individual',
      title: 'Цалингийн зээл',
      summary: 'Премиум Корпорэйшний харьяа охин компаниудын ажилтнуудад зориулсан',
      image: '/images/home/product-5.png',
    },
    {
      slug: 'business-loan',
      audience: 'business',
      title: 'Бизнесийн зээл',
      summary: 'Бизнесийн өргөжилт, өдөр тутмын үйл ажиллагааг дэмжих уян хатан санхүүжилт',
      image: '/images/home/product-5.png',
    },
    {
      slug: 'investment-loan',
      audience: 'business',
      title: 'Хөрөнгө оруулалтын зээл',
      summary: 'Хөрөнгө оруулалт, өргөтгөлийн төслүүдийг санхүүжүүлэх урт хугацаат шийдэл',
      image: '/images/home/product-3.png',
    },
    {
      slug: 'purchase-loan',
      audience: 'business',
      title: 'Худалдан авалтын зээл',
      summary: 'Бараа материал, тоног төхөөрөмж худалдан авалтыг санхүүжүүлэх зээл',
      image: '/images/home/product-2.png',
    },
    {
      slug: 'green-business-loan',
      audience: 'business',
      title: 'Ногоон бизнесийн зээл',
      summary: 'Байгальд ээлтэй, эрчим хүч хэмнэсэн бизнесийн төслүүдэд зориулсан зээл',
      image: '/images/home/product-3.png',
    },
    {
      slug: 'women-business-loan',
      audience: 'business',
      title: 'Эмэгтэй бизнес эрхлэгчдэд зориулсан зээл',
      summary: 'Эмэгтэй бизнес эрхлэгчдийн санаачилгыг дэмжих тусгай нөхцөлтэй зээл',
      image: '/images/home/product-1.png',
    },
  ],
  en: [
    {
      slug: 'consumer-loan',
      audience: 'individual',
      title: 'Consumer loan',
      summary: 'A flexible solution to finance everyday needs and small businesses that grow household income',
      image: '/images/home/product-1.png',
    },
    {
      slug: 'auto-loan',
      audience: 'individual',
      title: 'Auto loan',
      summary: 'The fastest decision and favourable terms for buying a new or registered vehicle',
      image: '/images/home/product-2.png',
    },
    {
      slug: 'green-loan',
      audience: 'individual',
      title: 'Green consumer loan',
      summary: 'A loan to finance energy-efficient, environmentally friendly solutions',
      image: '/images/home/product-3.png',
    },
    {
      slug: 'quick-collateral-loan',
      audience: 'individual',
      title: 'Quick collateral loan',
      summary: 'Financing secured by real estate or movable assets, available on flexible terms',
      image: '/images/home/product-base.png',
    },
    {
      slug: 'salary-loan',
      audience: 'individual',
      title: 'Salary loan',
      summary: 'Designed for employees of subsidiaries within the Premium Corporation group',
      image: '/images/home/product-5.png',
    },
    {
      slug: 'business-loan',
      audience: 'business',
      title: 'Business loan',
      summary: 'Flexible financing to support business expansion and day-to-day operations',
      image: '/images/home/product-5.png',
    },
    {
      slug: 'investment-loan',
      audience: 'business',
      title: 'Investment loan',
      summary: 'A long-term solution to finance investment and expansion projects',
      image: '/images/home/product-3.png',
    },
    {
      slug: 'purchase-loan',
      audience: 'business',
      title: 'Purchase loan',
      summary: 'A loan to finance the purchase of inventory and equipment',
      image: '/images/home/product-2.png',
    },
    {
      slug: 'green-business-loan',
      audience: 'business',
      title: 'Green business loan',
      summary: 'A loan for environmentally friendly, energy-saving business projects',
      image: '/images/home/product-3.png',
    },
    {
      slug: 'women-business-loan',
      audience: 'business',
      title: 'Loan for women entrepreneurs',
      summary: 'A loan with special terms to support the initiatives of women entrepreneurs',
      image: '/images/home/product-1.png',
    },
  ],
}
