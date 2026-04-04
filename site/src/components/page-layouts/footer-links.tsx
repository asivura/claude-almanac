import Link from 'fumadocs-core/link';
import { Card, CardContent, CardTitle } from '@/components/ui/card';

// Shared footer block used by guide "Next steps" and case-study "Related".
// Accepts either plain strings (rendered as plain text, no link) or
// { title, href } objects (rendered as Fumadocs links so relative hrefs
// still resolve through the content-path remapping).

export type FooterLink = string | { title: string; href: string };

export interface FooterLinksProps {
  title: string;
  items?: FooterLink[];
}

export function FooterLinks({ title, items }: FooterLinksProps) {
  if (!items || items.length === 0) return null;

  return (
    <Card className="mt-8 not-prose">
      <CardContent className="pt-4 flex flex-col gap-2">
        <CardTitle>{title}</CardTitle>
        <ul className="flex flex-col gap-1 text-sm">
          {items.map((item, i) => {
            if (typeof item === 'string') {
              return (
                <li key={`${i}-${item}`} className="text-muted-foreground">
                  {item}
                </li>
              );
            }
            return (
              <li key={`${i}-${item.href}`}>
                <Link
                  href={item.href}
                  className="text-primary hover:underline"
                >
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
