'use client';

import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import * as React from 'react';
import { Button } from './button';
import { cn } from './utils';

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

interface CarouselProps {
  readonly opts?: CarouselOptions;
  readonly plugins?: CarouselPlugin;
  readonly orientation?: 'horizontal' | 'vertical';
  readonly setApi?: (api: CarouselApi) => void;
}

type CarouselContextProps = CarouselProps & {
  readonly carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  readonly api: ReturnType<typeof useEmblaCarousel>[1];
  readonly scrollPrev: () => void;
  readonly scrollNext: () => void;
  readonly canScrollPrev: boolean;
  readonly canScrollNext: boolean;
};

type CarouselStateParams = {
  readonly api: CarouselApi;
  readonly setApi: ((api: CarouselApi) => void) | undefined;
};

type CarouselState = {
  readonly scrollPrev: () => void;
  readonly scrollNext: () => void;
  readonly canScrollPrev: boolean;
  readonly canScrollNext: boolean;
};

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

/**
 * Read the carousel context created by {@link Carousel}.
 *
 * @returns The carousel state and controls.
 * @throws When called outside of a carousel provider.
 * @example
 * const { scrollNext } = useCarousel();
 */
const useCarousel = (): CarouselContextProps => {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error('useCarousel must be used within a <Carousel />');
  }

  return context;
};

/**
 * Bind Embla controls to React state for a carousel instance.
 *
 * @param params - Current Embla API and optional API callback.
 * @returns Stable scroll handlers plus current scroll availability.
 * @example
 * const controls = useCarouselState({ api, setApi });
 */
const useCarouselState = ({ api, setApi }: CarouselStateParams): CarouselState => {
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const onSelect = React.useCallback((selectedApi: CarouselApi) => {
    if (!selectedApi) {
      return;
    }

    setCanScrollPrev(selectedApi.canScrollPrev());
    setCanScrollNext(selectedApi.canScrollNext());
  }, []);

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = React.useCallback(() => {
    api?.scrollNext();
  }, [api]);

  React.useEffect(() => {
    if (!(api && setApi)) {
      return;
    }

    setApi(api);
  }, [api, setApi]);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    onSelect(api);
    api.on('reInit', onSelect);
    api.on('select', onSelect);

    return () => {
      api.off('select', onSelect);
    };
  }, [api, onSelect]);

  return { scrollPrev, scrollNext, canScrollPrev, canScrollNext };
};

/**
 * Render the Carousel component.
 *
 * @param props - Component props forwarded to the underlying UI primitive.
 * @returns The rendered Carousel component.
 * @example
 * <Carousel />;
 */
const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(({ orientation = 'horizontal', opts, setApi, plugins, className, children, ...props }, ref) => {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === 'horizontal' ? 'x' : 'y',
    },
    plugins,
  );
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarouselState({
    api,
    setApi,
  });

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext],
  );

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        opts,
        orientation,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        ref={ref}
        onKeyDownCapture={handleKeyDown}
        className={cn('relative', className)}
        role="region"
        aria-roledescription="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
});
Carousel.displayName = 'Carousel';

/**
 * Render the Carousel Content component.
 *
 * @param props - Component props forwarded to the underlying UI primitive.
 * @returns The rendered Carousel Content component.
 * @example
 * <CarouselContent />;
 */
const CarouselContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { carouselRef, orientation } = useCarousel();

    return (
      <div ref={carouselRef} className="overflow-hidden">
        <div
          ref={ref}
          className={cn(
            'flex',
            orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
CarouselContent.displayName = 'CarouselContent';

/**
 * Render the Carousel Item component.
 *
 * @param props - Component props forwarded to the underlying UI primitive.
 * @returns The rendered Carousel Item component.
 * @example
 * <CarouselItem />;
 */
const CarouselItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { orientation } = useCarousel();

    return (
      <div
        ref={ref}
        role="group"
        aria-roledescription="slide"
        className={cn(
          'min-w-0 shrink-0 grow-0 basis-full',
          orientation === 'horizontal' ? 'pl-4' : 'pt-4',
          className,
        )}
        {...props}
      />
    );
  },
);
CarouselItem.displayName = 'CarouselItem';

/**
 * Render the Carousel Previous component.
 *
 * @param props - Component props forwarded to the underlying UI primitive.
 * @returns The rendered Carousel Previous component.
 * @example
 * <CarouselPrevious />;
 */
const CarouselPrevious = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, variant = 'outline', size = 'icon', ...props }, ref) => {
    const { orientation, scrollPrev, canScrollPrev } = useCarousel();

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          'absolute h-8 w-8 rounded-full',
          orientation === 'horizontal'
            ? 'top-1/2 -left-12 -translate-y-1/2'
            : '-top-12 left-1/2 -translate-x-1/2 rotate-90',
          className,
        )}
        disabled={!canScrollPrev}
        onClick={scrollPrev}
        {...props}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">Previous slide</span>
      </Button>
    );
  },
);
CarouselPrevious.displayName = 'CarouselPrevious';

/**
 * Render the Carousel Next component.
 *
 * @param props - Component props forwarded to the underlying UI primitive.
 * @returns The rendered Carousel Next component.
 * @example
 * <CarouselNext />;
 */
const CarouselNext = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, variant = 'outline', size = 'icon', ...props }, ref) => {
    const { orientation, scrollNext, canScrollNext } = useCarousel();

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          'absolute h-8 w-8 rounded-full',
          orientation === 'horizontal'
            ? 'top-1/2 -right-12 -translate-y-1/2'
            : '-bottom-12 left-1/2 -translate-x-1/2 rotate-90',
          className,
        )}
        disabled={!canScrollNext}
        onClick={scrollNext}
        {...props}
      >
        <ArrowRight className="h-4 w-4" />
        <span className="sr-only">Next slide</span>
      </Button>
    );
  },
);
CarouselNext.displayName = 'CarouselNext';

export {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
};
