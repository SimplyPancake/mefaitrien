import { getServerSession } from "#auth";
import type { H3Event } from "h3";

enum AllowType {
  ANYONE,
  AUTHENTICATED,
  ROLE,
}

// If not in configuration, then nobody can access!
//TODO: Move to nuxt config
const configuration = [
  { route: "/api/login", method: "post", allowType: AllowType.ANYONE },
  { route: "/api/logout", method: "post", allowType: AllowType.ANYONE },
  { route: "/api/session", method: "get", allowType: AllowType.ANYONE },
  { route: "/api/admin", method: "get", allowType: AllowType.ANYONE },
];

export default defineEventHandler((event: H3Event) => {});
