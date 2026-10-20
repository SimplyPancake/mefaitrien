import prisma from "@@/lib/prisma";
import { AllowType, type SessionEvent } from "~/types";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { migrateUserCookingGroup } from "~/server/utils/functions";
import { number, object } from "yup";

const handlerFunc = async (event: SessionEvent) => {
  const { userId, cookingGroupId } = event.data;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, cookingGroupId: true },
  });

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "Gebruiker niet gevonden" });
  }

  if (cookingGroupId !== null) {
    const cookingGroup = await prisma.cookingGroup.findUnique({
      where: { id: cookingGroupId },
      select: { id: true },
    });
    if (!cookingGroup) {
      throw createError({ statusCode: 400, statusMessage: "Kookgroep niet gevonden" });
    }
  }

  if (user.cookingGroupId !== cookingGroupId) {
    await migrateUserCookingGroup(userId, cookingGroupId);
    await prisma.user.update({
      where: { id: userId },
      data: { cookingGroupId },
    });
  }

  return { success: true };
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(
    event,
    handlerFunc,
    object({
      userId: number().integer().required(),
      cookingGroupId: number().integer().nullable().defined(),
    })
  ).handle({
    route: "/api/cooking/points/group",
    method: "POST",
    allowType: AllowType.ROLE,
    role: ["COOKING"],
  });
});
