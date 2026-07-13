'use client';

import type { PrimitiveDescriptor } from '@library/data/designSystem';
import {
  PRIMITIVE_AUTO_COMPONENTS,
  PRIMITIVE_OVERRIDE_COMPONENTS,
} from '@library/data/designSystemStories';
import { componentStateMeta } from '@library/lib/componentStates';
import { Button } from '@vybekiit/ui/button';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/** Generic state → prop mapping for auto-rendered leaf primitives. */
const STATE_PROPS: Readonly<Record<string, Record<string, unknown>>> = {
  disabled: { disabled: true },
  readonly: { readOnly: true },
  error: { 'aria-invalid': true },
};

const axisOptions = (descriptor: PrimitiveDescriptor, name: string): readonly string[] =>
  descriptor.axes.find((axis) => axis.name === name)?.options ?? [];

/** Render one auto-instance of a leaf primitive with the given extra props. */
const renderAuto = (descriptor: PrimitiveDescriptor, extra: Record<string, unknown>): ReactNode => {
  const Component = PRIMITIVE_AUTO_COMPONENTS[descriptor.name];
  if (Component === undefined) {
    return null;
  }
  const props: Record<string, unknown> = { ...descriptor.sampleProps, ...extra };
  if (descriptor.sampleClassName !== '') {
    props.className = descriptor.sampleClassName;
  }
  const children = descriptor.sampleChildren === '' ? undefined : descriptor.sampleChildren;
  return <Component {...props}>{children}</Component>;
};

/** A labelled swatch in an auto gallery section. */
const Swatch = ({ label, children }: { readonly label?: string; readonly children: ReactNode }) => (
  <div className="flex flex-col items-start gap-2">
    {label === undefined ? null : (
      <span className="font-medium text-muted-foreground text-xs">{label}</span>
    )}
    {children}
  </div>
);

/** A titled row of swatches (Variant / Size / State). */
const GallerySection = ({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) => (
  <div className="space-y-3">
    <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{title}</p>
    <div className="flex flex-wrap items-end gap-x-6 gap-y-5">{children}</div>
  </div>
);

/** Every cva variant, size, and canonical state of a leaf primitive, all at once. */
const AutoGallery = ({ descriptor }: { readonly descriptor: PrimitiveDescriptor }) => {
  const variants = axisOptions(descriptor, 'variant');
  const sizes = axisOptions(descriptor, 'size');
  const states = descriptor.states;
  const showStates = states.length > 1 || (states.length === 1 && states[0] !== 'default');

  if (variants.length === 0 && sizes.length === 0 && !showStates) {
    return <div className="flex min-h-16 items-center">{renderAuto(descriptor, {})}</div>;
  }

  return (
    <div className="space-y-8">
      {variants.length > 0 ? (
        <GallerySection title="Variant">
          {variants.map((variant) => (
            <Swatch key={variant} label={variant}>
              {renderAuto(descriptor, { variant })}
            </Swatch>
          ))}
        </GallerySection>
      ) : null}
      {sizes.length > 0 ? (
        <GallerySection title="Size">
          {sizes.map((size) => (
            <Swatch key={size} label={size}>
              {renderAuto(descriptor, { size })}
            </Swatch>
          ))}
        </GallerySection>
      ) : null}
      {showStates ? (
        <GallerySection title="State">
          {states.map((state) => (
            <Swatch key={state} label={componentStateMeta(state).label}>
              {renderAuto(descriptor, STATE_PROPS[state] ?? {})}
            </Swatch>
          ))}
        </GallerySection>
      ) : null}
    </div>
  );
};

/** The bordered preview area, honouring the RTL and dark toggles for the whole gallery. */
const PreviewStage = ({
  rtl,
  dark,
  children,
}: {
  readonly rtl: boolean;
  readonly dark: boolean;
  readonly children: ReactNode;
}) => (
  <div
    className={cn(
      'rounded-lg border bg-background p-6 text-foreground transition-colors md:p-8',
      dark && 'dark',
    )}
    dir={rtl ? 'rtl' : 'ltr'}
  >
    {children}
  </div>
);

/**
 * Live primitive gallery: every variant, size, and state laid out at once — no clicking.
 * RTL and dark are the only toggles; they re-render the whole gallery in that mode. Behavioral
 * primitives supply their own gallery via an override module; leaf primitives auto-render.
 *
 * @param props - The primitive descriptor to render.
 * @returns The primitive gallery.
 * @example
 * <PrimitiveStory descriptor={buttonDescriptor} />
 */
export const PrimitiveStory = ({ descriptor }: { readonly descriptor: PrimitiveDescriptor }) => {
  const [rtl, setRtl] = useState(false);
  const [dark, setDark] = useState(false);

  const OverrideComponent = PRIMITIVE_OVERRIDE_COMPONENTS[descriptor.name];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <Button
          aria-pressed={rtl}
          onClick={() => setRtl((value) => !value)}
          size="sm"
          variant={rtl ? 'default' : 'outline'}
        >
          RTL
        </Button>
        <Button
          aria-pressed={dark}
          onClick={() => setDark((value) => !value)}
          size="sm"
          variant={dark ? 'default' : 'outline'}
        >
          Dark
        </Button>
      </div>

      <PreviewStage dark={dark} rtl={rtl}>
        {OverrideComponent === undefined ? (
          <AutoGallery descriptor={descriptor} />
        ) : (
          <OverrideComponent />
        )}
      </PreviewStage>
    </div>
  );
};
