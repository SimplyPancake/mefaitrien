import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import type { SessionEvent } from "~/types";
import { number, object, string } from "yup";

const schema = object({
  userId: number().integer().required(),
  amount: number().integer().notOneOf([0], "Het aantal punten mag niet nul zijn.").required(),
  reason: string().trim().min(1).max(500).required(),
});

const handlerFunc = async (event: SessionEvent) => {
  const { userId, amount, reason } = event.data;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "Gebruiker niet gevonden." });
  }

  await prisma.washingPenalty.create({ data: { userId, amount, reason } });
  return { success: true };
};

export default defineEventHandler(async (event) =>
  new BaseEventHandler(event, handlerFunc, schema).handle({
    route: "/api/washing/penalty",
    method: "POST",
    allowType: "AUTHENTICATED",
  })
);
