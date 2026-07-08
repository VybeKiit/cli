import { join } from 'node:path';
import { Effect } from 'effect';
import Image, { type ImageProps } from 'next/image';
import { resolveAssetDelivery, resolveLocalAssetSrc } from '@vybekiit/assets';
import { readNodeCwd } from '@/lib/nodeEnv';

interface VybeImageProps extends Omit<ImageProps, 'src'> {
  readonly src: string;
}

const resolveLocalAssetSrcOrOriginal = (src: string, publicDir: string): string => {
  const resolveProgram: Effect.Effect<string, never, never> = Effect.match(
    resolveLocalAssetSrc(src, publicDir),
    {
      onFailure: () => src,
      onSuccess: (resolvedSrc) => resolvedSrc,
    },
  );

  return Effect.runSync(resolveProgram);
};

/**
 * Default image component for build-optimized local assets and CDN transform URLs.
 *
 * @param props - Next image props plus a VybeKiit asset source.
 * @returns A Next image with the resolved local or remote asset URL.
 * @example
 * <VybeImage src="/hero.png" alt="Hero" width={1200} height={800} />
 */
export const VybeImage = ({ src, alt = '', ...props }: VybeImageProps) => {
  const delivery = Effect.runSync(resolveAssetDelivery());
  const publicDir = join(readNodeCwd(), 'public');

  let resolved = src;
  if (src.startsWith('http://') || src.startsWith('https://')) {
    const width = typeof props.width === 'number' ? props.width : undefined;
    resolved = delivery.url(
      src,
      width === undefined ? { format: 'auto' } : { width, format: 'auto' },
    );
  } else {
    resolved = resolveLocalAssetSrcOrOriginal(src, publicDir);
  }

  return <Image src={resolved} alt={alt} {...props} />;
};
