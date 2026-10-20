import { object, string } from "yup";
import prisma from "~/lib/prisma";
import { hashPassword, verifyPassword, verifyToken } from "~/server/utils/auth";

const passwordSchema = object({
  currentPassword: string().required("Vul je huidige wachtwoord in."),
  newPassword: string()
    .min(8, "Je nieuwe wachtwoord moet minimaal 8 tekens bevatten.")
    .required("Vul een nieuw wachtwoord in."),
});

export default defineEventHandler(async (event) => {
  const { valid, id } = verifyToken(event);
  if (!valid || !id) {
    throw createError({ statusCode: 401, statusMessage: "Je moet ingelogd zijn." });
  }

  const body = await readBody(event);
  let values: Awaited<ReturnType<typeof passwordSchema.validate>>;
  try {
    values = await passwordSchema.validate(body, { abortEarly: false, stripUnknown: true });
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

  if (!(await verifyPassword(values.currentPassword, user.passwordHash))) {
    throw createError({ statusCode: 400, statusMessage: "Je huidige wachtwoord is onjuist." });
  }
  if (await verifyPassword(values.newPassword, user.passwordHash)) {
    throw createError({ statusCode: 400, statusMessage: "Kies een ander wachtwoord dan je huidige." });
  }

  await prisma.user.update({
    where: { id },
    data: { passwordHash: await hashPassword(values.newPassword) },
  });

  return { success: true };
});
