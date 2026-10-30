import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * Dark marbled background drawn with SVG noise, so the auth screens need no
 * image assets. `seed` changes the pattern.
 */
export function MarbleTexture({ seed = 4, className }: { seed?: number; className?: string }) {
  const id = useId();

  return (
    <svg className={cn('absolute inset-0 size-full', className)} aria-hidden preserveAspectRatio="none">
      <defs>
        <filter id={`${id}-veins`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="turbulence" baseFrequency="0.0035 0.0055" numOctaves="7" seed={seed} />
          <feColorMatrix
            values="0 0 0 0 0.66
                    0 0 0 0 0.88
                    0 0 0 0 0.86
                    0 0 0 1 0"
          />
          {/* Only the darkest turbulence values become visible: thin, sharp veins. */}
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0.95 0.3 0.04 0 0 0 0 0 0 0" />
          </feComponentTransfer>
        </filter>
        <filter id={`${id}-clouds`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.0022" numOctaves="3" seed={seed + 7} />
          <feColorMatrix
            values="0 0 0 0 0.05
                    0 0 0 0 0.24
                    0 0 0 0 0.25
                    1.5 0 0 0 -0.6"
          />
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="#060f11" />
      <rect width="100%" height="100%" filter={`url(#${id}-clouds)`} />
      <rect width="100%" height="100%" filter={`url(#${id}-veins)`} opacity="0.7" />
    </svg>
  );
}
