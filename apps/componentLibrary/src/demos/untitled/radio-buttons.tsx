'use client';

import {
  RadioButton,
  RadioButtonBase,
  RadioGroup,
} from '@/components/untitled/radio-buttons/radio-buttons';

export default function RadioButtonsPreview() {
  return (
    <div className="flex min-h-[200px] flex-wrap items-center justify-center gap-3 overflow-hidden p-6">
      <RadioButtonBase />
      <RadioButton />
      <RadioGroup />
    </div>
  );
}
