'use client';

import { LinkIcon, MailIcon, Share2Icon } from 'lucide-react';
import type { ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Group, GroupSeparator } from '@/components/ui/group';
import {
  Tooltip,
  TooltipCreateHandle,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const tooltipHandle = TooltipCreateHandle<ComponentType>();

const ShareLinkContent = () => <span>Copy shareable link</span>;

const ShareEmailContent = () => <span>Share via email</span>;

const ShareSocialContent = () => <span>Share to social media</span>;

export default function Particle() {
  return (
    <TooltipProvider>
      <Group aria-label="Share options" orientation="vertical">
        <TooltipTrigger
          handle={tooltipHandle}
          payload={ShareLinkContent}
          render={<Button aria-label="Copy link" size="icon" variant="outline" />}
        >
          <LinkIcon aria-hidden="true" />
        </TooltipTrigger>
        <GroupSeparator orientation="horizontal" />
        <TooltipTrigger
          handle={tooltipHandle}
          payload={ShareEmailContent}
          render={<Button aria-label="Share via email" size="icon" variant="outline" />}
        >
          <MailIcon aria-hidden="true" />
        </TooltipTrigger>
        <GroupSeparator orientation="horizontal" />
        <TooltipTrigger
          handle={tooltipHandle}
          payload={ShareSocialContent}
          render={<Button aria-label="Share to social" size="icon" variant="outline" />}
        >
          <Share2Icon aria-hidden="true" />
        </TooltipTrigger>
      </Group>
      <Tooltip handle={tooltipHandle}>
        {({ payload: Payload }) => (
          <TooltipPopup className="max-w-40" side="right">
            {Payload !== undefined && <Payload />}
          </TooltipPopup>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
