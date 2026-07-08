import { Gemini } from '@/components/ui/svgs/gemini';
import { GooglePaLM } from '@/components/ui/svgs/google-palm';
import { Replit } from '@/components/ui/svgs/replit';
import { MediaWiki } from '@/components/ui/svgs/media-wiki';
import { MagicUI } from '@/components/ui/svgs/magic-ui';
import { VSCodium } from '@/components/ui/svgs/vs-codium';

export default function Integrations() {
  return (
    <section>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-muted-foreground font-medium">Integrate with : </p>
          <div className="max-w-2xs flex flex-wrap gap-3 divide-x *:pr-3">
            <div>
              <Gemini className="m-auto size-5" />
            </div>
            <div>
              <GooglePaLM className="m-auto size-5" />
            </div>
            <div>
              <Replit className="m-auto size-5" />
            </div>
            <div>
              <MediaWiki className="m-auto size-5" />
            </div>
            <div>
              <MagicUI className="m-auto size-5" />
            </div>
            <div>
              <VSCodium className="m-auto size-5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
