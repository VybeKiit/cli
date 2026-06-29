import { MarketingShell } from '@/components/marketing-shell';
import { PRIVACY_SECTIONS } from '@/data/legal';
import { COMPANY_NAME, CONTACT_EMAIL, LEGAL_EFFECTIVE_DATE, PRODUCT_NAME } from '@/data/product';
import { getTranslations, setRequestLocale } from 'next-intl/server';

type PrivacyPageProps = {
  params: Promise<{ locale: string }>;
};

/**
 * Privacy Policy — plain-language skeleton with sensible defaults. The onboarding
 * skill replaces company/contact details; a human should review before launch.
 */
export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const legalVars = {
    productName: PRODUCT_NAME,
    companyName: COMPANY_NAME,
    contactEmail: CONTACT_EMAIL,
  };

  return (
    <MarketingShell>
      <article className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
        <header className="flex flex-col gap-1">
          <h1 className="font-bold text-3xl tracking-tight">{t('legal.privacy.title')}</h1>
          <p className="text-muted-foreground text-sm">
            {t('legal.privacy.lastUpdated', { date: LEGAL_EFFECTIVE_DATE })}
          </p>
        </header>

        {PRIVACY_SECTIONS.map((section) => (
          <section key={section.headingKey} className="flex flex-col gap-2">
            <h2 className="font-semibold text-xl">{t(section.headingKey)}</h2>
            <p className="text-muted-foreground">{t(section.bodyKey, legalVars)}</p>
          </section>
        ))}
      </article>
    </MarketingShell>
  );
}
