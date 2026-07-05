'use client';

import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@vybekiit/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@vybekiit/ui/input-group';
import { Tooltip, TooltipPopup, TooltipTrigger } from '@vybekiit/ui/tooltip';

export default function Particle() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <InputGroup>
      <InputGroupInput
        aria-label="Password with toggle visibility"
        placeholder="Enter your password"
        type={showPassword ? 'text' : 'password'}
      />
      <InputGroupAddon align="inline-end">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                size="icon-xs"
                variant="ghost"
              />
            }
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </TooltipTrigger>
          <TooltipPopup>{showPassword ? 'Hide password' : 'Show password'}</TooltipPopup>
        </Tooltip>
      </InputGroupAddon>
    </InputGroup>
  );
}
