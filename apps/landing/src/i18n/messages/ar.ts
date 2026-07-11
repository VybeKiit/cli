import type { LandingMessages } from '@/i18n/messages/types';

/**
 * Arabic visitor landing copy (RTL).
 * Positioning: بنية جاهزة لوكلاء AI، مو «فلوس من أول محادثة».
 */
export const arMessages: LandingMessages = {
  meta: {
    languageName: 'العربية',
    switchLanguage: 'اللغة',
    closeLanguageMenu: 'إغلاق قائمة اللغة',
  },
  nav: {
    features: 'وش تحصل',
    howItWorks: 'كيف يشتغل',
    compare: 'مقارنة',
    pricing: 'كم السعر',
    faq: 'أسئلة',
    getVybekiit: 'خذ VybeKiit',
    openMenu: 'فتح القائمة',
    closeMenu: 'إغلاق القائمة',
  },
  footer: {
    rights: 'جميع الحقوق محفوظة.',
    legal: 'قانوني',
    contact: 'كلّمنا',
    compare: 'مقارنة الأدوات',
    brand: 'الهوية',
    terms: 'الشروط',
    privacy: 'الخصوصية',
  },
  hero: {
    eyebrow: 'بنية جاهزة لوكلاء AI',
    headlineBefore: 'من الفكرة ل ',
    headlineHighlight: 'منتج تقدر ترفعه أونلاين بجد',
    headlineAfter: '.',
    subheadBeforePrice:
      'قاعدة كود جاهزة لوكلاء AI، مع الأساسيات اللي غالباً توقف المشاريع قبل الإطلاق: دخول، قاعدة بيانات، دفع، إيميلات، لوحة تحكم، مراقبة ونشر، كلها مربوطة بهيكل واضح. دفع مرة واحدة، ',
    subheadAfterPrice: '.',
    primaryCta: 'خذ VybeKiit',
    trustMoR: 'دفع آمن عبر Lemon Squeezy',
    trustRefund: 'يوم استرجاع',
    trustPlatforms: 'وصول طول العمر',
    trustAria: 'وعود الثقة',
  },
  geoLead: {
    ariaLabel: 'تعريف المنتج',
    brandStrong: 'VybeKiit',
    beforePrice: ' — حزمة لمرة واحدة بـ ',
    afterPrice:
      ' لوكلاء البرمجة: كود تملكه مع دخول وقاعدة بيانات ودفع وإيميل وويب + موبايل + إضافة.',
    compareLink: 'قارن الحزم',
    midLinks: ' · ',
    foundersLink: 'لمؤسسين غير تقنيين',
    andWord: ' · ',
    vibeLink: 'SaaS للـ vibe coding',
    end: '',
  },
  builtWith: {
    note: 'صفحة الهبوط هذي كلها انبنت بـ VybeKiit',
  },
  techTrust: {
    agentsHeading: 'يشتغل مع أدوات الـ AI اللي تستخدمها أصلاً',
    stackHeading: 'مبني بتقنيات معروفة. الكود يبقى عندك.',
  },
  operator: {
    heading: 'أنت تحدد المنتج. الوكيل يركّبه.',
    steps: [
      {
        id: 'plan',
        title: 'وصف الفكرة',
        body: 'اشرح للوكيل وش يسوي المنتج، مين المستخدمين، ووش يحتاجون يسونه. ما تحتاج وثيقة تقنية.',
      },
      {
        id: 'build',
        title: 'يختار قطع جاهزة',
        body: 'الوكيل ياخذ من اللي موجود في VybeKiit: دخول، قاعدة بيانات، دفع، إيميل، مستخدمين، لوحة، إعدادات، تحليلات، مراقبة ونشر.',
      },
      {
        id: 'wire',
        title: 'يربطه بمنتجك',
        body: 'يعدّل النماذج والشاشات والإجراءات على فكرتك، بدل ما يبني كل ميزة من صفحة فاضية.',
      },
      {
        id: 'verify',
        title: 'فحص قبل الإطلاق',
        body: 'الهيكل يسهّل على الوكيل فحص المسارات المهمة، الصلاحيات، الدفع والإجراءات الحساسة. لسا لازم تمرّ على المنتج قبل ناس حقيقيين. VybeKiit يقلل الشغل. ما يستبدل حكمك.',
      },
      {
        id: 'live',
        title: 'أونلاين وتكمّل',
        body: 'تنشر على مزوّدين مدعومين وتكمّل على نفس الأساس بعد الإطلاق.',
      },
    ],
  },
  vibeStory: {
    label: 'الواقع',
    heading: 'الفايب كودينج ممتاز للبداية. الإطلاق هو الجزء الصعب.',
    lead: 'AI يقدر يبني أول شاشة بسرعة. لما المشروع يحتاج ناس حقيقيين، دفع، صلاحيات، بيانات خاصة، ونشر ثابت، تبدأ الأسئلة الثقيلة. كثير مشاريع توقف هنا. مو لأن الفكرة سيئة، بل لأن كل جزء يحتاج ربط وقرارات هيكل وفحوصات الوكيل ما يسويها صح دايماً من صفحة فاضية.',
    stages: [
      {
        id: 'magic',
        title: 'وين يعيش المستخدمين والبيانات؟',
        body: 'مين يدخل، وش يتخزن، ومين يشوف وش.',
      },
      {
        id: 'mess',
        title: 'كيف الدفع يشتغل فعلياً؟',
        body: 'صفحة دفع، مين دفع، webhooks، والوصول بعد الدفع.',
      },
      {
        id: 'paste',
        title: 'كيف تحمي الأجزاء الحساسة؟',
        body: 'صفحات محمية، أسرار، وإعدادات بيئة بدون تسريب مفاتيح.',
      },
      {
        id: 'stall',
        title: 'كيف ترفع وتبقى أونلاين؟',
        body: 'نشر بدون كسر، وتنبيه لما شيء ينهار بعد الإطلاق.',
      },
    ],
    bottomLine:
      'VybeKiit ما يستبدل وكيل الـ AI. يعطيه القطع والهيكل والتعليمات عشان يبني منتج حقيقي بدون ما يخترع كل البنية من جديد.',
    softCta:
      'تخمين أقل. ربط مكسور أقل. فجوة أصغر بين اللي طلبته واللي الوكيل بناه. أنت على الفكرة والمستخدمين. الوكيل يبني على أساس ثابت.',
    cta: 'خذ VybeKiit',
  },
  problem: {
    problemLabel: 'قبل VybeKiit',
    problemHeading: 'من صفحة فاضية، الوكيل يخترع الأساس من جديد كل مرة.',
    problemBody:
      'هيكل المشروع، الدخول، الدفع، webhooks، قاعدة البيانات، حماية الإجراءات، النشر والفحوصات تصير قرارات جديدة. كل قرار يقدر يضيف طبقة، dependency، ومكان ثاني ينكسر.',
    overviewTitle: 'من الصفر',
    withoutBadge: 'بداية فاضية',
    rows: [
      { id: 'payments', label: 'الدفع', value: 'من صفر' },
      { id: 'auth', label: 'الدخول', value: 'إعداد جديد' },
      { id: 'database', label: 'قاعدة البيانات', value: 'من صفر' },
      { id: 'deploy', label: 'النشر', value: 'يدوي' },
      { id: 'you', label: 'أنت', value: 'تخمّن' },
    ],
  },
  solution: {
    solutionLabel: 'مع VybeKiit',
    solutionHeading: 'الميزات الأساسية جاهزة ومبنية مسبقاً.',
    solutionBody:
      'الوكيل يبدأ من هيكل ثابت، يستخدم ميزات جاهزة، ويركّز على اللي يميّز منتجك. دفع مربوط، مسارات واضحة، وتقدر تكمّل بعد الإطلاق.',
    toastLabel: 'تم استلام دفعة',
    revenueLabel: 'الإيرادات',
    revenueDelta: '+27.4% مقابل آخر 7 أيام',
  },
  zigZag: {
    auth: {
      label: 'شاشة الدخول',
      heading: 'تسجيل الدخول صفحة منتج جاهزة، مو prompt فاضي.',
      body: 'Google OAuth، رابط بالإيميل، وجلسة. الوكيل يعدّل الشاشة. ما تبني auth من الصفر كل مشروع.',
      welcomeBack: 'مرحباً بعودتك',
      signInSubtitle: 'ادخل لمساحة عملك',
      googleCta: 'كمّل مع Google',
      orEmail: 'أو إيميل',
      emailPlaceholder: 'you@studio.com',
      magicLink: 'دخول برابط الإيميل',
      signingIn: 'جاري الدخول مع Google…',
      successTitle: 'أنت داخل',
      successBody: 'الجلسة جاهزة. الصفحات المحمية تنفتح بعدين.',
      signedInAs: 'ava@studio.com',
    },
    settings: {
      label: 'شاشة الإعدادات',
      heading: 'إعدادات مستخدم الناس تتوقعها من أول يوم.',
      body: 'ملف، أمان، فوترة، وفريق جاهزين كمسار. الوكيل يملأ حقولك. مو اختراع منطقة الحساب من الصفر.',
      navProfile: 'الملف',
      navSecurity: 'الأمان',
      navBilling: 'الفوترة',
      navTeam: 'الفريق',
      userName: 'Ava Stone',
      userEmail: 'ava@studio.com',
      nameLabel: 'الاسم',
      roleLabel: 'الدور',
      roleValue: 'مصممة منتج',
      darkMode: 'الوضع الداكن',
      darkModeHint: 'حسب النظام أو يدوياً',
      saveCta: 'حفظ التغييرات',
      saved: 'تم الحفظ',
      readyBadge: 'جاهز',
    },
    race: {
      label: 'سباق البناء',
      heading: 'نفس الـ vibe coder. خط بداية مختلف.',
      body: 'بدون أساس، الفايب كودينج غالباً يركض قدام بعدين يعلق على الدفع والتكاملات. مع VybeKiit البداية أبطأ، لكن المسار يوصل للنهاية.',
      withoutTitle: 'بدون VybeKiit',
      withTitle: 'مع VybeKiit',
      building: 'يبني',
      stuck: 'علق',
      finished: 'أونلاين',
      steps: [
        'أول شاشات شكلها جاهز',
        'دخول وجلسات',
        'دفع وتكاملات',
        'حماية الإجراءات الحساسة',
        'نشر والبقاء أونلاين',
      ],
    },
  },
  platforms: {
    heading: 'أساس واحد لثلاثة أنواع منتجات',
    subhead: 'مو كل الميزات متطابقة على كل منصة. VybeKiit يعطي أساس مشترك وأمثلة لكل بيئة.',
    web: 'موقع',
    mobile: 'جوال',
    extension: 'إضافة',
    mockOverview: 'نظرة عامة',
    mockTransactions: 'المعاملات',
    mockCustomers: 'العملاء',
    mockActive: 'نشط',
    mockRefunds: 'المسترجعات',
    mockRevenueDelta: '+27.4% مقابل آخر 7 أيام',
  },
  pageRecipes: {
    headline: '{readyCount}+ شاشة منتج جاهزة الوكيل يقدر ياخذها ويعدّلها',
    badge: 'يزيد مع الوقت · شراء واحد لإصدارات الرخصة',
    body: 'مو بس مكونات مفككة. مسارات كاملة: onboarding، دخول، لوحة، أسعار، دفع، طلبات، عملاء، تحليلات، مساعد AI، إعدادات، فريق، admin، فوترة وأكثر. شاشات جديدة تكمّل تجي بعد الشراء.',
    catalogLabel: 'كتالوج الشاشات الكامل · {count} صفحة',
    catalogAria: 'كتالوج شاشات المنتج المدمجة',
    readyBadge: 'جاهز',
  },
  checkout: {
    titlePrefix: 'خذ VybeKiit',
    description: 'اكتب حساب GitHub اللي بنعزمه، بعدين كمّل للدفع الآمن. الوصول ينفتح لما الدفع يمر.',
    bulletFull: 'كود المصدر، تعليمات للوكلاء، أساس Web + Mobile + إضافة',
    bulletOnce: 'سعر مرة واحدة، مو اشتراك',
    bulletRefund: 'نافذة استرجاع: {days} يوم',
    githubLabel: 'اسم مستخدم GitHub',
    githubPlaceholder: 'octocat',
    githubError: 'أدخل اسم GitHub صالح (حروف، أرقام، شرطات مفردة).',
    emailLabel: 'البريد',
    emailPlaceholder: 'you@example.com',
    emailError: 'أدخل بريداً صالحاً.',
    submit: 'كمّل للدفع',
    secureNote: 'دفع آمن عبر Lemon Squeezy.',
    refundNote: 'تقدر تطلب استرجاع خلال {days} يوم حسب شروط الاسترجاع.',
  },
  compare: {
    heading: 'مو مولّد تطبيقات. أساس جاهز مليان ميزات لوكيلك.',
    subhead:
      'أدوات مثل Lovable تبني داخل منصة مُدارة. الـ starters التقليدية تعطيك كود ولسا تحتاج تفهمه وتربطه. VybeKiit في الوسط: الكود عندك، الوكيل يسوي أغلب الربط، الهيكل والميزات الأساسية جاهزة، ومو مربوط بمحرر أو استضافة واحدة.',
    footnote:
      'تحتاج منتج ثقيل لفرق بصلاحيات قوية من أول يوم؟ MakerKit و Supastarter أقوى هناك. VybeKiit لمن يبني بـ AI وما يبي كل مشروع يصير تجربة جديدة في الأمان والدفع والبنية.',
    optionColumn: 'الخيار',
    youBadge: 'أنت',
    axes: {
      price: 'السعر',
      agentOperates: 'الوكيل يبدأ من أساس جاهز',
      plainLanguage: 'تعليمات واضحة للوكيل',
      updatesInstall: 'هيكل ثابت للتحديثات',
      threePlatforms: 'أساس موقع + جوال + إضافة',
      taxesHandled: 'ضريبة الشراء متكفلة (MoR)',
    },
    coverage: {
      yes: 'نعم',
      partial: 'جزئي',
      no: 'لا',
    },
  },
  pricing: {
    cadence: 'ادفع مرة · ملكك طول العمر',
    savingsBefore: 'وفّر ',
    savingsAfter: '% مقابل شراء حزم موقع + جوال + إضافة منفصلة · كل شراء يرفع السعر',
    bullets: [
      'كود المصدر + تعليمات لوكلاء AI',
      'أساس Web و Mobile وإضافة المتصفح',
      'دخول، دفع، قاعدة بيانات، إيميل، لوحة، 46+ شاشة',
    ],
    refundBulletPrefix: '',
    refundBulletSuffix: ' يوم استرجاع فلوس.',
    cta: 'خذ VybeKiit',
  },
  faq: {
    heading: 'أسئلة شائعة',
    items: [
      {
        id: 'best-non-technical',
        question: 'ما أفضل SaaS boilerplate لمؤسس غير تقني؟',
        answer:
          'الأنسب هو أساس يستطيع وكيل البرمجة تشغيله دون إجبارك على حل تعارضات git أو اختراع تسجيل الدخول والمدفوعات. VybeKiit مصمم لذلك: كود تملكه، تعليمات للوكيل، 29$ مرة واحدة، Lemon Squeezy كـ Merchant of Record افتراضياً، وأساسات web وmobile وextension. مجموعات مثل ShipFast وMakerKit وSupastarter أفضل إن كنت أو مطوّراً تستأجره تقرآن الكود يومياً.',
      },
      {
        id: 'boilerplate-vs-lovable',
        question: 'ما الفرق بين SaaS boilerplate ومنشئ تطبيقات AI بدون كود مثل Lovable؟',
        answer:
          'الـ boilerplate يمنحك كوداً تملكه وأساسات منتج (تسجيل دخول، قاعدة بيانات، مدفوعات) تستضيفها وتُبقيها. منشئ AI بدون كود يولّد داخل منصة مُدارة. VybeKiit boilerplate مع تعليمات لـ Claude Code أو Cursor أو Codex.',
      },
      {
        id: 'taxes-vat',
        question: 'أي SaaS boilerplate يتعامل مع الضرائب وVAT نيابة عني؟',
        answer:
          'VybeKiit يعتمد Lemon Squeezy كـ Merchant of Record افتراضياً حتى تُدار ضرائب/VAT بيع البرمجيات عبر الـ MoR. Shipped.club أيضاً يعتمد Lemon Squeezy افتراضياً. مجموعات أخرى قد تعرض MoR اختيارياً. الاستضافة وقاعدة البيانات والبريد وAI قد تُفوتر منفصلة.',
      },
      {
        id: 'claude-cursor',
        question: 'أي SaaS boilerplate يعمل أفضل مع Claude Code وCursor؟',
        answer:
          'VybeKiit يوفّر هيكل مشروع وتعليمات يقرأها الوكيل من المستودع. غير مقيد بنموذج أو محرر واحد.',
      },
      {
        id: 'three-platforms',
        question: 'أي SaaS boilerplate يشمل web وmobile وامتداد متصفح؟',
        answer:
          'VybeKiit يشمل web (Next.js) وmobile (Expo) وextension (WXT) في شراء واحد. معظم المنافسين web فقط. يمكنك استخدام جزء الويب أولاً.',
      },
      {
        id: 'cheapest',
        question: 'ما أرخص SaaS boilerplate كامل مع دعم الوكلاء؟',
        answer:
          'Open SaaS مجاني إن قبلت مكدس Wasp وتشغيله بنفسك. بين المجموعات المدفوعة الموجّهة للوكلاء، VybeKiit بسعر 29$ مرة واحدة عند الإطلاق لثلاث واجهات وتعليمات. الخدمات الخارجية قد تُحاسب حسب الاستخدام.',
      },
      {
        id: 'shipfast-2026',
        question: 'هل ShipFast يستحق في 2026 أم هناك بديل أفضل لـ vibe coders؟',
        answer:
          'ShipFast ما زال مناسباً للمطوّرين الذين يريدون boilerplate ويب مثبتاً ومجتمعاً كبيراً. لمن يريد وكيلاً يشغّل البناء وثلاث منصات وMoR افتراضي، VybeKiit البديل الأقوى.',
      },
      {
        id: 'boilerplate-vs-scratch',
        question: 'أستخدم SaaS boilerplate أم أبني من الصفر مع AI؟',
        answer:
          'استخدم boilerplate عندما تحتاج تسجيل دخول ومدفوعات وبيانات دون إعادة اختراعها في كل محادثة. ابنِ من الصفر فقط إن أردت حرية معمارية كاملة. الوكلاء يضاعفون جودة الأساس الذي تعطيه لهم.',
      },
      {
        id: 'refund',
        question: 'ماذا لو لم يناسبني VybeKiit؟',
        answer:
          'يمكنك طلب استرداد خلال 14 يوماً من الشراء وفق شروط الاسترداد. يُلغى الوصول إلى مواد المشروع الخاصة عند الاسترداد.',
      },
      {
        id: 'safe-production',
        question: 'هل هذا آمن للإنتاج؟',
        answer:
          'المجموعة تتبع ممارسات هندسية شائعة وتعطي أساساً أكثر تنظيماً من كود عشوائي. الأمان النهائي يعتمد على تغييراتك والمزوّدين والصلاحيات والفحوصات. للأنظمة الطبية أو المالية أو الحساسة جداً، اطلب مراجعة أمنية احترافية.',
      },
    ],
  },
  brand: {
    tagline: 'بنية جاهزة لمنتجات تُبنى مع AI.',
  },
};
