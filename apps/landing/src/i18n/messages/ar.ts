import type { LandingMessages } from '@/i18n/messages/types';

/** Arabic visitor landing copy (RTL). */
export const arMessages: LandingMessages = {
  meta: {
    languageName: 'العربية',
    switchLanguage: 'اللغة',
    closeLanguageMenu: 'إغلاق قائمة اللغة',
  },
  nav: {
    features: 'الميزات',
    howItWorks: 'كيف يعمل',
    pricing: 'السعر',
    faq: 'الأسئلة',
    getVybekiit: 'احصل على VybeKiit',
    openMenu: 'فتح القائمة',
    closeMenu: 'إغلاق القائمة',
  },
  footer: {
    rights: 'جميع الحقوق محفوظة.',
    legal: 'قانوني',
    contact: 'تواصل',
    terms: 'الشروط',
    privacy: 'الخصوصية',
  },
  hero: {
    eyebrow: 'أنت توجّه. الوكيل يبني.',
    headlineBefore: 'انطلق للبث، وخذ ',
    headlineHighlight: 'أول دفعة',
    headlineAfter: '، في الجلسة الأولى.',
    subheadBeforePrice:
      'صف منتجك بلغة بسيطة. الوكيل يربط المدفوعات وتسجيل الدخول وقاعدة البيانات والنشر عبر الويب والجوال وامتداد المتصفح. شراء واحد، ',
    subheadAfterPrice: '.',
    primaryCta: 'احصل على VybeKiit',
    trustMoR: 'Lemon Squeezy · Merchant of Record',
    trustRefund: 'يوم استرداد',
    trustPlatforms: 'Web · Mobile · Extension',
    trustAria: 'وعود الثقة',
  },
  builtWith: {
    note: 'صفحة الهبوط هذه كلها بُنيت باستخدام VybeKiit',
  },
  techTrust: {
    agentsHeading: 'يعمل مع وكلاء البرمجة بالذكاء الاصطناعي الذين تستخدمهم بالفعل',
    stackHeading: 'مبني بأدوات تثق بها بالفعل',
  },
  operator: {
    heading: 'وكيل واحد يشغّل المكدس بالكامل.',
    steps: [
      {
        id: 'plan',
        title: 'تخطيط',
        body: 'يحوّل فكرتك إلى خطة واضحة ونموذج بيانات.',
      },
      {
        id: 'build',
        title: 'بناء',
        body: 'يولّد التطبيق الكامل للويب والجوال والامتداد.',
      },
      {
        id: 'wire',
        title: 'ربط',
        body: 'يربط المدفوعات والمصادقة وقاعدة البيانات وإعدادات البيئة.',
      },
      {
        id: 'verify',
        title: 'تحقق',
        body: 'يشغّل الفحوصات والاختبارات وتحققات الأمان.',
      },
      {
        id: 'live',
        title: 'مباشر',
        body: 'ينشر كل شيء. تصبح مباشراً في الجلسة الأولى.',
      },
    ],
  },
  problem: {
    problemLabel: 'المشكلة',
    problemHeading: 'القوالب الجاهزة ما زالت تتركك وحدك مع الفوضى.',
    problemBody: 'VybeKiit يشغّل المكدس من الطرف إلى الطرف.',
    overviewTitle: 'نظرة عامة',
    withoutBadge: 'بدون VybeKiit',
    rows: [
      { id: 'payments', label: 'المدفوعات', value: 'يدوي' },
      { id: 'auth', label: 'المصادقة', value: 'يدوي' },
      { id: 'database', label: 'قاعدة البيانات', value: 'يدوي' },
      { id: 'deploy', label: 'النشر', value: 'يدوي' },
      { id: 'you', label: 'أنت', value: 'مرهق' },
    ],
  },
  solution: {
    solutionLabel: 'الحل',
    solutionHeading: 'استلم المدفوعات في جلستك الأولى.',
    solutionBody: 'الوكيل يربط المدفوعات ويعالج webhooks ويعطيك checkout يعمل فوراً.',
    toastLabel: 'تم استلام دفعة',
    revenueLabel: 'الإيرادات',
    revenueDelta: '+27.4% مقابل آخر 7 أيام',
  },
  platforms: {
    heading: 'شراء واحد. ويب وجوال وامتداد متصفح.',
    subhead: 'وكيل واحد. بلا سباكة يدوية.',
    web: 'ويب',
    mobile: 'جوال',
    extension: 'امتداد',
  },
  compare: {
    heading: 'كن مهندس برمجيات دون أن تصبح واحداً.',
    subhead:
      'الحزم الأخرى تعطيك كوداً وتتمنى لك الحظ. VybeKiit هو الوكيل الذي يبني ويربط ويُطلق من أجلك.',
    footnote:
      'تحتاج B2B متعدد المستأجرين عميقاً من اليوم الأول (RBAC، إدارة، jobs)؟ MakerKit و Supastarter أقوى هناك. VybeKiit يفوز عندما تريد الوكيل أن يشغّل المنتج كله فلا تقرأ الكود.',
    axes: {
      price: 'السعر',
      agentOperates: 'الوكيل يبني من أجلك',
      plainLanguage: 'لغة بسيطة فقط',
      updatesInstall: 'التحديثات تُثبَّت (بدون merge)',
      threePlatforms: 'ويب + جوال + امتداد',
      taxesHandled: 'الضرائب (MoR)',
    },
    coverage: {
      yes: 'نعم',
      partial: 'جزئي',
      no: 'لا',
    },
  },
  pricing: {
    cadence: 'ادفع مرة · ملكك مدى الحياة',
    savingsBefore: 'وفّر ',
    savingsAfter: '% مقابل شراء حزم ويب + جوال + امتداد منفصلة · كل عملية شراء ترفع السعر',
    bullets: [
      'AI Operator + ويب + جوال + امتداد',
      'كل الميزات. بلا حدود.',
      'وصول مدى الحياة. ملكك للأبد.',
    ],
    refundBulletPrefix: '',
    refundBulletSuffix: ' يوماً ضمان استرداد المال.',
    cta: 'احصل على VybeKiit',
  },
  faq: {
    heading: 'أي حزمة تختار؟',
    items: [
      {
        id: 'which-package',
        question: 'أي حزمة يجب أن أحصل عليها؟',
        answer:
          'هناك حزمة واحدة فقط. تحصل على المجموعة الكاملة: مشغّل AI + ويب + جوال + امتداد متصفح في شراء واحد لمرة واحدة. بلا مستويات، بلا upsell لـ «pro»، وبلا اختيار ويب فقط مقابل جوال فقط. إن أطلقت موقعاً أولاً، يبقى الجوال والامتداد جاهزين حين تحتاجهما.',
      },
      {
        id: 'vibe-coder',
        question: 'أتحدث فقط مع أدوات AI. هل هذا لي؟',
        answer:
          'نعم. VybeKiit مبني لـ vibe coders: تصف ما تريده بلغة بسيطة، والوكيل يخطط ويبني ويربط المدفوعات ويتحقق وينشر. لا حاجة لقراءة كود أو إصلاح merge أو تعلم DevOps. إن كنت تستخدم Claude Code أو Cursor أو Codex أو Kiro أو أداة مشابهة، فأنت المشتري المستهدف.',
      },
      {
        id: 'best-for-non-technical',
        question: 'ما أفضل مجموعة SaaS إن لم أكن مطوّراً؟',
        answer:
          'VybeKiit هو الأنسب عندما تريد الوكيل أن يشغّل المنتج كله من أجلك. الحزم الأخرى تعطيك كوداً وتفترض بقاء مطوّر في الحلقة. إن كنت تستطيع الإطلاق من مستودع فارغ وحدك، فقد يكفيك starter مجاني مفتوح المصدر. إن أردت «صِفْه → أول دفعة»، اختر VybeKiit.',
      },
      {
        id: 'only-need-web',
        question: 'أحتاج موقعاً فقط. هل أشتري المجموعة الكاملة؟',
        answer:
          'نعم. السعر للمجموعة كلها، والويب هو المسار الذي تبدأ منه. الجوال وامتداد المتصفح يأتيان في نفس الشراء حتى لا تدفع مرة أخرى حين تنمو فكرتك. لا يوجد SKU أرخص لـ «ويب فقط» لأن القيمة وكيل واحد يشغّل منتجاً كاملاً، لا كومة أنصاف حزم.',
      },
      {
        id: 'vs-shipfast-lovable',
        question: 'كيف يقارن بـ ShipFast أو Lovable أو MakerKit؟',
        answer:
          'ShipFast و MakerKit رائعان إن كنت مطوّراً تريد boilerplate وستوصل الباقي بنفسك. Lovable وبنّاؤو واجهات AI مشابهون رائعون لعروض UI سريعة، لا لامتلاك مكدس حقيقي بمدفوعات وتحديثات وثلاث منصات. VybeKiit هو الاختيار عندما تريد شراءً واحداً ولغة بسيطة ووكيلاً يطلق المنتج ويحافظ عليه فعلاً.',
      },
      {
        id: 'price-worth-it',
        question: 'لماذا $29 بينما حزم أخرى تكلف $199+؟',
        answer:
          'لأن المنتج مجموعة واحدة لـ vibe coders، لا كومة أدوات مطورين تُباع منفصلة. شراء ويب + جوال + امتداد من حزم منافسة قد يتجاوز $600. VybeKiit يجمع الثلاثة مع مشغّل الوكيل بسعر إطلاق $29 لمرة واحدة، مع 14 يوماً استرداداً إن لم يناسبك.',
      },
      {
        id: 'claude-cursor-kiro',
        question: 'هل يعمل مع Claude Code و Cursor و Codex و Kiro؟',
        answer:
          'نعم. صُمم VybeKiit بحيث تكون أداة البرمجة بالذكاء الاصطناعي لديك هي المشغّل: تقرر الخطوة التالية وتنفّذها وتتحقق من النتيجة قبل المتابعة. أحضر الوكيل الذي تدفع له بالفعل. لست مقيداً بواجهة محادثة بائع واحد.',
      },
      {
        id: 'refund-risk',
        question: 'ماذا لو لم يناسبني؟',
        answer:
          'لديك 14 يوماً لاسترداد المال. تطلب الاسترداد ويُلغى وصول GitHub للمستودعات الخاصة. الهدف صفر ندم: جرّب التدفق، وانظر إن كان الوكيل يصل بك إلى checkout حي، واحتفظ به فقط إن ناسب طريقة بنائك.',
      },
      {
        id: 'taxes-payments',
        question: 'هل أتعامل بنفسي مع ضريبة المبيعات و VAT؟',
        answer:
          'لا، إن استخدمت مسار Lemon Squeezy الافتراضي. Lemon Squeezy هو Merchant of Record فيتعامل مع VAT وضريبة المبيعات عالمياً نيابة عنك. يمكنك تبديل مزوّد المدفوعات لاحقاً؛ المجموعة مبنية بحيث يربط الوكيل checkout في أي حال.',
      },
    ],
  },
  brand: {
    tagline: 'المخطط لـ vibe coders. أطلق مشاريعك كمهندس برمجيات حقيقي.',
  },
};
