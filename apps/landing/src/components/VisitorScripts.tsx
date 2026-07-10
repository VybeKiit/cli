import { resolveAnalyticsProvider } from '@vybekiit/analytics';
import { Effect } from 'effect';
import Script from 'next/script';
import { readNodeEnv } from '@/lib/nodeEnv';

/**
 * Inject Google Tag Manager when a public GTM container id is configured.
 *
 * @returns GTM script elements, or null when `NEXT_PUBLIC_GTM_ID` is unset.
 * @example
 * <GoogleTagManager />
 */
const GoogleTagManager = () => {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  if (gtmId === undefined || gtmId.length === 0) {
    return null;
  }

  return (
    <>
      {/* lazyOnload: GTM is ~110 KB and competes with mobile LCP/TBT when afterInteractive */}
      <Script id="gtm-loader" strategy="lazyOnload">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
};

/**
 * Inject Google Analytics (gtag) when a measurement id is set and GTM is not.
 *
 * @returns gtag script elements, or null when unset / GTM is preferred.
 * @example
 * <GoogleAnalyticsGtag />
 */
const GoogleAnalyticsGtag = () => {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (
    (gtmId !== undefined && gtmId.length > 0) ||
    measurementId === undefined ||
    measurementId.length === 0
  ) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="lazyOnload"
      />
      <Script id="ga-gtag" strategy="lazyOnload">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());gtag('config', '${measurementId}');`}
      </Script>
    </>
  );
};

/**
 * Resolve analytics at the server edge and inject Plausible (or other non-SDK)
 * script config. PostHog on the store uses `posthog-js` via
 * `instrumentation-client.ts` (`NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`) — skip the
 * legacy inline snippet so events are not double-counted.
 *
 * @returns Script tags for the configured analytics provider, or null.
 * @example
 * await AnalyticsScript();
 */
const AnalyticsScript = async () => {
  const config = await Effect.runPromise(
    resolveAnalyticsProvider(readNodeEnv()).pipe(
      Effect.flatMap((analytics) => {
        if (analytics.name === 'posthog') {
          // posthog-js owns the client when NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is set.
          return Effect.succeed(null);
        }
        return analytics.getScriptConfig();
      }),
      Effect.catchAll(() => Effect.succeed(null)),
    ),
  );

  if (config === null) {
    return null;
  }

  if (config.inlineScript !== undefined && config.inlineScript.length > 0) {
    return (
      <Script id="vybe-analytics-inline" strategy="lazyOnload">
        {config.inlineScript}
      </Script>
    );
  }

  if (config.src === undefined || config.src.length === 0) {
    return null;
  }

  return (
    <Script
      id="vybe-analytics-src"
      src={config.src}
      strategy="lazyOnload"
      data-domain={config.domain}
      defer={true}
    />
  );
};

/**
 * Visitor instrumentation — Google Tag + product analytics. No-ops without env.
 *
 * @returns Script injectors for GTM/GA and analytics providers.
 * @example
 * <VisitorScripts />
 */
export const VisitorScripts = async () => (
  <>
    <GoogleTagManager />
    <GoogleAnalyticsGtag />
    <AnalyticsScript />
  </>
);
