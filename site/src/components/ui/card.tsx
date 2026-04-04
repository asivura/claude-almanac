import * as React from 'react';
import { cn } from '@/lib/cn';

// Minimal shadcn-style Card primitives backed by the theme tokens in
// theme.css (--card, --card-foreground, --border). Kept local so we don't
// need to install the full shadcn CLI for the couple of layout banners
// that use them.

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-1.5 p-4', className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 pt-0', className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'text-sm font-semibold leading-none tracking-tight',
        className,
      )}
      {...props}
    />
  );
}
