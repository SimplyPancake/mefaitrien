import prisma from "@@/lib/prisma";
import { AllowType, type SessionEvent } from "~/types";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { number, object } from "yup";

const handlerFunc = async (event: SessionEvent) => {
  const { userId, cookingpoints } = event.data;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "Gebruiker niet gevonden" });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { cookingpoints },
  });

  return { success: true };
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(
    event,
    handlerFunc,
    object({
      userId: number().integer().required(),
      cookingpoints: number().integer().min(0).required(),
    })
  ).handle({
    route: "/api/cooking/points/update",
    method: "POST",
    allowType: AllowType.ROLE,
    role: ["COOKING"],
  });
});
