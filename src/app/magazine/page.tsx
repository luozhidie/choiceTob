import { Suspense } from "react";
import MagazineClient from "./magazine-client";

export default function MagazinePage({
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
      <MagazineClient initialTab={searchParams.tab} />
    </Suspense>
  );
}
