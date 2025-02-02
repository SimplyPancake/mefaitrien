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
  { route: "/api/admin", method: "get", allowType: AllowType.ROLE, role: "admin" },
];

export default defineEventHandler(async (event: H3Event) => {
  const route = event.node.req.url;
  const method = event.method.toLowerCase();

  const routeConfig = configuration.find(
    (config) => config.route === route && config.method === method
  );

  if (!routeConfig) {
    return new Response("Forbidden", { status: 403 });
  }

  if (routeConfig.allowType === AllowType.ANYONE) {
    return;
  }

  const session = await getServerSession(event);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (routeConfig.allowType === AllowType.AUTHENTICATED) {
    event.context.user = session;
    return;
  }

  if (routeConfig.allowType === AllowType.ROLE) {
    const userRole = session.role;

    if (userRole !== routeConfig.role) {
      return new Response("Forbidden", { status: 403 });
    }

    event.context.user = session;
    return;
  }
});
