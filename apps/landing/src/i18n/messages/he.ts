import type { LandingMessages } from '@/i18n/messages/types';

/** Hebrew visitor landing copy (RTL). */
export const heMessages: LandingMessages = {
  meta: {
    languageName: 'עברית',
    switchLanguage: 'שפה',
    closeLanguageMenu: 'סגור תפריט שפות',
  },
  nav: {
    features: 'יכולות',
    howItWorks: 'איך זה עובד',
    pricing: 'מחיר',
    faq: 'שאלות',
    getVybekiit: 'קבל את VybeKiit',
    openMenu: 'פתח תפריט',
    closeMenu: 'סגור תפריט',
  },
  footer: {
    rights: 'כל הזכויות שמורות.',
    legal: 'משפטי',
    contact: 'יצירת קשר',
    terms: 'תנאים',
    privacy: 'פרטיות',
  },
  hero: {
    eyebrow: 'אתה מנחה. הסוכן בונה.',
    headlineBefore: 'עולים לאוויר, ולוקחים ',
    headlineHighlight: 'את התשלום הראשון',
    headlineAfter: ', כבר בסשן הראשון.',
    subheadBeforePrice:
      'תאר את המוצר בשפה פשוטה. הסוכן מחבר תשלומים, התחברות, מסד נתונים ופריסה ל־web, למובייל ולתוסף דפדפן. רכישה אחת, ',
    subheadAfterPrice: '.',
    primaryCta: 'קבל את VybeKiit',
    trustMoR: 'Lemon Squeezy · Merchant of Record',
    trustRefund: 'ימי החזר',
    trustPlatforms: 'Web · Mobile · Extension',
    trustAria: 'הבטחות אמון',
  },
  builtWith: {
    note: 'כל עמוד הנחיתה הזה נבנה עם VybeKiit',
  },
  techTrust: {
    agentsHeading: 'עובד עם סוכני הקידוד ב־AI שאתה כבר משתמש בהם',
    stackHeading: 'נבנה עם הכלים שאתה כבר סומך עליהם',
  },
  operator: {
    heading: 'סוכן אחד מפעיל את כל הערימה.',
    steps: [
      {
        id: 'plan',
        title: 'תכנון',
        body: 'הופך את הרעיון לתוכנית ברורה ומודל נתונים.',
      },
      {
        id: 'build',
        title: 'בנייה',
        body: 'מייצר את האפליקציה המלאה ל־web, מובייל ותוסף.',
      },
      {
        id: 'wire',
        title: 'חיבור',
        body: 'מחבר תשלומים, התחברות, מסד נתונים והגדרות סביבה.',
      },
      {
        id: 'verify',
        title: 'אימות',
        body: 'מריץ בדיקות, טסטים ואימותי אבטחה.',
      },
      {
        id: 'live',
        title: 'לייב',
        body: 'מפרסם הכל. אתה עולה לאוויר כבר בסשן הראשון.',
      },
    ],
  },
  problem: {
    problemLabel: 'הבעיה',
    problemHeading: 'סטארטרים עדיין משאירים אותך לבד עם הכל.',
    problemBody: 'VybeKiit מפעיל את הערימה, מקצה לקצה.',
    overviewTitle: 'סקירה',
    withoutBadge: 'בלי VybeKiit',
    rows: [
      { id: 'payments', label: 'תשלומים', value: 'ידני' },
      { id: 'auth', label: 'התחברות', value: 'ידני' },
      { id: 'database', label: 'מסד נתונים', value: 'ידני' },
      { id: 'deploy', label: 'פריסה', value: 'ידני' },
      { id: 'you', label: 'אתה', value: 'מוצף' },
    ],
  },
  solution: {
    solutionLabel: 'הפתרון',
    solutionHeading: 'קבל תשלומים כבר בסשן הראשון.',
    solutionBody: 'הסוכן מחבר תשלומים, מטפל ב־webhooks, ונותן לך checkout שעובד מיד.',
    toastLabel: 'התקבל תשלום',
    revenueLabel: 'הכנסות',
    revenueDelta: '+27.4% מול 7 הימים האחרונים',
  },
  platforms: {
    heading: 'רכישה אחת. Web, מובייל, ותוסף דפדפן.',
    subhead: 'סוכן אחד. בלי צנרת ידנית.',
    web: 'Web',
    mobile: 'מובייל',
    extension: 'תוסף',
  },
  compare: {
    heading: 'להיות מהנדס תוכנה בלי להפוך לאחד.',
    subhead:
      'קיטים אחרים נותנים לך קוד ומאחלים בהצלחה. VybeKiit הוא הסוכן שבונה, מחבר ומשיק בשבילך.',
    footnote:
      'צריך B2B multi-tenant עמוק כבר ביום הראשון (RBAC, אדמין, jobs)? MakerKit ו־Supastarter חזקים יותר שם. VybeKiit מנצח כשאתה רוצה שהסוכן יפעיל את כל המוצר כדי שלא תצטרך לקרוא את הקוד.',
    axes: {
      price: 'מחיר',
      agentOperates: 'הסוכן בונה בשבילך',
      plainLanguage: 'רק שפה פשוטה',
      updatesInstall: 'עדכונים מותקנים (בלי merge)',
      threePlatforms: 'Web + מובייל + תוסף',
      taxesHandled: 'מיסים מטופלים (MoR)',
    },
    coverage: {
      yes: 'כן',
      partial: 'חלקי',
      no: 'לא',
    },
  },
  pricing: {
    cadence: 'תשלום חד־פעמי · שלך לכל החיים',
    savingsBefore: 'חסכו ',
    savingsAfter: '% מול קניית קיטי web + מובייל + תוסף בנפרד · כל רכישה מעלה את המחיר',
    bullets: [
      'AI Operator + Web + מובייל + תוסף',
      'כל היכולות. בלי מגבלות.',
      'גישה לכל החיים. שלך לנצח.',
    ],
    refundBulletPrefix: '',
    refundBulletSuffix: ' ימי החזר כספי.',
    cta: 'קבל את VybeKiit',
  },
  faq: {
    heading: 'איזה חבילה לקחת?',
    items: [
      {
        id: 'which-package',
        question: 'איזו חבילה כדאי לי לקחת?',
        answer:
          'יש רק חבילה אחת. מקבלים את הקיט המלא: מפעיל AI + web + מובייל + תוסף דפדפן ברכישה חד־פעמית אחת. בלי דרגות, בלי upsell של “pro”, ובלי לבחור רק web מול רק מובייל. אם קודם משיקים אתר, המובייל והתוסף נשארים מוכנים לרגע שתצטרכו אותם.',
      },
      {
        id: 'vibe-coder',
        question: 'אני רק מדבר עם כלי AI. זה בשבילי?',
        answer:
          'כן. VybeKiit נבנה ל־vibe coders: מתארים מה רוצים בשפה פשוטה, והסוכן מתכנן, בונה, מחבר תשלומים, מאמת ומעלה לאוויר. אין צורך לקרוא קוד, לתקן merge, או ללמוד DevOps. אם כבר משתמשים ב־Claude Code, Cursor, Codex, Kiro או כלי דומה, אתם קהל היעד.',
      },
      {
        id: 'best-for-non-technical',
        question: 'מה הקיט הכי טוב ל־SaaS אם אני לא מפתח?',
        answer:
          'VybeKiit הוא הבחירה כשרוצים שהסוכן יפעיל את כל המוצר בשבילכם. קיטים אחרים נותנים קוד ומניחים שמפתח נשאר בלופ. אם כבר יודעים לשגר ממאגר ריק לבד, סטארטר חינמי בקוד פתוח יכול להספיק. אם רוצים “תאר את זה → תשלום ראשון”, בחרו VybeKiit.',
      },
      {
        id: 'only-need-web',
        question: 'אני צריך רק אתר. עדיין כדאי לקנות את הקיט המלא?',
        answer:
          'כן. המחיר הוא לכל הקיט, ו־web הוא הנתיב שמתחילים ממנו. מובייל ותוסף הדפדפן מגיעים באותה רכישה כדי שלא תשלמו שוב כשהרעיון גדל. אין SKU זול יותר של “רק web” כי הערך הוא סוכן אחד שמריץ מוצר מלא, לא ערימה של חצאי קיטים.',
      },
      {
        id: 'vs-shipfast-lovable',
        question: 'איך זה בהשוואה ל־ShipFast, Lovable או MakerKit?',
        answer:
          'ShipFast ו־MakerKit מעולים אם אתם מפתחים שרוצים boilerplate ויחברו את השאר בעצמכם. Lovable ובוני UI ב־AI דומים מעולים לדמו מהיר, לא לבעלות על סטאק אמיתי עם תשלומים, עדכונים ושלוש פלטפורמות. VybeKiit הוא הבחירה כשרוצים רכישה אחת, שפה פשוטה, וסוכן שבאמת משיק ומתחזק את המוצר.',
      },
      {
        id: 'price-worth-it',
        question: 'למה זה $29 כשקיטים אחרים עולים $199+?',
        answer:
          'כי המוצר הוא קיט אחד ל־vibe coders, לא ערימת כלי מפתחים שנמכרים בנפרד. קניית web + מובייל + תוסף מקיטים מתחרים יכולה לעבור $600. VybeKiit מאגד את שלושתם יחד עם מפעיל הסוכן במחיר השקה של $29 חד־פעמי, עם 14 ימי החזר אם זה לא מתאים.',
      },
      {
        id: 'claude-cursor-kiro',
        question: 'זה עובד עם Claude Code, Cursor, Codex ו־Kiro?',
        answer:
          'כן. VybeKiit תוכנן כך שכלי הקידוד ב־AI שלכם הוא המפעיל: הוא מחליט על הצעד הבא, מריץ אותו, ובודק את התוצאה לפני שהוא ממשיך. הביאו את הסוכן שאתם כבר משלמים עליו. אין נעילה לצ׳אט של ספק אחד.',
      },
      {
        id: 'refund-risk',
        question: 'מה אם זה לא עובד בשבילי?',
        answer:
          'יש חלון של 14 ימי החזר כספי. מבקשים החזר וגישת GitHub לרפוזיטוריז הפרטיים מבוטלת. המטרה היא אפס חרטה: מנסים את הזרימה, בודקים אם הסוכן מגיע ל־checkout חי, ומשאירים רק אם זה מתאים לאיך שאתם בונים.',
      },
      {
        id: 'taxes-payments',
        question: 'אני צריך לטפל לבד במס מכירות ו־VAT?',
        answer:
          'לא, אם משתמשים בנתיב ברירת המחדל של Lemon Squeezy. Lemon Squeezy הוא Merchant of Record, ולכן מטפל ב־VAT ומס מכירות גלובלי בשבילכם. אפשר להחליף ספק תשלומים אחר כך; הקיט בנוי כך שהסוכן מחבר checkout בכל מקרה.',
      },
    ],
  },
  brand: {
    tagline: 'התוכנית ל־vibe coders. לשגר פרויקטים כמו מהנדס תוכנה אמיתי.',
  },
};
