import * as bcrypt from "bcrypt";
import { object, string } from "yup";
import prisma from "~/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import type { SessionEvent } from "~/types";

const settingsSchema = object({
  email: string().trim().lowercase().email("Vul een geldig e-mailadres in.").required("E-mailadres is verplicht."),
  currentPassword: string().required("Vul je huidige wachtwoord in."),
});

const handlerFunc = async (event: SessionEvent) => {
  const id = event.session.id;
  const { email, currentPassword } = event.data;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { passwordHash: true, isActive: true },
  });
  if (!user || !user.isActive) {
    throw createError({ statusCode: 401, statusMessage: "Dit account is niet actief." });
  }

  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw createError({ statusCode: 400, statusMessage: "Je huidige wachtwoord is onjuist." });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { email },
      select: { email: true },
    });
    return updatedUser;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      throw createError({ statusCode: 409, statusMessage: "Dit e-mailadres is al in gebruik." });
    }
    throw error;
  }
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc, settingsSchema).handle({
    route: "/api/account/settings",
    method: "PUT",
    allowType: "AUTHENTICATED",
  });
});
