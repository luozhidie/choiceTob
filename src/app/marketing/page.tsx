import { Suspense } from "react";
import MarketingClient from "./marketing-client";

export default function MarketingPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
        </div>
      }
    >
      <MarketingClient initialTab={searchParams.tab} />
    </Suspense>
  );
}
