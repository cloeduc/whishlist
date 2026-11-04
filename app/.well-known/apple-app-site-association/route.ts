import { appleAssociationResponse } from "@/src/site/app-links-config";

/** iOS universal links (feature 011): read on each request, so the variable can change without a rebuild. */
export const dynamic = "force-dynamic";

export function GET() {
  return appleAssociationResponse();
}
