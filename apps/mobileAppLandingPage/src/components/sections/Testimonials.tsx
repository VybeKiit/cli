import { Avatar, AvatarFallback } from '@vybekiit/ui/avatar';
import { Card, CardContent } from '@vybekiit/ui/card';

import { SectionShell } from '@/components/ui/SectionShell';
import { StarRating } from '@/components/ui/StarRating';
import { TESTIMONIALS, TESTIMONIALS_HEADING } from '@/data/landingContent';

/**
 * Social-proof section — heading plus three testimonial cards mapped from the
 * `TESTIMONIALS` data array, each with a star rating, quote, and an initials avatar.
 *
 * @returns The rendered testimonials section.
 * @example
 * <Testimonials />
 */
export const Testimonials = () => (
  <SectionShell className="py-20 md:py-28" id="testimonials">
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
        {TESTIMONIALS_HEADING.title}
      </h2>
    </div>

    <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
      {TESTIMONIALS.map(({ key, quote, name, role, initials, stars }) => (
        <Card key={key} className="h-full border-border">
          <CardContent className="flex h-full flex-col gap-4 p-6">
            <StarRating filled={stars} />
            <p className="flex-1 text-sm leading-relaxed text-foreground">&ldquo;{quote}&rdquo;</p>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{name}</p>
                <p className="text-xs text-muted-foreground">{role}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </SectionShell>
);
