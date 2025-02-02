import * as bcrypt from "bcrypt";
import { H3Event } from "h3";
import jwt from "jsonwebtoken";
import prisma from "~/lib/prisma";

const BCRYPT_SALT_ROUNDS = 15;

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const generateToken = (userId: number, secret: string): string => {
  return jwt.sign({ id: userId }, secret, { expiresIn: "12h" });
};

export const verifyToken = (event: H3Event): { valid: boolean; id?: number } => {
  const config = useRuntimeConfig(event);
  const authHeader = getHeader(event, "Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false };
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
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
export const getSessionData = async (userId: number) => {
  let user = await prisma.user.findFirst({
    where: { id: userId },
    include: { cookingGroup: true },
  });

  if (!user) {
    throw new Error("No user found");
  }

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    cookingGroup: user.cookingGroup?.name,
    role: user.role,
  };
}