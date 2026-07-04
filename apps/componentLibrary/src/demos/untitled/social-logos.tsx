'use client';

import {
  DribbleLogo,
  FigmaLogo,
  FigmaLogoOutlined,
  GoogleLogo,
} from '@/components/untitled/buttons/social-logos';

export default function SocialLogosPreview() {
  return (
    <div className="flex min-h-[200px] flex-wrap items-center justify-center gap-3 overflow-hidden p-6">
      <GoogleLogo />
      <FigmaLogo />
      <FigmaLogoOutlined />
      <DribbleLogo />
    </div>
  );
}
