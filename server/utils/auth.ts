import { getServerSession } from "#auth";
import prisma from "~/lib/prisma";
import * as bcrypt from "bcrypt";
import { H3Event } from "h3";
import jwt from "jsonwebtoken";
import { AllowType, type ServerAuthConfig, type SessionDataDto } from "@@/types.ts";
import { Role } from "~/generated/prisma/enums";

const config = useRuntimeConfig();
const BCRYPT_SALT_ROUNDS = 15;

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const generateToken = (userId: number, secret: string): string => {
  if (!secret) {
    throw new Error("JWT signing secret is missing. Set NUXT_JWT_SECRET in the runtime environment.");
  }

  return jwt.sign({ id: userId }, secret, { expiresIn: "12h" });
};

// verifyToken used with an event that has an auth header.
export const verifyToken = (event: H3Event): { valid: boolean; id?: number } => {
  const config = useRuntimeConfig(event);
  const authHeader = getHeader(event, "Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false };
  }

  const token = authHeader.split(" ")[1];
  const secret = config.jwtSecret;

  if (!secret) {
    throw new Error("JWT signing secret is missing. Set NUXT_JWT_SECRET in the runtime environment.");
  }

  try {
    const decoded = jwt.verify(token, secret);
    const { id, exp } = decoded as { id: number; exp: number };

    if (Date.now() >= exp * 1000) {
      return { valid: false };
    }

    return { valid: true, id };
  } catch (error) {
    return { valid: false };
  }
};

// No seeming nice access to SessionData (https://auth.sidebase.io/guide/local/session-data)
export const getSessionData = async (userId: number): Promise<SessionDataDto> => {
  let user = await prisma.user.findFirst({
    where: { id: userId },
    include: { cookingGroup: true, roles: true },
  });

  if (!user) {
    throw new Error("No user found");
  }

  if (!user.isActive) {
    throw createError({ statusCode: 401, statusMessage: "This account is inactive" });
  }

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    cookingGroup: user.cookingGroup?.name ?? "",
    roles: user.roles.map(({ role }) => role),
  };
};

export const getSessionDataEvent = async (event: H3Event) => {
  const { valid, id } = verifyToken(event);

  if (!valid || !id) {
    throw new Error("No valid session");
  }

  return getSessionData(id);
};

export const checkAccess = async (
  event: H3Event
): Promise<{ granted: boolean; sessionData?: SessionDataDto }> => {
  let route = event.node.req.url; // /api/login?iweijofw=efwfw
  let method = event.method;

  let routeConfig = config.authMiddleware.routes as ServerAuthConfig[];

  let settings = routeConfig.find(
    (x) => route!.startsWith(x.route) && x.method.toLowerCase() == method.toLowerCase()
  );

  if (!settings) {
    // Route not defined; so disallow all!
    console.log(`Route ${route} - ${method} not found in configuration`);
    return { granted: false };
  }

  return checkAccessConfig(event, settings);
};

export const checkAccessConfig = async (
  event: H3Event,
  settings: ServerAuthConfig
): Promise<{ granted: boolean; sessionData?: SessionDataDto }> => {
  // Route found!
  if (settings.allowType == "ANYONE" || settings.allowType == AllowType.ANYONE) {
    return { granted: true };
  }

  if (settings.allowType == "AUTHENTICATED" || settings.allowType == AllowType.AUTHENTICATED
    || settings.allowType == "ROLE" || settings.allowType == AllowType.ROLE) {
    const { valid, id } = verifyToken(event);

    if (!valid || !id) {
      return { granted: false };
    }

    if (settings.allowType == "ROLE" || settings.allowType == AllowType.ROLE) {
      let userData = await getSessionDataEvent(event);

      // Check if role is in array
      const userRoles = userData.roles.map((role) => role.toLocaleLowerCase());
      const roleExists = settings.role!.some((role) => userRoles.includes(role.toLocaleLowerCase()));
      const canBeGranted = roleExists || userRoles.includes(Role.ADMIN.toLocaleLowerCase());
      return { granted: canBeGranted, sessionData: userData };
    }

    return { granted: true, sessionData: await getSessionData(id) };
  }

  return { granted: false };
};
