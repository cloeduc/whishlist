"use client";

import { ErrorContent } from "@/components/site/error-content";

export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return <ErrorContent retry={retry} />;
}
