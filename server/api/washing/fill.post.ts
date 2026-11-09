import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import type { SessionEvent } from "~/types";
import { invalidateWashingPoints } from "~/server/utils/washingPoints";
import { invalidateLongestEater } from "~/server/utils/longestEater";
import { array, number, object } from "yup";

const schema = object({
  assignedDayId: number().integer().required(),
  washUserOneId: number().integer().required(),
  washUserTwoId: number().integer().required(),
  eaters: array()
    .of(
      object({
        userId: number().integer().required(),
        amountEat: number().integer().min(1).required(),
      }).required()
    )
    .test(
      "unique-eaters",
      "Een gebruiker kan maar één keer als mee-eter worden toegevoegd.",
      (eaters) => !eaters || new Set(eaters.map(({ userId }) => userId)).size === eaters.length
    )
    .default([]),
});

const handlerFunc = async (event: SessionEvent) => {
  const { assignedDayId, washUserOneId, washUserTwoId, eaters } = event.data;
  const assignedDay = await prisma.assignedDay.findUnique({
    where: { id: assignedDayId },
    select: { cookingGroupId: true },
  });

  if (!assignedDay) {
    throw createError({ statusCode: 404, statusMessage: "Kookdag niet gevonden." });
  }

  const washerIds = [...new Set([washUserOneId, washUserTwoId])];
  const eaterIds = (eaters ?? []).map(({ userId }: { userId: number }) => userId);
  // People already on this registration stay valid even if they went inactive or
  // changed group since, otherwise old meals could not be corrected anymore.
  const existing = await prisma.washingRegistration.findUnique({
    where: { assignedDayId },
    select: {
      washUserOneId: true,
      washUserTwoId: true,
      washingRegistrationEatUsers: { select: { userId: true } },
    },
  });
  const keptWashers = new Set(existing ? [existing.washUserOneId, existing.washUserTwoId] : []);
  const keptEaters = new Set(existing?.washingRegistrationEatUsers.map(({ userId }) => userId));
  const participants = await prisma.user.findMany({
    where: {
      isActive: true,
      OR: [
        { id: { in: washerIds } },
        { id: { in: eaterIds }, cookingGroupId: assignedDay.cookingGroupId },
      ],
    },
    select: { id: true },
  });
  const participantIds = new Set(participants.map(({ id }) => id));
  if (
    washerIds.some((id) => !participantIds.has(id) && !keptWashers.has(id)) ||
    eaterIds.some((id) => !participantIds.has(id) && !keptEaters.has(id))
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Afwassers moeten actief zijn en mee-eters moeten bij de kookgroep horen.",
    });
  }

  await prisma.washingRegistration.upsert({
    where: { assignedDayId },
    create: {
      assignedDayId,
      cookingGroupId: assignedDay.cookingGroupId,
      washUserOneId,
      washUserTwoId,
      washingRegistrationEatUsers: {
        create: eaters ?? [],
      },
    },
    update: {
      washUserOneId,
      washUserTwoId,
      washingRegistrationEatUsers: {
        deleteMany: {},
        create: eaters ?? [],
      },
    },
  });
  await Promise.all([invalidateWashingPoints(), invalidateLongestEater()]);

  return { success: true };
};

export default defineEventHandler(async (event) =>
  new BaseEventHandler(event, handlerFunc, schema).handle({
    route: "/api/washing/fill",
    method: "POST",
    allowType: "AUTHENTICATED",
  })
);
