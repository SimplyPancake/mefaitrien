import { PrismaClient } from "@prisma/client";

import { verifyToken } from "../../utils/auth";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const { valid, id } = verifyToken(event);

  if (!valid) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Remove the token from the list of active tokens
  await prisma.user.update({
    where: { id },
    data: { refreshToken: null },
  });

  return new Response("Logged out successfully", { status: 200 });
});
