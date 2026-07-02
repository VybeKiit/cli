import Image, { type ImageProps } from 'next/image';
import { join } from 'node:path';
import { resolveAssetDelivery, resolveLocalAssetSrc } from '@/vybekiit/assets';
import { readNodeCwd } from '@/lib/nodeEnv';

type VybeImageProps = Omit<ImageProps, 'src'> & {
  src: string;
};

/**
 * Default image component — uses build-optimized local assets and CDN transform URLs
 * for uploads and remote images.
 */
export function VybeImage({ src, alt, ...props }: VybeImageProps) {
  const delivery = resolveAssetDelivery();
  const publicDir = join(readNodeCwd(), 'public');

  let resolved = src;
  if (src.startsWith('http://') || src.startsWith('https://')) {
    const width = typeof props.width === 'number' ? props.width : undefined;
    resolved = delivery.url(
      src,
      width === undefined ? { format: 'auto' } : { width, format: 'auto' },
    );
  } else {
    resolved = resolveLocalAssetSrc(src, publicDir);
  }

  return <Image src={resolved} alt={alt} {...props} />;
}
