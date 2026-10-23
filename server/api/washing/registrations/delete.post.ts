import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { AllowType } from "~/types";
import type { SessionEvent } from "~/types";
import { Role } from "~/generated/prisma/enums";
import { number, object } from "yup";

const schema = object({
  registrationId: number().integer().required(),
});

const handlerFunc = async (event: SessionEvent) => {
  const { registrationId } = event.data;
  const registration = await prisma.washingRegistration.findUnique({
    where: { id: registrationId },
    select: { id: true },
  });
  if (!registration) {
    throw createError({ statusCode: 404, statusMessage: "Afwasregistratie niet gevonden." });
  }

  await prisma.$transaction([
    prisma.washingRegistrationEatUser.deleteMany({ where: { washingRegistrationId: registrationId } }),
    prisma.washingRegistration.delete({ where: { id: registrationId } }),
  ]);
  return { success: true };
};

export default defineEventHandler(async (event) =>
  new BaseEventHandler(event, handlerFunc, schema).handle({
    route: "/api/washing/registrations/delete",
    method: "POST",
    allowType: AllowType.ROLE,
    role: [Role.ADMIN],
  })
);
