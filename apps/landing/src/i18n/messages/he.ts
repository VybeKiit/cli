import type { LandingMessages } from '@/i18n/messages/types';

/**
 * Hebrew visitor landing copy (RTL).
 * Positioning: תשתית מוכנה לסוכני AI. לא “כסף בשיחה הראשונה”.
 */
export const heMessages: LandingMessages = {
  meta: {
    languageName: 'עברית',
    switchLanguage: 'שפה',
    closeLanguageMenu: 'סגור תפריט שפות',
  },
  nav: {
    features: 'מה מקבלים',
    howItWorks: 'איך זה עובד',
    compare: 'השוואה',
    pricing: 'כמה זה עולה',
    faq: 'שאלות',
    getVybekiit: 'קחו את VybeKiit',
    openMenu: 'פתח תפריט',
    closeMenu: 'סגור תפריט',
  },
  footer: {
    rights: 'כל הזכויות שמורות.',
    legal: 'משפטי',
    contact: 'דברו איתנו',
    compare: 'השוואת ערכות',
    brand: 'מותג',
    terms: 'תנאים',
    privacy: 'פרטיות',
  },
  hero: {
    eyebrow: 'תשתית מוכנה לסוכני AI',
    headlineBefore: 'מהרעיון ל ',
    headlineHighlight: 'מוצר שאפשר באמת להעלות לאוויר',
    headlineAfter: '',
    subheadBeforePrice:
      'ערכת קוד מוכנה לסוכני AI, עם התשתיות שבדרך כלל עוצרות פרויקטים לפני ההשקה: כניסה למשתמשים, מסד נתונים, תשלומים, אימיילים, דשבורד, ניטור ופריסה כבר מחוברים במבנה מסודר. תשלום חד־פעמי, ',
    subheadAfterPrice: '.',
    primaryCta: 'קחו את VybeKiit',
    trustMoR: 'תשלום מאובטח דרך Lemon Squeezy',
    trustRefund: 'ימי החזר',
    trustPlatforms: 'גישה לכל החיים',
    trustAria: 'הבטחות אמון',
  },
  geoLead: {
    ariaLabel: 'הגדרת המוצר',
    brandStrong: 'VybeKiit',
    beforePrice: ' — ערכה חד־פעמית ב־',
    afterPrice:
      ' לסוכני קוד: קוד בבעלותכם עם התחברות, מסד נתונים, תשלומים, אימייל, ואתר + מובייל + תוסף.',
    compareLink: 'השוואת ערכות',
    midLinks: ' · ',
    foundersLink: 'למייסדים לא־טכניים',
    andWord: ' · ',
    vibeLink: 'SaaS לווייב קודינג',
    end: '',
  },
  builtWith: {
    note: 'כל עמוד הנחיתה הזה נבנה עם VybeKiit',
  },
  techTrust: {
    agentsHeading: 'עובד עם כלי ה־AI שאתם כבר משתמשים בהם',
    stackHeading: 'נבנה עם טכנולוגיות מוכרות. הקוד נשאר אצלכם.',
  },
  operator: {
    heading: 'אתם מגדירים את המוצר. הסוכן מרכיב אותו.',
    steps: [
      {
        id: 'plan',
        title: 'מתארים את הרעיון',
        body: 'מסבירים לסוכן מה המוצר עושה, מי המשתמשים ומה הם צריכים לבצע. בלי מסמך טכני ובלי לבחור ארכיטקטורה לבד.',
      },
      {
        id: 'build',
        title: 'הסוכן בוחר חלקים מוכנים',
        body: 'הוא משתמש בתשתיות ובמסכים שכבר קיימים: התחברות, מסד נתונים, תשלומים, אימיילים, ניהול משתמשים, דשבורד, הגדרות, אנליטיקה, ניטור ופריסה.',
      },
      {
        id: 'wire',
        title: 'מחברים את המוצר שלכם',
        body: 'הסוכן מתאים מודלים, מסכים ופעולות לרעיון שלכם, במקום להתחיל כל פיצ׳ר מאפס.',
      },
      {
        id: 'verify',
        title: 'בודקים לפני ההשקה',
        body: 'המבנה מקל על הסוכן לבדוק זרימות מרכזיות, הרשאות, תשלומים ופעולות חשובות. עדיין מומלץ לעבור על המוצר לפני משתמשים אמיתיים. VybeKiit מצמצם עבודה. הוא לא מחליף שיקול דעת.',
      },
      {
        id: 'live',
        title: 'מעלים לאוויר',
        body: 'פורסים לספקים נתמכים וממשיכים לעבוד עם אותו בסיס גם אחרי ההשקה.',
      },
    ],
  },
  vibeStory: {
    label: 'המציאות',
    heading: 'וייב קודינג מתחיל מהר. להשיק זה החלק הקשה.',
    lead: 'AI בונה מסך ראשון בדקות. משתמשים אמיתיים, תשלומים, הרשאות והעלאה לאוויר עוצרים את רוב הפרויקטים — לא הרעיון, הבסיס החסר.',
    stages: [
      {
        id: 'magic',
        title: 'משתמשים ומידע?',
        body: 'מי נכנס, מה נשמר, מי רואה מה.',
      },
      {
        id: 'mess',
        title: 'תשלומים כמו שצריך?',
        body: 'דף תשלום, webhooks, גישה אחרי תשלום.',
      },
      {
        id: 'paste',
        title: 'חלקים רגישים מוגנים?',
        body: 'עמודים מוגנים וסודות, בלי לדלוף מפתחות.',
      },
      {
        id: 'stall',
        title: 'מעלים ונשארים באוויר?',
        body: 'פריסה נקייה וזיהוי תקלה כשמשהו נשבר.',
      },
    ],
    bottomLine:
      'VybeKiit לא מחליף את הסוכן. הוא נותן לו בסיס מוכן, כדי שיבנה מוצר — לא תשתית מאפס.',
    softCta: 'אתם ברעיון ובמשתמשים. הסוכן בונה על בסיס יציב.',
    cta: 'קחו את VybeKiit',
  },
  problem: {
    problemLabel: 'לפני VybeKiit',
    problemHeading: 'מדף ריק, הסוכן ממציא את התשתית מחדש בכל פרויקט.',
    problemBody:
      'התחברות, תשלומים, נתונים, פריסה ובדיקות מתחילים כניחוש. כל חלק הוא עוד מקום שיכול להישבר.',
    overviewTitle: 'התחלה מאפס',
    withoutBadge: 'בלי בסיס',
    rows: [
      { id: 'payments', label: 'תשלומים', value: 'מאפס' },
      { id: 'auth', label: 'התחברות', value: 'התקנה חדשה' },
      { id: 'database', label: 'מסד נתונים', value: 'מאפס' },
      { id: 'deploy', label: 'פריסה', value: 'ידני' },
      { id: 'you', label: 'אתם', value: 'מנחשים' },
    ],
  },
  solution: {
    solutionLabel: 'עם VybeKiit',
    solutionHeading: 'הפיצ׳רים המרכזיים כבר מובנים.',
    solutionBody:
      'הסוכן מתחיל ממבנה עקבי, משתמש בעשרות פיצ׳רים מוכנים, ומתמקד במה שמיוחד במוצר שלכם. תשלומים מחוברים, זרימות ברורות, ואפשר להמשיך לפתח גם אחרי ההשקה.',
    toastLabel: 'התקבל תשלום',
    revenueLabel: 'הכנסות',
    revenueDelta: '+27.4% מול 7 הימים האחרונים',
  },
  zigZag: {
    auth: {
      label: 'מסך התחברות',
      heading: 'כניסה היא כבר עמוד מוצר אמיתי, לא prompt ריק.',
      body: 'Google OAuth, קישור במייל, וסשן מחובר. הסוכן מתאים את המסך. אתם לא בונים auth מאפס בכל פרויקט.',
      welcomeBack: 'ברוכים השבים',
      signInSubtitle: 'התחברות לסביבת העבודה',
      googleCta: 'המשיכו עם Google',
      orEmail: 'או אימייל',
      emailPlaceholder: 'you@studio.com',
      magicLink: 'התחברות בקישור למייל',
      signingIn: 'מתחברים עם Google…',
      successTitle: 'אתם בפנים',
      successBody: 'הסשן מוכן. עמודים מוגנים נפתחים אחרי זה.',
      signedInAs: 'ava@studio.com',
    },
    settings: {
      label: 'מסך הגדרות',
      heading: 'הגדרות משתמש שאנשים מצפים להן ביום הראשון.',
      body: 'פרופיל, אבטחה, חיוב וצוות כבר מחוברים כזרימה. הסוכן ממלא את השדות שלכם. בלי להמציא את אזור החשבון מאפס.',
      navProfile: 'פרופיל',
      navSecurity: 'אבטחה',
      navBilling: 'חיוב',
      navTeam: 'צוות',
      userName: 'Ava Stone',
      userEmail: 'ava@studio.com',
      nameLabel: 'שם לתצוגה',
      roleLabel: 'תפקיד',
      roleValue: 'מעצבת מוצר',
      darkMode: 'מצב כהה',
      darkModeHint: 'לפי המערכת או בחירה ידנית',
      saveCta: 'שמירת שינויים',
      saved: 'נשמר',
      readyBadge: 'מוכן',
    },
    race: {
      label: 'מרוץ הבנייה',
      heading: 'אותו vibe coder. קו התחלה אחר.',
      body: 'בלי בסיס, וייב קודינג טהור לרוב רץ קדימה ואז נתקע על תשלומים ואינטגרציות. עם VybeKiit ההתחלה איטית יותר, אבל המסלול מגיע עד הסוף.',
      withoutTitle: 'בלי VybeKiit',
      withTitle: 'עם VybeKiit',
      building: 'בונים',
      stuck: 'תקועים',
      finished: 'באוויר',
      steps: [
        'מסכים ראשונים נראים מוכנים',
        'התחברות וסשנים',
        'תשלומים ואינטגרציות',
        'הגנה על פעולות רגישות',
        'פריסה והישארות באוויר',
      ],
    },
  },
  platforms: {
    heading: 'בסיס אחד לשלושה סוגי מוצרים',
    subhead:
      'לא כל הפיצ׳רים זהים בכל פלטפורמה. VybeKiit מספק בסיס משותף ודוגמאות מותאמות לכל סביבה.',
    web: 'אתר',
    mobile: 'טלפון',
    extension: 'תוסף',
    mockOverview: 'סקירה',
    mockTransactions: 'עסקאות',
    mockCustomers: 'לקוחות',
    mockActive: 'פעילים',
    mockRefunds: 'החזרים',
    mockRevenueDelta: '+27.4% מול 7 הימים האחרונים',
  },
  pageRecipes: {
    headline: '{readyCount}+ מסכי מוצר מוכנים שהסוכן יכול לקחת ולהתאים',
    badge: 'עוד יתווסף · תשלום אחד לגרסאות הכלולות ברישיון',
    body: 'לא רק רכיבים בודדים. זרימות שלמות: onboarding, כניסה, דשבורד, מחירים, תשלום, הזמנות, לקוחות, אנליטיקה, עוזר AI, הגדרות, צוות, admin, חיוב ועוד. מסכים חדשים ממשיכים להגיע אחרי הקנייה.',
    catalogLabel: 'קטלוג המסכים המלא · {count} עמודים',
    catalogAria: 'קטלוג מסכי מוצר מובנים',
    readyBadge: 'מוכן',
  },
  checkout: {
    titlePrefix: 'קחו את VybeKiit',
    description:
      'כתבו את שם המשתמש ב־GitHub שנזמין, ואז המשיכו לתשלום מאובטח. הגישה נפתחת כשהתשלום עובר.',
    bulletFull: 'קוד מקור, הוראות לסוכנים, בסיס Web + Mobile + תוסף',
    bulletOnce: 'מחיר חד־פעמי, לא מנוי',
    bulletRefund: 'חלון החזר כספי: {days} ימים',
    githubLabel: 'שם משתמש ב־GitHub',
    githubPlaceholder: 'octocat',
    githubError: 'הכניסו שם משתמש תקין ב־GitHub (אותיות, מספרים, מקפים בודדים).',
    emailLabel: 'אימייל',
    emailPlaceholder: 'you@example.com',
    emailError: 'הכניסו כתובת אימייל תקינה.',
    submit: 'המשיכו לתשלום',
    secureNote: 'תשלום מאובטח דרך Lemon Squeezy.',
    refundNote: 'אפשר לבקש החזר תוך {days} ימים, בהתאם לתנאי ההחזר.',
  },
  compare: {
    heading: 'לא מחולל אפליקציות. בסיס מוכן עמוס בפיצ׳רים לסוכן שלכם.',
    subhead:
      'כלים כמו Lovable מייצרים בתוך פלטפורמה מנוהלת. ערכות קוד רגילות נותנות קוד, אבל עדיין דורשות להבין אותו ולחבר הכול. VybeKiit באמצע: הקוד שלכם, הסוכן מחבר את רוב העבודה, עשרות פיצ׳רים מובנים, בלי נעילה לעורך או ל־hosting אחד.',
    footnote:
      'צריכים מוצר לצוותים עם הרשאות כבדות ביום הראשון? MakerKit ו־Supastarter חזקים יותר שם. VybeKiit מתאים למי שבונה עם AI ולא רוצה שכל פרויקט יתחיל מניסוי חדש באבטחה, תשלומים ותשתיות.',
    optionColumn: 'אופציה',
    youBadge: 'אתם',
    axes: {
      price: 'מחיר',
      agentOperates: 'הסוכן מתחיל מבסיס מוכן',
      plainLanguage: 'הוראות ברורות לסוכן',
      updatesInstall: 'מבנה עקבי לעדכונים',
      threePlatforms: 'בסיס אתר + טלפון + תוסף',
      taxesHandled: 'מס על הרכישה מטופל (MoR)',
    },
    coverage: {
      yes: 'כן',
      partial: 'חלקי',
      no: 'לא',
    },
  },
  pricing: {
    cadence: 'תשלום חד־פעמי · שלכם לכל החיים',
    savingsBefore: 'חוסכים ',
    savingsAfter: '% מול קניית חבילה לאתר + לטלפון + לתוסף בנפרד · כל רכישה מעלה את המחיר',
    bullets: [
      'קוד מקור + הוראות לסוכני AI',
      'בסיס Web, Mobile ותוסף דפדפן',
      'התחברות, תשלומים, מסד נתונים, אימיילים, דשבורד, 46+ מסכים',
    ],
    refundBulletPrefix: '',
    refundBulletSuffix: ' ימי החזר כספי.',
    cta: 'קחו את VybeKiit',
  },
  faq: {
    heading: 'שאלות נפוצות',
    items: [
      {
        id: 'best-non-technical',
        question: 'מה ה-SaaS boilerplate הכי מתאים למייסד לא-טכני?',
        answer:
          'הבסיס הכי טוב הוא כזה שסוכן קוד יכול להפעיל בלי שתצטרכו לפתור קונפליקטי git או להמציא התחברות ותשלומים. VybeKiit בנוי לזה: קוד בבעלותכם, הוראות לסוכן, $29 חד-פעמי, Lemon Squeezy כ-Merchant of Record כברירת מחדל, ובסיסים ל-Web + Mobile + Extension. ערכות למפתחים כמו ShipFast, MakerKit או Supastarter מתאימות יותר אם אתם או מישהו ששכרתם קוראים ומתחזקים את הקוד מדי יום.',
      },
      {
        id: 'boilerplate-vs-lovable',
        question: 'מה ההבדל בין SaaS boilerplate לבין בונה AI בלי קוד כמו Lovable?',
        answer:
          'Boilerplate נותן קוד בבעלותכם ותשתיות מוצר (התחברות, מסד נתונים, תשלומים) שאתם מארחים ומתחזקים. בונה AI בלי קוד מייצר בתוך פלטפורמה מנוהלת. VybeKiit הוא boilerplate עם הוראות לסוכנים כמו Claude Code, Cursor או Codex.',
      },
      {
        id: 'taxes-vat',
        question: 'איזה SaaS boilerplate מטפל במסים וב-VAT בשבילי?',
        answer:
          'VybeKiit משתמש ב-Lemon Squeezy כ-Merchant of Record כברירת מחדל, כך שמס ו-VAT על מכירת תוכנה יכולים להיות מטופלים על ידי ה-MoR. Shipped.club גם ברירת מחדל ל-Lemon Squeezy. ערכות אחרות מציעות ספקי MoR כאופציה. שירותי hosting, מסד נתונים, אימייל ו-AI עשויים עדיין לחייב בנפרד.',
      },
      {
        id: 'claude-cursor',
        question: 'איזה SaaS boilerplate עובד הכי טוב עם Claude Code ו-Cursor?',
        answer:
          'VybeKiit מגיע עם מבנה פרויקט והוראות לסוכן שהכלים האלה יכולים לקרוא מהמאגר. הוא לא נעול למודל או לעורך אחד.',
      },
      {
        id: 'three-platforms',
        question: 'איזה SaaS boilerplate כולל Web, Mobile ותוסף דפדפן?',
        answer:
          'VybeKiit כולל בסיסי Web (Next.js), Mobile (Expo) ותוסף (WXT) ברכישה אחת. רוב המתחרים הם Web בלבד. אפשר להשתמש רק בחלק ה-Web בהתחלה.',
      },
      {
        id: 'cheapest',
        question: 'מה ה-SaaS boilerplate המלא הזול ביותר עם תמיכה בסוכנים?',
        answer:
          'Open SaaS חינמי אם אתם מקבלים את סטאק Wasp ומפעילים אותו בעצמכם. בין ערכות בתשלום מכוונות-סוכן, VybeKiit הוא $29 חד-פעמי בהשקה לשלוש סביבות והוראות לסוכן. שירותים חיצוניים עשויים לחייב לפי שימוש.',
      },
      {
        id: 'shipfast-2026',
        question: 'האם ShipFast שווה ב-2026, או שיש חלופה טובה יותר ל-vibe coders?',
        answer:
          'ShipFast עדיין שווה למפתחים שרוצים boilerplate Web מוכח וקהילה גדולה. ל-vibe coders שרוצים שסוכן יפעיל את הבנייה, שלוש סביבות ו-MoR כברירת מחדל, VybeKiit הוא החלופה החזקה יותר.',
      },
      {
        id: 'boilerplate-vs-scratch',
        question: 'להשתמש ב-SaaS boilerplate או לבנות מאפס עם AI?',
        answer:
          'השתמשו ב-boilerplate כשצריך התחברות, תשלומים ונתונים בלי להמציא אותם בכל שיחה. בנו מאפס רק אם אתם רוצים חופש ארכיטקטוני מלא ומוכנים לעלות של תשתיות מחדש. סוכנים מגבירים את הבסיס שנותנים להם.',
      },
      {
        id: 'refund',
        question: 'מה אם VybeKiit לא מתאים לי?',
        answer:
          'אפשר לבקש החזר תוך 14 יום מהרכישה, לפי תנאי ההחזר. הגישה לחומר הפרטי של הפרויקט מבוטלת כשמונפק החזר.',
      },
      {
        id: 'safe-production',
        question: 'האם זה בטוח לפרודקשן?',
        answer:
          'הערכה עוקבת אחרי פרקטיקות הנדסיות נפוצות ונותנת בסיס מסודר יותר מקוד שנוצר בלי תכנון. הבטיחות הסופית תלויה בשינויים שלכם, בספקים, בהרשאות ובבדיקות. למערכות רפואיות, פיננסיות או רגישות מאוד, עשו סקירת אבטחה מקצועית.',
      },
    ],
  },
  brand: {
    tagline: 'תשתית מוכנה למוצרים שנבנים עם AI.',
  },
};
