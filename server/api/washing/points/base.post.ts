import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { AllowType, type SessionEvent } from "~/types";
import { Role } from "~/generated/prisma/enums";
import { number, object } from "yup";

const schema = object({
  userId: number().integer().required(),
  basePoints: number().integer().required(),
});

const handlerFunc = async (event: SessionEvent) => {
  const { userId, basePoints } = event.data;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "Gebruiker niet gevonden." });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { washingpointsBase: basePoints },
  });
  return { success: true };
};

export default defineEventHandler(async (event) =>
  new BaseEventHandler(event, handlerFunc, schema).handle({
    route: "/api/washing/points/base",
    method: "POST",
    allowType: AllowType.ROLE,
    role: [Role.ADMIN],
  })
);
