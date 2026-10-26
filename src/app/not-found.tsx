import Link from "next/link";
import { Cake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/shared/layouts";

export default function NotFoundPage() {
  return (
    <Section className="flex min-h-[75dvh] items-center justify-center">
      <Container className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Cake className="h-7 w-7" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Page Not Found (404)
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn&apos;t find the page or cake you were looking for. Head back
          to our Karachi bakery menu or track your order.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link href="/">Browse Menu</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/track">Track Order</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}
