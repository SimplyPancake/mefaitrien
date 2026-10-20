import { object, string } from "yup";
import prisma from "~/lib/prisma";
import { hashPassword, verifyPassword } from "~/server/utils/auth";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import type { SessionEvent } from "~/types";

const passwordSchema = object({
  currentPassword: string().required("Vul je huidige wachtwoord in."),
  newPassword: string()
    .min(8, "Je nieuwe wachtwoord moet minimaal 8 tekens bevatten.")
    .required("Vul een nieuw wachtwoord in."),
});

const handlerFunc = async (event: SessionEvent) => {
  const id = event.session.id;
  const { currentPassword, newPassword } = event.data;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { passwordHash: true, isActive: true },
  });
  if (!user || !user.isActive) {
    throw createError({ statusCode: 401, statusMessage: "Dit account is niet actief." });
  }

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw createError({ statusCode: 400, statusMessage: "Je huidige wachtwoord is onjuist." });
  }
  if (await verifyPassword(newPassword, user.passwordHash)) {
    throw createError({ statusCode: 400, statusMessage: "Kies een ander wachtwoord dan je huidige." });
  }

  await prisma.user.update({
    where: { id },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  return { success: true };
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc, passwordSchema).handle({
    route: "/api/account/password",
    method: "POST",
    allowType: "AUTHENTICATED",
  });
});
