#!/usr/bin/env node
/**
 * safety-catalog.mjs — the full map of what the safety check looks for.
 *
 * This file is meant to be read. You (or your assistant) can open it and see exactly what
 * counts as a leak, why it matters, and the plain words shown in the report. No hidden
 * rules, no black box. That is the whole point: trust comes from being able to read the
 * check yourself, not from trusting an agent to be honest about it.
 *
 * Every finding the scan reports carries the same eight fields:
 *   id · rung · severity · detect · leakPaths · proof · plain(+tooltip/consequence/fix) · kitPreventable
 *
 * The five rungs, ordered easiest-to-spot to hardest:
 *   1  Secrets exposure     critical    ~19 key families across 7 leak paths
 *   2  Config & deploy      high        source maps public, .env in history, debug left on, open CORS
 *   3  Dependencies         high/med    building blocks with known holes or long abandoned
 *   4  Sign-in & access     critical    the kit's edge: data pages that forget to check who you are
 *   5  Risky code           varies      dangerous spots: eval, raw HTML, raw SQL, open redirects
 *
 * Buyer-facing text is always {en, he} so the report renders in the reader's own language.
 * Keep both plain, concrete, and free of em dashes (kit rule).
 */

/** A localized string. */
const L = (en, he) => ({ en, he });

export const SEVERITY = { critical: 'critical', high: 'high', medium: 'medium', low: 'low' };

/** Traffic-light bucket a severity falls into, for the headline. */
export const LIGHT = { critical: 'red', high: 'red', medium: 'amber', low: 'amber' };

/**
 * The 7 leak paths — the ways one secret can escape. The scan checks each independently,
 * so the report can say "yes it is in your code, no it is not in your replies", in words a
 * non-coder reads at a glance.
 */
export const LEAK_PATHS = {
  code: { id: 'code', label: L('Written straight into your code', 'כתוב ישירות בתוך הקוד שלך') },
  git: { id: 'git', label: L('Saved into your project history', 'נשמר בתוך היסטוריית הפרויקט') },
  public: {
    id: 'public',
    label: L('Anyone visiting your site can see it', 'כל מי שנכנס לאתר יכול לראות אותו'),
  },
  clientBundle: {
    id: 'clientBundle',
    label: L('Shipped inside the page visitors download', 'נשלח בתוך העמוד שהמבקרים מורידים'),
  },
  apiReply: {
    id: 'apiReply',
    label: L("Sent back in your app's replies", 'נשלח בתשובות של האפליקציה'),
  },
  logs: { id: 'logs', label: L("Saved in your app's logs", 'נשמר ביומני האפליקציה') },
  sourcemap: {
    id: 'sourcemap',
    label: L('Left readable for anyone to download', 'הושאר קריא לכל אחד להוריד'),
  },
};

const SECRET_TOOLTIP = L(
  'A key is like a password that lets your app use a paid or private service. If someone copies it, they can use it as you.',
  'מפתח הוא כמו סיסמה שמאפשרת לאפליקציה שלך להשתמש בשירות בתשלום או פרטי. אם מישהו מעתיק אותו, הוא יכול להשתמש בו בשמך.',
);

const DEFAULT_CONSEQUENCE = L(
  'A stranger can use this to act as you on a paid or private service, run up charges, or reach your data.',
  'אדם זר יכול להשתמש בזה כדי לפעול בשמך בשירות בתשלום או פרטי, לצבור חיובים, או להגיע למידע שלך.',
);

const DEFAULT_DEFENSE = L(
  'Replace this key now (make a new one, delete the old one) and set a spending or usage limit on the service so a future slip stays small.',
  'החלף את המפתח עכשיו (צור חדש, מחק את הישן) והגדר מגבלת הוצאה או שימוש בשירות, כך שהחלקה עתידית תישאר קטנה.',
);

/**
 * The secret families. `re` is the pattern the scan matches. `consequence` and `defense`
 * override the defaults for the high-value ones (the ones that cost real money fast).
 */
export const SECRET_FAMILIES = [
  {
    id: 'openai',
    name: L('OpenAI key', 'מפתח OpenAI'),
    re: /\bsk-(?:proj-)?[A-Za-z0-9]{20,}\b/,
    consequence: L(
      'Someone can run your paid AI on your account. People have woken up to thousands of dollars in charges from one leaked key.',
      'מישהו יכול להריץ את ה-AI בתשלום על החשבון שלך. אנשים גילו חיובים של אלפי דולרים ממפתח אחד שדלף.',
    ),
    defense: L(
      'Set a monthly spending cap in your OpenAI account. Then even a future slip can never cost more than the number you pick.',
      'הגדר תקרת הוצאה חודשית בחשבון ה-OpenAI שלך. כך אפילו החלקה עתידית לא תעלה יותר מהמספר שתבחר.',
    ),
  },
  {
    id: 'anthropic',
    name: L('Claude (Anthropic) key', 'מפתח Claude (Anthropic)'),
    re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/,
    consequence: L(
      'Someone can run your paid AI on your account and run up charges fast.',
      'מישהו יכול להריץ את ה-AI בתשלום על החשבון שלך ולצבור חיובים במהירות.',
    ),
    defense: L(
      'Set a spending cap in your Anthropic account so a leak can never grow large.',
      'הגדר תקרת הוצאה בחשבון Anthropic שלך, כך שדליפה לעולם לא תגדל.',
    ),
  },
  {
    id: 'stripe',
    name: L('Stripe payment key', 'מפתח תשלומים Stripe'),
    re: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/,
    consequence: L(
      'This is the master key to your money. A stranger could read your customers, issue refunds to themselves, or move payouts.',
      'זהו מפתח האב לכסף שלך. אדם זר יכול לקרוא את הלקוחות שלך, להנפיק לעצמו החזרים, או להזיז תשלומים.',
    ),
    defense: L(
      'Roll the key in your Stripe dashboard immediately, and use a restricted key with only the permissions your app needs.',
      'החלף את המפתח בלוח הבקרה של Stripe מיד, והשתמש במפתח מוגבל עם ההרשאות שהאפליקציה שלך באמת צריכה.',
    ),
  },
  {
    id: 'aws',
    name: L('Amazon (AWS) key', 'מפתח אמזון (AWS)'),
    re: /\bAKIA[0-9A-Z]{16}\b/,
    consequence: L(
      'Someone could spin up servers on your account. This is one of the fastest ways to a five-figure surprise bill.',
      'מישהו יכול להפעיל שרתים על החשבון שלך. זו אחת הדרכים המהירות ביותר לחשבון מפתיע בחמש ספרות.',
    ),
    defense: L(
      'Deactivate the key in AWS now, and turn on a billing alert so any spike reaches you the same day.',
      'בטל את המפתח ב-AWS עכשיו, והפעל התראת חיוב כדי שכל קפיצה תגיע אליך באותו יום.',
    ),
  },
  {
    id: 'google-api',
    name: L('Google API key', 'מפתח Google API'),
    re: /\bAIza[0-9A-Za-z_-]{35}\b/,
  },
  {
    id: 'google-oauth-secret',
    name: L('Google sign-in secret', 'סוד ההתחברות של Google'),
    re: /\bGOCSPX-[A-Za-z0-9_-]{20,}\b/,
  },
  {
    id: 'github-token',
    name: L('GitHub access token', 'טוקן גישה של GitHub'),
    re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{22,}\b/,
    consequence: L(
      'Someone could read or change your saved code, including anything private in it.',
      'מישהו יכול לקרוא או לשנות את הקוד השמור שלך, כולל כל דבר פרטי שנמצא בו.',
    ),
  },
  {
    id: 'gitlab-token',
    name: L('GitLab access token', 'טוקן גישה של GitLab'),
    re: /\bglpat-[A-Za-z0-9_-]{20,}\b/,
  },
  {
    id: 'slack-token',
    name: L('Slack token', 'טוקן Slack'),
    re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
  },
  {
    id: 'sendgrid',
    name: L('SendGrid email key', 'מפתח אימייל SendGrid'),
    re: /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/,
  },
  {
    id: 'resend',
    name: L('Resend email key', 'מפתח אימייל Resend'),
    re: /\bre_[A-Za-z0-9]{20,}\b/,
  },
  { id: 'twilio', name: L('Twilio account key', 'מפתח חשבון Twilio'), re: /\bAC[0-9a-f]{32}\b/ },
  {
    id: 'npm-token',
    name: L('npm publish token', 'טוקן פרסום npm'),
    re: /\bnpm_[A-Za-z0-9]{36}\b/,
  },
  {
    id: 'private-key',
    name: L('Private key file', 'קובץ מפתח פרטי'),
    re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/,
    consequence: L(
      'This is the private half of a lock. Whoever holds it can impersonate your app or decrypt its data.',
      'זהו החצי הפרטי של מנעול. מי שמחזיק בו יכול להתחזות לאפליקציה שלך או לפענח את המידע שלה.',
    ),
  },
  {
    id: 'jwt',
    name: L('Sign-in token secret', 'סוד טוקן ההתחברות'),
    re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
    consequence: L(
      'If this is a service token, a stranger could read or change your whole database, skipping every sign-in check.',
      'אם זהו טוקן שירות, אדם זר יכול לקרוא או לשנות את כל מסד הנתונים שלך, תוך עקיפת כל בדיקת התחברות.',
    ),
  },
  {
    id: 'db-url',
    name: L('Database address with password', 'כתובת מסד נתונים עם סיסמה'),
    re: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s:@/]+:[^\s:@/]+@/,
    consequence: L(
      'This is the front door to all your data, with the password attached. A stranger could read, change, or delete everything.',
      'זו דלת הכניסה לכל המידע שלך, עם הסיסמה מחוברת. אדם זר יכול לקרוא, לשנות, או למחוק הכל.',
    ),
    defense: L(
      'Change the database password now, and restrict access to only the places your app runs from.',
      'שנה את סיסמת מסד הנתונים עכשיו, והגבל גישה רק למקומות שמהם האפליקציה שלך רצה.',
    ),
  },
  {
    id: 'mailgun',
    name: L('Mailgun email key', 'מפתח אימייל Mailgun'),
    re: /\bkey-[0-9a-f]{32}\b/,
  },
  {
    // Catch-all: a long value assigned to a variable whose NAME screams secret.
    // Covers Supabase service-role, Cloudflare tokens, Lemon Squeezy keys, and anything new.
    id: 'named-secret',
    name: L('secret value', 'ערך סודי'),
    re: /\b[A-Z0-9_]*(?:SECRET|TOKEN|API_?KEY|PASSWORD|PRIVATE_KEY|ACCESS_KEY|SERVICE_ROLE)[A-Z0-9_]*\s*[:=]\s*['"][^'"\s]{12,}['"]/i,
  },
];

/**
 * Build a finding title for one secret family and leak path.
 *
 * @param family - Secret family metadata from the catalog.
 * @param leakPathId - Leak path id detected by the scanner.
 * @returns Localized finding title.
 * @example
 * const title = titleFor(family, 'git');
 */
const titleFor = (family, leakPathId) => {
  const { name } = family;
  if (leakPathId === 'public' || leakPathId === 'clientBundle') {
    return L(`Your ${name.en} is visible to visitors`, `${name.he} שלך גלוי למבקרים`);
  }
  if (leakPathId === 'git') {
    return L(
      `Your ${name.en} is saved in your project history`,
      `${name.he} שלך שמור בהיסטוריית הפרויקט`,
    );
  }
  return L(`Your ${name.en} is exposed`, `${name.he} שלך חשוף`);
};

/**
 * Build the plain-language fix for one secret family and leak path.
 *
 * @param family - Secret family metadata from the catalog.
 * @param leakPathId - Leak path id detected by the scanner.
 * @returns Localized remediation copy.
 * @example
 * const fix = fixFor(family, 'public');
 */
const fixFor = (_family, leakPathId) => {
  if (leakPathId === 'git') {
    return L(
      'I will replace this key with a fresh one and clear the old one from your history, so the leaked one stops working. Your features keep running the same.',
      'אחליף את המפתח בחדש ואנקה את הישן מההיסטוריה, כך שהמפתח שדלף יפסיק לעבוד. התכונות שלך ימשיכו לעבוד אותו דבר.',
    );
  }
  return L(
    'I will move your key to a private spot only your app can read, so visitors never see it. Your features keep working exactly the same. Takes about 30 seconds.',
    'אעביר את המפתח למקום פרטי שרק האפליקציה שלך יכולה לקרוא, כך שהמבקרים לעולם לא יראו אותו. התכונות שלך ימשיכו לעבוד בדיוק אותו דבר. לוקח בערך 30 שניות.',
  );
};

/**
 * Return a localized value or the provided default.
 *
 * @param value - Optional localized value from the catalog entry.
 * @param fallback - Default localized value to use when missing.
 * @returns The configured value or fallback.
 * @example
 * const consequence = valueOrDefault(family.consequence, DEFAULT_CONSEQUENCE);
 */
const valueOrDefault = (value, fallback) => {
  if (value === undefined) {
    return fallback;
  }

  return value;
};

/**
 * Compose a full, buyer-facing finding for one secret on one leak path.
 *
 * @param family - Secret family metadata from the catalog.
 * @param leakPathId - Leak path id detected by the scanner.
 * @param proof - Proof object filled in by the scanner where it found the match.
 * @returns Full buyer-facing finding object for the safety report.
 * @example
 * const finding = secretFinding(family, 'code', proof);
 */
export const secretFinding = (family, leakPathId, proof) => {
  const fix = fixFor(family, leakPathId);
  const consequence = valueOrDefault(family.consequence, DEFAULT_CONSEQUENCE);
  return {
    id: `secret.${family.id}.${leakPathId}`,
    rung: 1,
    severity: SEVERITY.critical,
    kitPreventable: true,
    detect: `pattern match for ${family.id} on leak path ${leakPathId}`,
    leakPaths: [leakPathId],
    proof,
    tooltip: SECRET_TOOLTIP,
    plain: {
      title: titleFor(family, leakPathId),
      what: consequence,
      fix,
    },
    consequence,
    remediation: { fix, defenseInDepth: valueOrDefault(family.defense, DEFAULT_DEFENSE) },
  };
};

/**
 * Rungs 2 to 5 as data. The scan implements detection for the ones marked `detectable: true`
 * today; the rest are mapped here so the report, the ADR, and the plan all read from one list
 * as detection fills in. Same shape as a secret finding, minus the proof (added at detection).
 */
export const CASES = [
  // --- Rung 2: config & deploy ---
  {
    id: 'config.sourcemaps-public',
    rung: 2,
    severity: SEVERITY.high,
    detectable: true,
    kitPreventable: true,
    detect: 'productionBrowserSourceMaps / build.sourcemap set true',
    leakPaths: ['sourcemap'],
    tooltip: L(
      'Source maps are readable copies of your code. Handy while building, but they let anyone read exactly how your app works once it is live.',
      'מפות מקור הן עותקים קריאים של הקוד שלך. שימושי בזמן בנייה, אבל זה מאפשר לכל אחד לקרוא בדיוק איך האפליקציה עובדת אחרי שהיא באוויר.',
    ),
    plain: {
      title: L('Your app is handing out its blueprints', 'האפליקציה שלך מחלקת את השרטוטים שלה'),
      what: L(
        'Your app ships a readable copy of its code. It still runs fine, but it hands anyone a map of how it works, and any key left in the code with it.',
        'האפליקציה שולחת עותק קריא של הקוד שלה. היא עדיין עובדת, אבל זה נותן לכל אחד מפה של איך היא בנויה, וכל מפתח שנשאר בקוד יחד איתה.',
      ),
      fix: L(
        'I can turn this off before you go live. Want me to?',
        'אני יכול לכבות את זה לפני שאתה עולה לאוויר. שאעשה את זה?',
      ),
    },
  },
  {
    id: 'config.env-committed',
    rung: 2,
    severity: SEVERITY.critical,
    detectable: true,
    kitPreventable: true,
    detect: '.env / .env.local / .env.production tracked by git',
    leakPaths: ['git'],
    tooltip: L(
      'Your .env file holds your keys. It is meant to stay on your machine only. If it is saved into your project history, every key in it travels with the project.',
      'קובץ ה-.env שלך מחזיק את המפתחות. הוא אמור להישאר רק במחשב שלך. אם הוא נשמר בהיסטוריית הפרויקט, כל מפתח בו נוסע עם הפרויקט.',
    ),
    plain: {
      title: L(
        'Your secret settings file got saved with the project',
        'קובץ ההגדרות הסודי שלך נשמר יחד עם הפרויקט',
      ),
      what: L(
        'The file that holds all your keys is stored in your project history. Anyone who ever gets a copy of the project gets every key inside it.',
        'הקובץ שמחזיק את כל המפתחות שלך שמור בהיסטוריית הפרויקט. כל מי שמקבל עותק של הפרויקט מקבל כל מפתח בתוכו.',
      ),
      fix: L(
        'I will take that file out of your history, keep it on your machine only, and replace any keys that were exposed.',
        'אוציא את הקובץ הזה מההיסטוריה, אשאיר אותו רק במחשב שלך, ואחליף כל מפתח שנחשף.',
      ),
    },
  },
  {
    id: 'config.security-off',
    rung: 2,
    severity: SEVERITY.high,
    detectable: true,
    kitPreventable: true,
    detect: 'SECURITY_RATE_LIMIT or SECURITY_ORIGIN_LOCK set off in .env',
    leakPaths: [],
    tooltip: L(
      'These two switches slow down anyone hammering your app and block other sites from making requests as your visitors. The kit ships them on.',
      'שני המתגים האלה מאטים כל מי שמנסה להציף את האפליקציה שלך וחוסמים אתרים אחרים מלבצע בקשות בשם המבקרים שלך. הערכה מספקת אותם דלוקים.',
    ),
    plain: {
      title: L('Your abuse protection is switched off', 'ההגנה מפני שימוש לרעה שלך כבויה'),
      what: L(
        'A safety switch that limits how fast anyone can hammer your app is turned off. That leaves the door open to abuse.',
        'מתג בטיחות שמגביל כמה מהר מישהו יכול להציף את האפליקציה שלך כבוי. זה משאיר את הדלת פתוחה לשימוש לרעה.',
      ),
      fix: L(
        'I will switch it back on and tune it to your app.',
        'אחזיר אותו לפעולה ואכוונן אותו לאפליקציה שלך.',
      ),
    },
  },
  {
    id: 'config.cors-wildcard',
    rung: 2,
    severity: SEVERITY.high,
    detectable: false,
    kitPreventable: true,
    detect: 'Access-Control-Allow-Origin: * on a route that also uses credentials',
    leakPaths: [],
    tooltip: L(
      'This setting decides which other websites may talk to your app. A star means "any website", which lets a stranger site act for your signed-in users.',
      'ההגדרה הזו קובעת אילו אתרים אחרים יכולים לדבר עם האפליקציה שלך. כוכבית פירושה "כל אתר", מה שמאפשר לאתר זר לפעול בשם המשתמשים המחוברים שלך.',
    ),
    plain: {
      title: L('Any website is allowed to talk to your app', 'כל אתר מורשה לדבר עם האפליקציה שלך'),
      what: L(
        'Your app currently accepts requests from any other website. A copycat site could use that to act for your signed-in users.',
        'האפליקציה שלך כרגע מקבלת בקשות מכל אתר אחר. אתר מתחזה יכול להשתמש בזה כדי לפעול בשם המשתמשים המחוברים שלך.',
      ),
      fix: L(
        'I will limit it to your own site and any sites you actually use.',
        'אגביל את זה לאתר שלך ולאתרים שאתה באמת משתמש בהם.',
      ),
    },
  },

  // --- Rung 3: dependencies ---
  {
    id: 'deps.known-vuln',
    rung: 3,
    severity: SEVERITY.high,
    detectable: true,
    kitPreventable: false,
    detect: 'package audit reports a high or critical advisory',
    leakPaths: [],
    tooltip: L(
      'Your app is built from many small building blocks made by other people. Sometimes a hole is found in one of them and a safer version is published.',
      'האפליקציה שלך בנויה מהרבה אבני בניין קטנות שאנשים אחרים יצרו. לפעמים מתגלה חור באחת מהן ומתפרסמת גרסה בטוחה יותר.',
    ),
    plain: {
      title: L(
        'One of your building blocks has a known weak spot',
        'לאחת מאבני הבניין שלך יש נקודת חולשה ידועה',
      ),
      what: L(
        'A piece your app is built on has a known weakness with a fix already available. Leaving it as-is is a door someone could use.',
        'חלק שהאפליקציה שלך בנויה עליו כולל חולשה ידועה שכבר קיים לה תיקון. להשאיר אותו כמו שהוא זו דלת שמישהו יכול לנצל.',
      ),
      fix: L(
        'I will update it to the safe version and check nothing else breaks.',
        'אעדכן אותו לגרסה הבטוחה ואוודא ששום דבר אחר לא נשבר.',
      ),
    },
  },
  {
    id: 'deps.abandoned',
    rung: 3,
    severity: SEVERITY.medium,
    detectable: false,
    kitPreventable: false,
    detect: 'dependency has had no release in a long time / is deprecated',
    leakPaths: [],
    tooltip: L(
      'A building block that no one maintains anymore will never get a fix if a hole is found later.',
      'אבן בניין שאף אחד כבר לא מתחזק לעולם לא תקבל תיקון אם ימצא בה חור בהמשך.',
    ),
    plain: {
      title: L('One of your building blocks looks abandoned', 'אחת מאבני הבניין שלך נראית נטושה'),
      what: L(
        'A piece your app depends on has not been updated in a long time. If a problem shows up later, there may be no fix.',
        'חלק שהאפליקציה שלך תלויה בו לא עודכן הרבה זמן. אם תופיע בעיה בהמשך, אולי לא יהיה לה תיקון.',
      ),
      fix: L(
        'I will swap it for a maintained alternative when we get the chance.',
        'אחליף אותו בחלופה מתוחזקת כשתהיה הזדמנות.',
      ),
    },
  },

  // --- Rung 4: sign-in & access (the kit's edge) ---
  {
    id: 'authz.route-unprotected',
    rung: 4,
    severity: SEVERITY.critical,
    detectable: false,
    kitPreventable: true,
    detect: 'an /api route that reads or writes data without a session check',
    leakPaths: ['apiReply'],
    tooltip: L(
      'Every page that saves or reads private data should first check who is asking. A page that skips that check will answer a stranger the same as the owner.',
      'כל עמוד ששומר או קורא מידע פרטי צריך קודם לבדוק מי שואל. עמוד שמדלג על הבדיקה יענה לזר בדיוק כמו לבעלים.',
    ),
    plain: {
      title: L('A data page does not check who is asking', 'עמוד מידע לא בודק מי שואל'),
      what: L(
        'One of your behind-the-scenes pages hands back data without checking that the person is signed in. A stranger could read it too.',
        'אחד מהעמודים מאחורי הקלעים שלך מחזיר מידע בלי לבדוק שהאדם מחובר. גם זר יכול לקרוא אותו.',
      ),
      fix: L(
        'I will add the sign-in check so only the right person gets the data.',
        'אוסיף את בדיקת ההתחברות כך שרק האדם הנכון יקבל את המידע.',
      ),
    },
  },
  {
    id: 'authz.missing-ownership',
    rung: 4,
    severity: SEVERITY.critical,
    detectable: false,
    kitPreventable: true,
    detect: 'a route returns records without filtering by the signed-in owner',
    leakPaths: ['apiReply'],
    tooltip: L(
      "Checking that someone is signed in is not enough. The app must also return only their own records, not everyone else's.",
      'לבדוק שמישהו מחובר זה לא מספיק. האפליקציה צריכה גם להחזיר רק את הרשומות שלו, לא של כל האחרים.',
    ),
    plain: {
      title: L(
        "Signed-in users can see each other's data",
        'משתמשים מחוברים יכולים לראות מידע אחד של השני',
      ),
      what: L(
        "A page checks that you are signed in, but not that the data is yours. One signed-in user could read another's records by changing a number in the link.",
        'עמוד בודק שאתה מחובר, אבל לא שהמידע שלך. משתמש מחובר אחד יכול לקרוא רשומות של אחר על ידי שינוי מספר בקישור.',
      ),
      fix: L(
        'I will make each page return only the data that belongs to the person asking.',
        'אגרום לכל עמוד להחזיר רק את המידע ששייך לאדם ששואל.',
      ),
    },
  },
  {
    id: 'authz.rls-off',
    rung: 4,
    severity: SEVERITY.high,
    detectable: false,
    kitPreventable: true,
    detect: 'a database table has row-level security disabled',
    leakPaths: [],
    tooltip: L(
      'Row-level security is a rule inside the database itself that keeps each user to their own rows, even if the app forgets to.',
      'אבטחה ברמת השורה היא כלל בתוך מסד הנתונים עצמו ששומר כל משתמש לשורות שלו, גם אם האפליקציה שוכחת.',
    ),
    plain: {
      title: L('Your data has no second lock', 'למידע שלך אין מנעול שני'),
      what: L(
        'The database itself is not enforcing who can read which rows. If any page forgets to check, the data is open.',
        'מסד הנתונים עצמו לא אוכף מי יכול לקרוא אילו שורות. אם עמוד כלשהו שוכח לבדוק, המידע פתוח.',
      ),
      fix: L(
        'I will turn on the database-level lock so your data is protected twice.',
        'אפעיל את המנעול ברמת מסד הנתונים כך שהמידע שלך מוגן פעמיים.',
      ),
    },
  },

  // --- Rung 5: risky code ---
  {
    id: 'sast.dangerous-html',
    rung: 5,
    severity: SEVERITY.medium,
    detectable: true,
    kitPreventable: false,
    // biome-ignore lint/security/noSecrets: detector label for dangerous HTML, not a secret.
    detect: 'dangerouslySetInnerHTML / v-html used with non-constant input',
    leakPaths: [],
    tooltip: L(
      "This puts text on the page as raw code. If any of that text came from a user, they could sneak in code that runs in other visitors' browsers.",
      'זה שם טקסט בעמוד כקוד גולמי. אם חלק מהטקסט הגיע ממשתמש, הוא יכול להחדיר קוד שרץ בדפדפנים של מבקרים אחרים.',
    ),
    plain: {
      title: L('Your app shows text as raw code', 'האפליקציה שלך מציגה טקסט כקוד גולמי'),
      what: L(
        'A spot on the page puts text in without cleaning it first. If that text came from a user, they could slip in something harmful for other visitors.',
        'נקודה בעמוד מכניסה טקסט בלי לנקות אותו קודם. אם הטקסט הגיע ממשתמש, הוא יכול להחליק משהו מזיק למבקרים אחרים.',
      ),
      fix: L(
        'I will clean that text before it shows, so only safe content gets through.',
        'אנקה את הטקסט הזה לפני שהוא מוצג, כך שרק תוכן בטוח יעבור.',
      ),
    },
  },
  {
    id: 'sast.eval',
    rung: 5,
    severity: SEVERITY.high,
    detectable: true,
    kitPreventable: false,
    detect: 'eval() or new Function() built from non-constant input',
    leakPaths: [],
    tooltip: L(
      'This runs text as live code. If the text can come from a user, they can make your app run their instructions.',
      'זה מריץ טקסט כקוד חי. אם הטקסט יכול להגיע ממשתמש, הוא יכול לגרום לאפליקציה שלך להריץ את ההוראות שלו.',
    ),
    plain: {
      title: L('Your app runs text as live instructions', 'האפליקציה שלך מריצה טקסט כהוראות חיות'),
      what: L(
        'A spot in your app turns text into running code. If that text can come from a user, they could make your app do things you never intended.',
        'נקודה באפליקציה שלך הופכת טקסט לקוד רץ. אם הטקסט יכול להגיע ממשתמש, הוא יכול לגרום לאפליקציה לעשות דברים שלא התכוונת אליהם.',
      ),
      fix: L(
        'I will rewrite that spot to work without running text as code.',
        'אכתוב מחדש את הנקודה הזו כך שתעבוד בלי להריץ טקסט כקוד.',
      ),
    },
  },
  {
    id: 'sast.raw-sql',
    rung: 5,
    severity: SEVERITY.high,
    detectable: true,
    kitPreventable: true,
    detect: 'string-built SQL / $executeRaw with interpolation',
    leakPaths: [],
    tooltip: L(
      'When a database question is glued together from user text, a user can rewrite the question to read or delete data they should not touch.',
      'כששאלה למסד הנתונים מודבקת מטקסט של משתמש, המשתמש יכול לשכתב את השאלה כדי לקרוא או למחוק מידע שאסור לו לגעת בו.',
    ),
    plain: {
      title: L(
        'Your app builds database questions from raw text',
        'האפליקציה שלך בונה שאלות למסד הנתונים מטקסט גולמי',
      ),
      what: L(
        'A database question is glued together from text. A clever user could rewrite it to reach data they should not see.',
        'שאלה למסד הנתונים מודבקת מטקסט. משתמש פיקח יכול לשכתב אותה כדי להגיע למידע שאסור לו לראות.',
      ),
      fix: L(
        'I will switch it to the safe way the kit uses everywhere else.',
        'אעביר את זה לדרך הבטוחה שהערכה משתמשת בה בכל מקום אחר.',
      ),
    },
  },
  {
    id: 'sast.open-redirect',
    rung: 5,
    severity: SEVERITY.medium,
    detectable: false,
    kitPreventable: false,
    detect: 'redirect target taken from user input without an allowlist',
    leakPaths: [],
    tooltip: L(
      'If your app sends people wherever a link tells it to, a scammer can craft a link that starts on your trusted site and lands on theirs.',
      'אם האפליקציה שלך שולחת אנשים לכל מקום שהקישור אומר, נוכל יכול לבנות קישור שמתחיל באתר המהימן שלך ונוחת אצלו.',
    ),
    plain: {
      title: L(
        'Your app can be used to forward people to a fake site',
        'האפליקציה שלך יכולה לשמש להעברת אנשים לאתר מזויף',
      ),
      what: L(
        'Your app forwards visitors to an address taken from the link. A scammer could use your trusted name to send people to their page.',
        'האפליקציה שלך מעבירה מבקרים לכתובת שנלקחת מהקישור. נוכל יכול להשתמש בשם המהימן שלך כדי לשלוח אנשים לעמוד שלו.',
      ),
      fix: L(
        'I will only allow forwards to pages inside your own app.',
        'ארשה העברות רק לעמודים בתוך האפליקציה שלך.',
      ),
    },
  },
];

/** Everything, in one place, for the ADR and the plan to read from. */
export const ALL_CASE_IDS = [
  ...SECRET_FAMILIES.map((f) => `secret.${f.id}.*`),
  ...CASES.map((c) => c.id),
];
