// About page content — bilingual, locale-keyed (mn / en).
//
// Modelled as a typed data module (per the build brief: board members,
// milestones and value cards are repetitive bilingual data). Copy is pulled
// verbatim from the Figma `final` page (file Jy6iCHGx9nTqqT9nnQ6cE9, About nodes
// 1:12190–1:12444). Photos reuse the already-exported `fig-<hash>` assets so the
// 200 MB image set isn't duplicated. Consume via `useAboutContent()`, which
// reactively returns the active locale's content.
//
// Photos are served from `public/images/about/` (copies of the exported
// `fig-<hash>` assets) so @nuxt/image's IPX optimiser — which can't read
// Vite-bundled `~/assets` imports in dev — can resize/serve them.
const heroPhoto = '/images/about/hero.png'
const ceoPortrait = '/images/about/ceo.png' // Л.Цолмон is also board member #4

export interface BadgeBlock {
  badge: string
  heading: string
  body: string
}
export interface ValueItem {
  title: string
  body: string
  align: 'left' | 'center' | 'right'
}
export interface Milestone {
  year: string
  body: string
}
export interface BoardMember {
  name: string
  role: string
  bio: string
  photo: string
}

export interface AboutContent {
  hero: { headline: string; intro: string; photo: string }
  mission: { blocks: BadgeBlock[] }
  values: { heading: string; subheading: string; items: ValueItem[] }
  history: { heading: string; subheading: string; milestones: Milestone[] }
  ceo: {
    headingLead: string
    headingAccent: string
    subheading: string
    greetingTitle: string
    greetingBody: string[]
    tagline: string
    signatureLabel: string
    signatureName: string
    portrait: string
  }
  board: { headingLead: string; headingAccent: string; members: BoardMember[] }
  org: {
    headingLead: string
    headingAccent: string
    subheading: string
    root: string
    ceo: string
    departments: string[]
  }
}

const boardPhotos = [
  '/images/about/board-1.png', // Г. Бат-Эрдэнэ
  '/images/about/board-2.png', // Н.Энхболд
  '/images/about/board-3.png', // Б.Ганзориг
  ceoPortrait, // Л.Цолмон (same photo as the CEO)
  '/images/about/board-5.png', // Б.Баяртбилэг
  '/images/about/board-6.png', // Б.Мөнхбат
]

export const aboutContent: Record<'mn' | 'en', AboutContent> = {
  mn: {
    hero: {
      headline: 'Ирээдүйг ойртуулна. Өнөөдөрт шийдэл өгнө.',
      intro:
        '"Финко Капитал ББСБ" ХХК нь 2005 онд үүсгэн байгуулагдсан ба дэлхийн жишигт нийцсэн чанар, инновацийг нэвтрүүлэн хамгийн шинэлэг, шилдэг мэргэжлийн санхүүгийн үйлчилгээг хэрэглэгчдэдээ түргэн шуурхай хүргэх эрхэм зорилготойгоор үүсгэн байгуулагдсан санхүүгийн ууган компаниудын нэг юм. "Финко Капитал ББСБ" ХХК нь технологи, датад суурилсан шийдлээр хувь хүн болон бизнесийн бодит хэрэгцээнд нийцсэн санхүүгийн орчин үеийн үйлчилгээг хүргэх эрхэм зорилгын дор нэгдсэн хамт олон юм.',
      photo: heroPhoto,
    },
    mission: {
      blocks: [
        {
          badge: 'Эрхэм зорилго',
          heading: 'Таны санхүүгийн тогвортой ирээдүйг хамтдаа бүтээнэ',
          body: 'Бид бүтээлч хандлага, дижитал шийдэл, өөриймсөг сэтгэлгээ, мэргэжлийн үйлчилгээгээр хэрэглэгч бүрийн санхүүгийн хэрэгцээг шударга, хүртээмжтэй, хурдан, найдвартай хүргэнэ.',
        },
        {
          badge: 'Алсын хараа',
          heading: 'Бид эрүүл санхүүгийн экосистемийг бүтээнэ',
          body: 'Технологи болон инновацид тулгуурлан хэрэглэгч бүрт тогтвортой, хүртээмжтэй санхүүгийн шийдлийг хүргэнэ.',
        },
      ],
    },
    values: {
      heading: 'Бидний үнэт зүйл',
      subheading: 'Санхүүгийн шийдлийг нэг дор төвлөрүүлж, таны дараагийн өсөлтийг дэмжинэ.',
      items: [
        {
          title: 'Хэрэглэгч бол бидний ТӨВ цэг',
          body: 'Бид үйлчилгээ бүрээ хэрэглэгчийн бодит хэрэгцээ, зорилгод нийцүүлэн ухаалаг шийдлээр хүргэдэг.',
          align: 'left',
        },
        {
          title: 'Ирээдүйг өнөөдрөөс бүтээх сэтгэлгээ',
          body: 'Бид зөвхөн өнөөдрийнг биш, маргаашийн боломжийг хамтдаа бүтээдэг.',
          align: 'center',
        },
        {
          title: 'Ухаалаг шийдэл, бүтээлч сэтгэлгээ',
          body: 'Бид дата, алгоритм, инновацыг хослуулан хэрэглэгч бүрдээ тохирсон шийдэл санал болгодог',
          align: 'right',
        },
        {
          title: 'Дижитал хүртээмж',
          body: 'Хэрэглэгчийн туршлагыг хялбаршуулж, бүх үйлчилгээг хүссэн газраасаа, хүссэн үедээ авах боломжийг бүрдүүлнэ.',
          align: 'left',
        },
        {
          title: 'Итгэлцэл',
          body: 'Ил тод байдал, найдвартай систем, ёс зүйтэй технологид тулгуурлан урт хугацааны тогвортой, өсөлттэй харилцааг бий болгодог.',
          align: 'right',
        },
      ],
    },
    history: {
      heading: 'Түүхэн замнал',
      subheading:
        'Хэрэглэгч бол бидний төв. Бид тэдэнд найдвартай, инновацтай, ухаалаг шийдлүүдийг ил тод, итгэлцэлтэйгээр хүргэж, өнөөдөр болон маргаашийн өсөлтийг санхүүгийн боломжоор бүтээнэ.',
      milestones: [
        {
          year: '2005',
          body: 'Компани анх үүсгэн байгуулагдаж, Монголын ББСБ-ын салбарын анхдагч оролцогчдын нэг болон үйл ажиллагаагаа эхлүүлэв.',
        },
        {
          year: '2023',
          body: 'Компанийн стратеги болон брэндийн шинэчлэлийг хэрэгжүүлж, "Финко Капитал ББСБ" нэршилтэйгээр дижитал санхүүгийн шинэ үе шатаа эхлүүлэв.',
        },
        {
          year: '2024',
          body: 'Beep App -ийг зах зээлд нэвтрүүлж, богино хугацааны болон ажилтны онлайн зээлийн үйлчилгээг хэрэглэгчдэд хүргэв.',
        },
        {
          year: '2025',
          body: 'Жижиг, дунд бизнесийн санхүүжилтийн дижитал платформ болох FincoBiz-ийг нэвтрүүлж бизнесийн санхүүжилтийн үйл явцыг цахимжуулав.',
        },
        {
          year: '2025',
          body: 'Premium Nexus ХК -тай хамтран BeepCU Virtual Credit Card-ийг зах зээлд танилцуулж, embedded finance экосистемийг өргөжүүлэв.',
        },
        {
          year: '2026',
          body: 'Embedded finance-д суурилсан санхүүгийн үйлчилгээний хөгжүүлэлтийг өргөжүүлж, иргэн болон бизнесийн санхүүгийн экосистемийг нэг платформоор удирдах зорилтыг хэрэгжүүлж байна.',
        },
      ],
    },
    ceo: {
      headingLead: 'Гүйцэтгэх захирлын ',
      headingAccent: 'мэндчилгээ',
      subheading:
        'Хэрэглэгч бол бидний төв. Бид найдвартай, инновацтай, ухаалаг шийдлүүдийг ил тод, итгэлцэлтэйгээр хүргэж, өнөөдөр болон маргаашийн өсөлтийг хамтад нь бүтээдэг.',
      greetingTitle: 'Мэндчилгээ',
      greetingBody: [
        '2025 он Финкочууд бидний хувьд зөвхөн зээлийн багцын өсөлтийн жил байгаагүй, стратегийн чиглэлээ илүү тодорхой болгож, дижитал санхүүгийн шийдлүүдийг бодитоор хэрэгжүүлж эхэлсэн гарааны чухал үе байлаа. Бид технологид суурилсан санхүүгийн шийдлүүдийг хөгжүүлэхдээ зөвхөн бүтээгдэхүүн нэвтрүүлэхээс илүү хэрэглэгчийн өдөр тутмын амьдралыг хялбарчлах, бодит үнэ цэн бүтээхийг зорьж байна.',
        'Түүнчлэн бид хэрэглэгч, харилцагчдынхаа өмнө хүлээсэн хариуцлагатай байдлаа хадгалж компанийн засаглал, эрсдэлийн удирдлага, мэдээллийн аюулгүй байдлын чиглэлд олон улсын жишиг стандартуудыг тогтвортой хэрэгжүүлж, харилцагчидтайгаа хамтдаа урт хугацааны өсөлтийн сууриа бэхжүүлж байна. Итгэлцэл бол бидний хамгийн чухал үнэт зүйл бөгөөд бид харилцагч, түнш бүртэйгээ ил тод, хариуцлагатай хамтран ажиллахыг эрхэмлэдэг. Финко Капитал нь хэрэглэгчдийнхээ хэрэгцээг ойлгож, бодит үнэ цэн бүтээж тэдний амьдралд ойр санхүүгийн шийдлүүдийг тууштай хөгжүүлэн, тогтвортой өсөлтийг бүтээдэг байх болно. Та бүхнийхээ итгэл, хамтын ажиллагаанд дахин талархал илэрхийлье. Бид хамтдаа илүү ухаалаг, шинэлэг, өсөлттэй санхүүгийн ирээдүйг бүтээх болно.',
      ],
      tagline: 'Бүтээ, ирээдүйг зээгнэ…. Санхүүжүүлье.',
      signatureLabel: 'Гүйцэтгэх захирал:',
      signatureName: 'Л.Цолмон',
      portrait: ceoPortrait,
    },
    board: {
      headingLead: 'Төлөөлөн ',
      headingAccent: 'удирдах зөвлөл',
      members: [
        {
          name: 'Г. Бат-Эрдэнэ',
          role: 'ТУЗ-ын дарга',
          bio: 'Санхүүгийн чиглэлээр 20+ жилийн туршлагатай удирдагч. Премиум Корпорэйшн ХХК-ийн санхүүгийн стратеги, төсөвлөлт, эрсдэлийн удирдлагыг хариуцан ажиллаж байна.',
          photo: boardPhotos[0]!,
        },
        {
          name: 'Н.Энхболд',
          role: 'ТУЗ-ийн гишүүн',
          bio: 'Бизнес стратеги, хөрөнгө оруулалтын чиглэлээр 15+ жилийн туршлагатай. Вэйв Три Инвестмент Партнерс ХХК-ийн Гүйцэтгэх захирлаар ажиллаж байна.',
          photo: boardPhotos[1]!,
        },
        {
          name: 'Б.Ганзориг',
          role: 'ТУЗ-ийн гишүүн',
          bio: 'Стратегийн менежмент, бизнес хөгжлийн чиглэлээр өргөн туршлагатай. Вэйв Три Инвестмент Партнерс ХХК-д Гүйцэтгэх захирлаар ажилладаг.',
          photo: boardPhotos[2]!,
        },
        {
          name: 'Л.Цолмон',
          role: 'ТУЗ-ийн гишүүн',
          bio: 'Коммерс болон бизнес хөгжлийн чиглэлээр мэргэшсэн. Премиум Иннова ХХК-ийн Коммерс хариуцсан Захирлаар ажиллаж байна.',
          photo: boardPhotos[3]!,
        },
        {
          name: 'Б.Баяртбилэг',
          role: 'ТУЗ-ийн хараат бус гишүүн',
          bio: 'Бизнес стратеги, хөрөнгө оруулалтын чиглэлээр 15+ жилийн туршлагатай. Вэйв Три Инвестмент Партнерс ХХК-ийн Гүйцэтгэх захирлаар ажиллаж байна.',
          photo: boardPhotos[4]!,
        },
        {
          name: 'Б.Мөнхбат',
          role: 'ТУЗ-ийн хараат бус гишүүн',
          bio: 'Санхүүгийн чиглэлээр 20+ жилийн туршлагатай удирдагч. Премиум Корпорэйшн ХХК-ийн санхүүгийн стратеги, төсөвлөлт, эрсдэлийн удирдлагыг хариуцан ажиллаж байна.',
          photo: boardPhotos[5]!,
        },
      ],
    },
    org: {
      headingLead: 'Байгууллагын ',
      headingAccent: 'бүтэц',
      subheading:
        'Премиум Корпорэйшн ХХК-ийн бүтэц нь шуурхай шийдвэр гаргалт, өндөр хариуцлага, үр ашигтай үйл ажиллагааг хангахад зориулагдсан.',
      root: 'ТУЗ',
      ceo: 'Гүйцэтгэх захирал',
      departments: [
        'Борлуулалт үйл ажиллагааны газрын дарга',
        'Маркетинг, бизнес хөгжүүлэлтийн алба',
        'Техонологийн алба',
        'Санхүүгийн алба',
        'Эрсдэл компленсийн алба',
      ],
    },
  },

  en: {
    hero: {
      headline: 'Bringing the future closer. Delivering solutions today.',
      intro:
        '"Finco Capital NBFI" LLC was founded in 2005 as one of Mongolia\'s pioneering financial companies, established with the mission of bringing world-class quality and innovation to deliver the most modern, best-in-class professional financial services to its customers, quickly and reliably. Finco Capital NBFI LLC is a team united by the mission of delivering modern financial services tailored to the real needs of individuals and businesses through technology- and data-driven solutions.',
      photo: heroPhoto,
    },
    mission: {
      blocks: [
        {
          badge: 'Our mission',
          heading: 'Building your stable financial future, together',
          body: 'Through a creative approach, digital solutions, a sense of ownership and professional service, we deliver every customer\'s financial needs fairly, accessibly, quickly and reliably.',
        },
        {
          badge: 'Our vision',
          heading: 'We build a healthy financial ecosystem',
          body: 'Grounded in technology and innovation, we deliver stable, accessible financial solutions to every customer.',
        },
      ],
    },
    values: {
      heading: 'Our values',
      subheading: 'We bring financial solutions together in one place and power your next stage of growth.',
      items: [
        {
          title: 'The customer is our CENTRE',
          body: 'We tailor every service to the real needs and goals of our customers and deliver it through smart solutions.',
          align: 'left',
        },
        {
          title: 'Building the future from today',
          body: 'We build not only for today, but for tomorrow\'s opportunities, together.',
          align: 'center',
        },
        {
          title: 'Smart solutions, creative thinking',
          body: 'We combine data, algorithms and innovation to offer each customer a solution made for them.',
          align: 'right',
        },
        {
          title: 'Digital accessibility',
          body: 'We simplify the customer experience so every service can be accessed from anywhere, at any time.',
          align: 'left',
        },
        {
          title: 'Trust',
          body: 'Built on transparency, reliable systems and ethical technology, we create lasting, growing relationships.',
          align: 'right',
        },
      ],
    },
    history: {
      heading: 'Our journey',
      subheading:
        'The customer is our centre. We deliver reliable, innovative, smart solutions with transparency and trust, building today\'s and tomorrow\'s growth through financial opportunity.',
      milestones: [
        {
          year: '2005',
          body: 'The company was founded and began operations as one of the pioneering participants in Mongolia\'s NBFI sector.',
        },
        {
          year: '2023',
          body: 'We carried out a strategic and brand renewal and, under the name "Finco Capital NBFI", started a new chapter in digital finance.',
        },
        {
          year: '2024',
          body: 'We launched the Beep App, bringing short-term and employee online lending services to customers.',
        },
        {
          year: '2025',
          body: 'We introduced FincoBiz, a digital financing platform for SMEs, digitalising the business financing process.',
        },
        {
          year: '2025',
          body: 'Together with Premium Nexus JSC, we introduced the BeepCU Virtual Credit Card to the market, expanding the embedded finance ecosystem.',
        },
        {
          year: '2026',
          body: 'We are expanding the development of embedded finance services, delivering on the goal of managing the financial ecosystem for individuals and businesses on a single platform.',
        },
      ],
    },
    ceo: {
      headingLead: 'A message from the ',
      headingAccent: 'CEO',
      subheading:
        'The customer is our centre. We deliver reliable, innovative, smart solutions with transparency and trust, building today\'s and tomorrow\'s growth together.',
      greetingTitle: 'Greetings',
      greetingBody: [
        'For us at Finco, 2025 was not just a year of loan-portfolio growth — it was a pivotal starting point where we sharpened our strategic direction and began delivering digital financial solutions in earnest. In developing technology-driven financial solutions, our aim goes beyond launching products: we strive to simplify customers\' everyday lives and create real value.',
        'We also uphold our responsibility to customers and partners, consistently applying international standards in corporate governance, risk management and information security, and strengthening the foundation for long-term growth together with our customers. Trust is our most important value, and we are committed to working transparently and responsibly with every customer and partner. Finco Capital will understand its customers\' needs, create real value, and steadily develop financial solutions close to their lives to build sustainable growth. We once again thank you all for your trust and partnership. Together we will build a smarter, more innovative and growing financial future.',
      ],
      tagline: 'Let\'s build, finance the future.',
      signatureLabel: 'Chief Executive Officer:',
      signatureName: 'L. Tsolmon',
      portrait: ceoPortrait,
    },
    board: {
      headingLead: 'Board of ',
      headingAccent: 'directors',
      members: [
        {
          name: 'G. Bat-Erdene',
          role: 'Chairman of the Board',
          bio: 'A leader with 20+ years of experience in finance. Responsible for financial strategy, budgeting and risk management at Premium Corporation LLC.',
          photo: boardPhotos[0]!,
        },
        {
          name: 'N. Enkhbold',
          role: 'Board member',
          bio: '15+ years of experience in business strategy and investment. Serves as CEO of Wave Three Investment Partners LLC.',
          photo: boardPhotos[1]!,
        },
        {
          name: 'B. Ganzorig',
          role: 'Board member',
          bio: 'Broad experience in strategic management and business development. Works as CEO at Wave Three Investment Partners LLC.',
          photo: boardPhotos[2]!,
        },
        {
          name: 'L. Tsolmon',
          role: 'Board member',
          bio: 'Specialised in commerce and business development. Serves as Director of Commerce at Premium Innova LLC.',
          photo: boardPhotos[3]!,
        },
        {
          name: 'B. Bayartbileg',
          role: 'Independent board member',
          bio: '15+ years of experience in business strategy and investment. Serves as CEO of Wave Three Investment Partners LLC.',
          photo: boardPhotos[4]!,
        },
        {
          name: 'B. Munkhbat',
          role: 'Independent board member',
          bio: 'A leader with 20+ years of experience in finance. Responsible for financial strategy, budgeting and risk management at Premium Corporation LLC.',
          photo: boardPhotos[5]!,
        },
      ],
    },
    org: {
      headingLead: 'Organisational ',
      headingAccent: 'structure',
      subheading:
        'Premium Corporation LLC\'s structure is designed to ensure fast decision-making, high accountability and efficient operations.',
      root: 'Board',
      ceo: 'Chief Executive Officer',
      departments: [
        'Head of Sales & Operations',
        'Marketing & Business Development',
        'Technology Division',
        'Finance Division',
        'Risk & Compliance Division',
      ],
    },
  },
}
