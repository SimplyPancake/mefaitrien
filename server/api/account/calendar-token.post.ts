import { randomBytes } from "node:crypto";
import prisma from "~/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import type { SessionEvent } from "~/types";

const handlerFunc = async (event: SessionEvent) => {
  const id = event.session.id;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { isActive: true },
  });
  if (!user || !user.isActive) {
    throw createError({ statusCode: 401, statusMessage: "Dit account is niet actief." });
  }

  const calendarToken = randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id },
    data: { calendarToken },
  });

  return { calendarToken };
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/account/calendar-token",
    method: "POST",
    allowType: "AUTHENTICATED",
  });
});
