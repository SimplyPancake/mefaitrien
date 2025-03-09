import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { SessionEvent } from "~/types";

let handlerFunc = async (event: SessionEvent) => {
  // Get month roster of this month by all users
  const roster = await prisma.monthRoster.findFirst({
    where: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      availabilities: {
        some: {
          userId: event.session.id,
        },
      },
    },
  });

  if (!roster) {
    throw createError({ statusCode: 404, statusMessage: "Roster not found" });
  }

  return roster;
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handleConfig({
    route: "/api/cooking/me",
    method: "GET",
    allowType: "AUTHENTICATED",
  });
});
