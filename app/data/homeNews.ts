// Home news carousel data (Figma 1:14236). Bilingual; kept as a typed data file
// so the homepage carousel always has enough cards to page through.
export interface HomeNewsItem {
  slug: string
  title: string
  excerpt: string
  image: string
  to: string
}

export const homeNews: Record<'mn' | 'en', HomeNewsItem[]> = {
  mn: [
    {
      slug: 'women-business',
      title: 'Эмэгтэй бизнес эрхлэгчдэд зориулсан зээл',
      excerpt: 'Beep Wallet, FincoBiz болон зээлийн үйлчилгээг нэг дороос ашиглаж, санхүүгээ илүү хялбар удирдах боломж.',
      image: '/images/home/news-1.png',
      to: '/news',
    },
    {
      slug: 'investment-opportunities',
      title: 'Шинэчлэгдсэн хөрөнгө оруулалтын боломжууд',
      excerpt: 'Бизнесийн өсөлтийг дэмжих шинэ төсөл, хөрөнгө оруулалтуудын талаарх мэдээллийг цаг алдалгүй хүлээн авна уу.',
      image: '/images/home/news-2.png',
      to: '/news',
    },
    {
      slug: 'tech-startups',
      title: 'Технологийн салбар дахь гарааны бизнесүүд',
      excerpt: 'Орчин үеийн технологийн шийдлүүдээр дамжуулан зах зээлд амжилттай нэвтрэх бизнесүүдийн түүхийг танилцуулж байна.',
      image: '/images/home/news-3.png',
      to: '/news',
    },
    {
      slug: 'beep-update',
      title: 'Beep Wallet шинэ боломжуудтай боллоо',
      excerpt: 'Beep Wallet аппликейшн шинэчлэгдэж, илүү хялбар, шуурхай гүйлгээний боломжуудтай боллоо.',
      image: '/images/home/news-4.png',
      to: '/news',
    },
    {
      slug: 'health-campaign',
      title: 'Финко хамт олноо эрүүл мэндийн үзлэгт хамрууллаа',
      excerpt: 'Хамт олныхоо эрүүл мэндийг дэмжих зорилгоор бүрэн хэмжээний эрүүл мэндийн үзлэгийг зохион байгууллаа.',
      image: '/images/home/news-base.png',
      to: '/news',
    },
  ],
  en: [
    {
      slug: 'women-business',
      title: 'A loan for women entrepreneurs',
      excerpt: 'Use Beep Wallet, FincoBiz and loan services in one place to manage your finances more easily.',
      image: '/images/home/news-1.png',
      to: '/news',
    },
    {
      slug: 'investment-opportunities',
      title: 'Renewed investment opportunities',
      excerpt: 'Stay up to date on new projects and investments that support business growth.',
      image: '/images/home/news-2.png',
      to: '/news',
    },
    {
      slug: 'tech-startups',
      title: 'Startups in the technology sector',
      excerpt: 'We share the stories of businesses entering the market successfully through modern technology solutions.',
      image: '/images/home/news-3.png',
      to: '/news',
    },
    {
      slug: 'beep-update',
      title: 'Beep Wallet gains new capabilities',
      excerpt: 'The Beep Wallet app has been updated with easier, faster transaction capabilities.',
      image: '/images/home/news-4.png',
      to: '/news',
    },
    {
      slug: 'health-campaign',
      title: 'Finco gave its team a full health check-up',
      excerpt: 'We organised a full medical check-up to support the health and wellbeing of our team.',
      image: '/images/home/news-base.png',
      to: '/news',
    },
  ],
}
