import PageMeta from '@/components/common/PageMeta';
import { RichTextEditor } from '@/components/modern-ui/rich-text-editor';
import { useI18n } from '@/lib/i18n';
import { useState } from 'react';

export default function ContentEditorPage() {
  const { t } = useI18n();
  const [html, setHtml] = useState('<p></p>');

  return (
    <>
      <PageMeta title={t('content.title')} description={t('content.subtitle')} />
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {t('content.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('content.subtitle')}</p>
        </div>
        <RichTextEditor value={html} onChange={setHtml} />
        <p className="text-xs text-gray-400">Draft length: {html.length} chars</p>
      </div>
    </>
  );
}
