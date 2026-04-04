import * as React from 'react';
import { cn } from '@/lib/cn';

// Minimal shadcn-style Badge primitive. Variants map to theme tokens:
//   default   -> primary (terracotta accent)
//   secondary -> muted bg
//   outline   -> border-only
type Variant = 'default' | 'secondary' | 'outline';

const variantClasses: Record<Variant, string> = {
  default:
    'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
  secondary:
    'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'text-foreground',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({
  className,
  variant = 'secondary',
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
