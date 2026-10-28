import { apiPreflight } from "@/src/server/api/http";
import { labelItemRoutes } from "@/src/server/api/label-routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = labelItemRoutes("type", "typeId");

export const OPTIONS = apiPreflight;
