export type LocalizedText = { en: string; ru: string };

export type PortfolioProject = {
  id: string;
  name: string;
  category: LocalizedText;
  description: LocalizedText;
  url: string;
  domainLabel: string;
  image: string;
  imageAlt: LocalizedText;
  highlights: { title: LocalizedText; description: LocalizedText }[];
};

// Add a new project here and put its screenshot under a new filename in public/portfolio.
// Cards on /work and /ru/work are generated from this list.
export const portfolioProjects: PortfolioProject[] = [
  {
    id: "by-alinkins-platform",
    name: "by.alinkins",
    category: {
      en: "01 / FITNESS & EDUCATION",
      ru: "01 / ФИТНЕС И ОБУЧЕНИЕ",
    },
    description: {
      en: "A connected platform for selling and delivering workout programs.",
      ru: "Платформа для продажи и ведения программ тренировок.",
    },
    url: "https://by-alinkins.com/",
    domainLabel: "by-alinkins.com",
    image: "/portfolio/alinkins-programs.png",
    imageAlt: {
      en: "by.alinkins workout programs catalogue with Hourglass Home and Deep Core",
      ru: "Каталог программ тренировок by.alinkins: Hourglass Home и Deep Core",
    },
    highlights: [
      {
        title: { en: "Public website", ru: "Сайт для посетителей" },
        description: {
          en: "A branded storefront introduces the creator, explains the programs and guides visitors to the right product.",
          ru: "Брендированный сайт знакомит с автором, объясняет программы и помогает выбрать подходящую.",
        },
      },
      {
        title: { en: "Payments & access", ru: "Оплата и доступ" },
        description: {
          en: "A confirmed purchase grants a customer access to their program.",
          ru: "После подтверждения оплаты покупатель получает доступ к своей программе.",
        },
      },
      {
        title: { en: "Personal accounts", ru: "Личные кабинеты" },
        description: {
          en: "Customers sign in to return to programs they have purchased.",
          ru: "Покупатели входят в кабинет и возвращаются к своим программам.",
        },
      },
    ],
  },
  {
    id: "by-alinkins-media-kit",
    name: "by.alinkins · Media kit",
    category: {
      en: "02 / CREATOR & BRAND PARTNERSHIPS",
      ru: "02 / АВТОРСКИЙ МЕДИА-КИТ",
    },
    description: {
      en: "A creator portfolio that gives potential partners the audience data, content examples and contact information they need.",
      ru: "Портфолио автора с данными об аудитории, примерами контента и контактами для потенциальных партнёров.",
    },
    url: "https://by-alinkins.space/",
    domainLabel: "by-alinkins.space",
    image: "/portfolio/media.png",
    imageAlt: {
      en: "Alina Timofeeva creator media kit",
      ru: "Медиа-кит автора Алины Тимофеевой",
    },
    highlights: [
      {
        title: { en: "Audience dashboard", ru: "Данные об аудитории" },
        description: {
          en: "Reach, engagement and audience demographics.",
          ru: "Охваты, вовлечённость и характеристики аудитории.",
        },
      },
      {
        title: { en: "Content galleries", ru: "Примеры контента" },
        description: {
          en: "Fitness, food and lifestyle work with links to original posts.",
          ru: "Примеры материалов о фитнесе, еде и образе жизни со ссылками на публикации.",
        },
      },
      {
        title: { en: "Collaboration path", ru: "Связь для сотрудничества" },
        description: {
          en: "A clear route from reviewing the creator to making contact.",
          ru: "Понятный путь от знакомства с автором до обсуждения сотрудничества.",
        },
      },
    ],
  },
  {
    id: "g-lab-studio",
    name: "G-lab",
    category: {
      en: "03 / DIGITAL STUDIO & PRACTICAL COURSE",
      ru: "03 / ВЕБ-СТУДИЯ И ПРАКТИЧЕСКИЙ КУРС",
    },
    description: {
      en: "A studio site that assembles itself as you scroll, with custom web services and a practical 16-lesson course.",
      ru: "Сайт веб-студии, который собирается при прокрутке, с услугами по созданию сайтов и практическим курсом из 16 уроков.",
    },
    url: "https://g-lab.agency/",
    domainLabel: "G-lab / Live site",
    image: "/portfolio/glab-current.png",
    imageAlt: {
      en: "G-lab homepage for custom website services and the 16-lesson course",
      ru: "Главная страница G-lab: создание сайтов и практический курс из 16 уроков",
    },
    highlights: [
      {
        title: { en: "A site that builds itself", ru: "Сайт, который собирается" },
        description: {
          en: "Type a business name to see its own sketch, then scroll as it goes from idea to wireframe, design and launch.",
          ru: "Введите название бизнеса — и увидите свой набросок, а при прокрутке он пройдёт путь от идеи до запуска.",
        },
      },
      {
        title: { en: "16 practical lessons", ru: "16 практических уроков" },
        description: {
          en: "A guided path from the first brief through building and publishing a website.",
          ru: "Пошаговый путь от первого брифа до создания и публикации сайта.",
        },
      },
      {
        title: { en: "Guided project brief", ru: "Форма заявки на проект" },
        description: {
          en: "A structured intake captures goals, features, timing, budget and contact details.",
          ru: "Поэтапная форма собирает цели, нужные функции, сроки, бюджет и контактные данные.",
        },
      },
    ],
  },
];
