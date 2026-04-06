import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { GraphView } from '@/components/graph-view';
import { buildGraph } from '@/lib/build-graph';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Knowledge Graph',
  description: 'Interactive graph of all documentation pages and their relationships.',
};

export default function GraphPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-2">Knowledge Graph</h1>
        <p className="text-fd-muted-foreground mb-6">
          Interactive map of documentation pages. Hover to see descriptions, click to navigate.
        </p>
        <GraphView graph={buildGraph()} />
      </main>
    </HomeLayout>
  );
}
