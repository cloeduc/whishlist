import { apiPreflight } from "@/src/server/api/http";
import { labelCollectionRoute } from "@/src/server/api/label-routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = labelCollectionRoute("person");

export const OPTIONS = apiPreflight;
