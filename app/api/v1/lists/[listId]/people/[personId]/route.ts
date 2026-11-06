import { apiPreflight } from "@/src/server/api/http";
import { labelItemRoutes } from "@/src/server/api/label-routes";

export const runtime = "nodejs";

export const { PATCH, DELETE } = labelItemRoutes("person", "personId");

export const OPTIONS = apiPreflight;
