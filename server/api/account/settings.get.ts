import prisma from "~/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import type { SessionEvent } from "~/types";

const handlerFunc = async (event: SessionEvent) => {
  const user = await prisma.user.findUnique({
    where: { id: event.session.id },
    select: { id: true, email: true, calendarToken: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw createError({ statusCode: 401, statusMessage: "Dit account is niet actief." });
  }

  return { id: user.id, email: user.email, calendarToken: user.calendarToken };
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/account/settings",
    method: "GET",
    allowType: "AUTHENTICATED",
  });
});
