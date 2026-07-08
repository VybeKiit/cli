'use client';

import { VideoPlayer } from '@/components/kibo/video-player/index';

export default function VideoPlayerPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <VideoPlayer />
    </div>
  );
}
