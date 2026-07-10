import type { LandingMessages } from '@/i18n/messages/types';

/** Russian visitor landing copy. */
export const ruMessages: LandingMessages = {
  meta: {
    languageName: 'Русский',
    switchLanguage: 'Язык',
    closeLanguageMenu: 'Закрыть меню языка',
  },
  nav: {
    features: 'Возможности',
    howItWorks: 'Как это работает',
    pricing: 'Цена',
    faq: 'FAQ',
    getVybekiit: 'Получить VybeKiit',
    openMenu: 'Открыть меню',
    closeMenu: 'Закрыть меню',
  },
  footer: {
    rights: 'Все права защищены.',
    legal: 'Правовая информация',
    contact: 'Контакты',
    terms: 'Условия',
    privacy: 'Конфиденциальность',
  },
  hero: {
    eyebrow: 'Вы направляете. Агент строит.',
    headlineBefore: 'Запуститесь и получите ',
    headlineHighlight: 'первый платёж',
    headlineAfter: ' уже в первой сессии.',
    subheadBeforePrice:
      'Опишите продукт простыми словами. Агент подключает платежи, вход, базу данных и деплой для web, mobile и расширения браузера. Одна покупка, ',
    subheadAfterPrice: '.',
    primaryCta: 'Получить VybeKiit',
    trustMoR: 'Lemon Squeezy · Merchant of Record',
    trustRefund: 'дней на возврат',
    trustPlatforms: 'Web · Mobile · Extension',
    trustAria: 'Гарантии доверия',
  },
  builtWith: {
    note: 'вся эта посадочная страница сделана на VybeKiit',
  },
  techTrust: {
    agentsHeading: 'Работает с AI-агентами для кода, которыми вы уже пользуетесь',
    stackHeading: 'Собран на инструментах, которым вы уже доверяете',
  },
  operator: {
    heading: 'Один агент ведёт весь стек.',
    steps: [
      {
        id: 'plan',
        title: 'План',
        body: 'Превращает идею в понятный план и модель данных.',
      },
      {
        id: 'build',
        title: 'Сборка',
        body: 'Генерирует полное приложение для web, mobile и расширения.',
      },
      {
        id: 'wire',
        title: 'Связка',
        body: 'Подключает платежи, auth, базу и env-конфиг.',
      },
      {
        id: 'verify',
        title: 'Проверка',
        body: 'Запускает проверки, тесты и security-верификации.',
      },
      {
        id: 'live',
        title: 'Live',
        body: 'Деплоит всё. Вы онлайн уже в первой сессии.',
      },
    ],
  },
  problem: {
    problemLabel: 'ПРОБЛЕМА',
    problemHeading: 'Бойлерплейты всё равно оставляют вас один на один с хаосом.',
    problemBody: 'VybeKiit ведёт стек от края до края.',
    overviewTitle: 'Обзор',
    withoutBadge: 'Без VybeKiit',
    rows: [
      { id: 'payments', label: 'Платежи', value: 'Вручную' },
      { id: 'auth', label: 'Auth', value: 'Вручную' },
      { id: 'database', label: 'База', value: 'Вручную' },
      { id: 'deploy', label: 'Деплой', value: 'Вручную' },
      { id: 'you', label: 'Вы', value: 'Перегружены' },
    ],
  },
  solution: {
    solutionLabel: 'РЕШЕНИЕ',
    solutionHeading: 'Принимайте платежи уже в первой сессии.',
    solutionBody: 'Агент подключает платежи, обрабатывает webhooks и сразу даёт рабочий checkout.',
    toastLabel: 'Платёж получен',
    revenueLabel: 'Выручка',
    revenueDelta: '+27.4% к прошлым 7 дням',
  },
  platforms: {
    heading: 'Одна покупка. Web, mobile и расширение браузера.',
    subhead: 'Один агент. Ноль ручной «сантехники».',
    web: 'Web',
    mobile: 'Mobile',
    extension: 'Extension',
  },
  compare: {
    heading: 'Станьте software engineer, не становясь им.',
    subhead:
      'Другие киты отдают код и желают удачи. VybeKiit — агент, который строит, связывает и запускает за вас.',
    footnote:
      'Нужен глубокий multi-tenant B2B в день один (RBAC, admin, jobs)? MakerKit и Supastarter сильнее там. VybeKiit выигрывает, когда агент должен вести весь продукт, чтобы вам не читать код.',
    axes: {
      price: 'Цена',
      agentOperates: 'Агент строит за вас',
      plainLanguage: 'Только простой язык',
      updatesInstall: 'Обновления ставятся (без merge)',
      threePlatforms: 'Web + mobile + extension',
      taxesHandled: 'Налоги (MoR)',
    },
    coverage: {
      yes: 'Да',
      partial: 'Частично',
      no: 'Нет',
    },
  },
  pricing: {
    cadence: 'Один раз · ваше навсегда',
    savingsBefore: 'Экономия ',
    savingsAfter:
      '% против покупки web + mobile + extension по отдельности · Каждая покупка поднимает цену',
    bullets: [
      'AI Operator + Web + Mobile + Extension',
      'Все возможности. Без лимитов.',
      'Пожизненный доступ. Ваше навсегда.',
    ],
    refundBulletPrefix: '',
    refundBulletSuffix: ' дней гарантии возврата денег.',
    cta: 'Получить VybeKiit',
  },
  faq: {
    heading: 'Какой пакет брать?',
    items: [
      {
        id: 'which-package',
        question: 'Какой пакет мне выбрать?',
        answer:
          'Пакет один. Вы получаете полный кит: AI-оператор + web + mobile + расширение браузера за одну разовую покупку. Без тарифов, без upsell «pro», без выбора «только web» против «только mobile». Если сначала запускаете сайт, mobile и extension уже лежат готовыми, когда понадобятся.',
      },
      {
        id: 'vibe-coder',
        question: 'Я только общаюсь с AI-инструментами. Это для меня?',
        answer:
          'Да. VybeKiit сделан для vibe coders: вы описываете желаемое простыми словами, а агент планирует, строит, подключает платежи, проверяет и выводит в live. Не нужно читать код, чинить merge или учить DevOps. Если уже пользуетесь Claude Code, Cursor, Codex, Kiro или похожим инструментом, вы целевой покупатель.',
      },
      {
        id: 'best-for-non-technical',
        question: 'Какой SaaS-кит лучше, если я не разработчик?',
        answer:
          'VybeKiit — лучший выбор, когда агент должен вести весь продукт за вас. Другие киты отдают код и ждут разработчика в цикле. Если сами умеете шипить с пустого репо, хватит бесплатного open-source стартера. Если хотите «описал → первый платёж», берите VybeKiit.',
      },
      {
        id: 'only-need-web',
        question: 'Мне нужен только сайт. Всё равно брать полный кит?',
        answer:
          'Да. Цена — за весь кит, а web — стартовый путь. Mobile и расширение входят в ту же покупку, чтобы не платить снова, когда идея вырастет. Нет более дешёвого SKU «только web»: ценность в одном агенте на весь продукт, а не в куче полу-китов.',
      },
      {
        id: 'vs-shipfast-lovable',
        question: 'Чем это отличается от ShipFast, Lovable или MakerKit?',
        answer:
          'ShipFast и MakerKit отлично подходят разработчику, которому нужен boilerplate и который сам доведёт остальное. Lovable и похожие AI-билдеры хороши для быстрых UI-демо, но не для своего стека с платежами, обновлениями и тремя платформами. VybeKiit — выбор, когда нужна одна покупка, простой язык и агент, который реально шипит и поддерживает продукт.',
      },
      {
        id: 'price-worth-it',
        question: 'Почему $29, если другие киты стоят $199+?',
        answer:
          'Потому что продукт — один кит для vibe coders, а не стопка dev-инструментов по отдельности. Web + mobile + extension у конкурентов легко уходит за $600. VybeKiit собирает все три плюс AI-оператор за launch-цену $29 один раз, с 14-дневным возвратом, если не зайдёт.',
      },
      {
        id: 'claude-cursor-kiro',
        question: 'Работает ли с Claude Code, Cursor, Codex и Kiro?',
        answer:
          'Да. VybeKiit рассчитан на то, что ваш AI-инструмент — оператор: решает следующий шаг, выполняет его и проверяет результат перед продолжением. Берите агента, за которого уже платите. Нет привязки к чату одного вендора.',
      },
      {
        id: 'refund-risk',
        question: 'Что, если мне не подойдёт?',
        answer:
          'Есть 14 дней на возврат денег. Запрашиваете refund — доступ GitHub к private-репозиториям отзывается. Цель — ноль сожалений: пробуете флоу, смотрите, доведёт ли агент до live checkout, и оставляете только если это ваш способ собирать продукт.',
      },
      {
        id: 'taxes-payments',
        question: 'Мне самому заниматься sales tax и VAT?',
        answer:
          'Нет, если идёте дефолтным путём Lemon Squeezy. Lemon Squeezy — Merchant of Record и сам закрывает глобальный VAT и sales tax. Провайдера платежей можно сменить позже: кит устроен так, что агент подключает checkout в любом случае.',
      },
    ],
  },
  brand: {
    tagline: 'Чертёж для vibe coders. Шипьте проекты как настоящий software engineer.',
  },
};
