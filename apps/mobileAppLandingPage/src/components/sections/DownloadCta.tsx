import {
  AppStoreButton,
  GooglePlayButton,
} from '@vybekiit-template-web/components/untitled/buttons/app-store-buttons';

import { DOWNLOAD_CTA } from '@/data/landingContent';

/**
 * Full-width accent band inviting the download, with both store badges.
 *
 * @returns The rendered download CTA band.
 * @example
 * <DownloadCta />
 */
export const DownloadCta = () => (
  <section className="bg-primary text-primary-foreground" id="download">
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-16 text-center md:px-8 md:py-20">
      <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
        {DOWNLOAD_CTA.title}
      </h2>
      <p className="max-w-xl text-base text-primary-foreground/80">{DOWNLOAD_CTA.subtitle}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <AppStoreButton size="lg" />
        <GooglePlayButton size="lg" />
      </div>
    </div>
  </section>
);
