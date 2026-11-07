import React from 'react';
import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export interface RatingDisplayProps {
  rating: number;
  reviewCount?: number;
  showStars?: boolean;
  className?: string;
}

export function RatingDisplay({
  rating,
  reviewCount,
  showStars = true,
  className,
}: RatingDisplayProps) {
  const t = useTranslations('common');
  return (
    <div
      className={cn('inline-flex items-center gap-2', className)}
      aria-label={t('rated', { rating: rating.toFixed(1) })}
    >
      {showStars ? (
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((index) => {
            const filled = index <= Math.round(rating);
            return (
              <Star
                key={index}
                className={cn(
                  'h-3 w-3',
                  filled
                    ? 'fill-foreground text-foreground'
                    : 'fill-transparent text-border-strong/35'
                )}
              />
            );
          })}
        </div>
      ) : (
        <Star className="h-3 w-3 fill-foreground text-foreground" />
      )}
      <span className="font-mono text-xs font-medium tabular-nums text-foreground">
        {rating.toFixed(1)}
      </span>
      {typeof reviewCount === 'number' && (
        <span className="font-mono text-[11px] text-foreground-subtle">
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
