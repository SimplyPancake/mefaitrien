import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { AllowType } from "~/types";
import type { SessionEvent } from "~/types";
import { Role } from "~/generated/prisma/enums";
import { number, object } from "yup";

const schema = object({
  penaltyId: number().integer().required(),
});

const handlerFunc = async (event: SessionEvent) => {
  const { penaltyId } = event.data;
  const penalty = await prisma.washingPenalty.findUnique({
    where: { id: penaltyId },
    select: { id: true },
  });
  if (!penalty) {
    throw createError({ statusCode: 404, statusMessage: "Penalty niet gevonden." });
  }

  await prisma.washingPenalty.delete({ where: { id: penaltyId } });
  return { success: true };
};

export default defineEventHandler(async (event) =>
  new BaseEventHandler(event, handlerFunc, schema).handle({
    route: "/api/washing/penalty/delete",
    method: "POST",
    allowType: AllowType.ROLE,
    role: [Role.ADMIN],
  })
);
