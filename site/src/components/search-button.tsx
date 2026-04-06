'use client';

import { useSearchContext } from 'fumadocs-ui/contexts/search';

export function SearchButton() {
  const { setOpenSearch } = useSearchContext();

  return (
    <button
      type="button"
      onClick={() => setOpenSearch(true)}
      className="inline-flex items-center gap-2 rounded-md border border-fd-border bg-fd-background px-4 py-2 text-sm font-medium text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      Search documentation
      <kbd className="pointer-events-none hidden rounded border border-fd-border bg-fd-muted px-1.5 py-0.5 font-mono text-xs text-fd-muted-foreground sm:inline-block">
        ⌘K
      </kbd>
    </button>
  );
}
