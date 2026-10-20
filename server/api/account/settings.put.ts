import * as bcrypt from "bcrypt";
import { object, string } from "yup";
import prisma from "~/lib/prisma";
import { verifyToken } from "~/server/utils/auth";

const settingsSchema = object({
  email: string().trim().lowercase().email("Vul een geldig e-mailadres in.").required("E-mailadres is verplicht."),
  currentPassword: string().required("Vul je huidige wachtwoord in."),
});

export default defineEventHandler(async (event) => {
  const { valid, id } = verifyToken(event);
  if (!valid || !id) {
    throw createError({ statusCode: 401, statusMessage: "Je moet ingelogd zijn." });
  }

  const body = await readBody(event);
  let values: Awaited<ReturnType<typeof settingsSchema.validate>>;
  try {
    values = await settingsSchema.validate(body, { abortEarly: false, stripUnknown: true });
  } catch (error) {
    if (error instanceof Error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { passwordHash: true, isActive: true },
  });
  if (!user || !user.isActive) {
    throw createError({ statusCode: 401, statusMessage: "Dit account is niet actief." });
  }

  if (!(await bcrypt.compare(values.currentPassword, user.passwordHash))) {
    throw createError({ statusCode: 400, statusMessage: "Je huidige wachtwoord is onjuist." });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { email: values.email },
      select: { email: true },
    });
    return updatedUser;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      throw createError({ statusCode: 409, statusMessage: "Dit e-mailadres is al in gebruik." });
    }
    throw error;
  }
});
