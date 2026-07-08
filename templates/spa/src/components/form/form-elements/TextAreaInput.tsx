import { useState } from 'react';
import { ComponentCard } from '@/components/common/ComponentCard';
import { TextArea } from '@/components/form/input/TextArea';
import { Label } from '@/components/form/Label';

export const TextAreaInput = () => {
  const [message, setMessage] = useState('');
  const [messageTwo, setMessageTwo] = useState('');
  return (
    <ComponentCard title="Textarea input field">
      <div className="space-y-6">
        {/* Default TextArea */}
        <div>
          <Label>Description</Label>
          <TextArea value={message} onChange={(value) => setMessage(value)} rows={6} />
        </div>

        {/* Disabled TextArea */}
        <div>
          <Label>Description</Label>
          <TextArea rows={6} disabled={true} />
        </div>

        {/* Error TextArea */}
        <div>
          <Label>Description</Label>
          <TextArea
            rows={6}
            value={messageTwo}
            error={true}
            onChange={(value) => setMessageTwo(value)}
            hint="Please enter a valid message."
          />
        </div>
      </div>
    </ComponentCard>
  );
};
