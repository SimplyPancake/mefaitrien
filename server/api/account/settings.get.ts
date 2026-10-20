import prisma from "~/lib/prisma";
import { verifyToken } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  const { valid, id } = verifyToken(event);
  if (!valid || !id) {
    throw createError({ statusCode: 401, statusMessage: "Je moet ingelogd zijn." });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { email: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw createError({ statusCode: 401, statusMessage: "Dit account is niet actief." });
  }

  return { email: user.email };
});
