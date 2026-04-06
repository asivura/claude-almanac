import Link from 'next/link';
import { SearchButton } from '@/components/search-button';

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm font-medium text-fd-primary">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-fd-foreground sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-4 text-fd-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="mt-8">
        <SearchButton />
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/docs"
          className="inline-flex items-center rounded-md bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
        >
          Browse documentation
        </Link>
        <Link
          href="/"
          className="inline-flex items-center rounded-md border border-fd-border bg-fd-background px-4 py-2 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
        >
          Go home
        </Link>
        <Link
          href="/llms.txt"
          className="inline-flex items-center rounded-md border border-fd-border bg-fd-background px-4 py-2 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
        >
          View full index
        </Link>
      </div>
    </main>
  );
}
