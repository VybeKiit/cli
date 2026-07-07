import { Effect } from 'effect';
import { Image, type ImageProps } from 'expo-image';
import { resolveAssetDelivery } from '@vybekiit/assets';

type VybeImageProps = Omit<ImageProps, 'source'> & {
  /** Local require path, `/assets` path, or remote URL. */
  src: string | number;
  width?: number;
};

/**
 * Default image component for mobile assets and remote CDN URLs.
 *
 * @param props - Expo image props plus a VybeKiit asset source.
 * @returns An Expo image with the resolved local or remote asset URL.
 * @example
 * <VybeImage src="/hero.png" style={{ width: 240, height: 160 }} />
 */
export const VybeImage = (props: VybeImageProps) => {
  const { src, width, ...imageProps } = props;
  const delivery = Effect.runSync(resolveAssetDelivery());
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

  return <Image source={source} {...imageProps} />;
};
