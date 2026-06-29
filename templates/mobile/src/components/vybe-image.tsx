import { Image, type ImageProps } from 'expo-image';
import { resolveAssetDelivery } from '@vybekiit/assets';

type VybeImageProps = Omit<ImageProps, 'source'> & {
  /** Local require path, `/assets` path, or remote URL. */
  src: string | number;
  width?: number;
};

/**
 * Default image component for mobile — CDN URLs for remote uploads, local assets for bundled files.
 */
export function VybeImage({ src, width, style, ...props }: VybeImageProps) {
  const delivery = resolveAssetDelivery();
  let source: ImageProps['source'];

  if (typeof src === 'number') {
    source = src;
  } else if (src.startsWith('http://') || src.startsWith('https://')) {
    const urlOpts =
      width === undefined ? { format: 'auto' as const } : { width, format: 'auto' as const };
    source = { uri: delivery.url(src, urlOpts) };
  } else {
    source = src;
  }

  return <Image source={source} style={style} {...props} />;
}
