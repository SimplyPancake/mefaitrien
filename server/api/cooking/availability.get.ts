// Availability made for filling in OWN schema,
// So this means that we want our own availability and the blocked dates of that month
import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { SessionEvent } from "~/types";

let handlerFunc = async (event: SessionEvent) => {
  // Get month roster of this month by all users
  const roster = await prisma.monthRoster.findMany({
    where: {
      year: {
        gte: new Date().getFullYear() - 2, // Only fetch the last 2 years of data, we don't want to bombard user
      },
    },
    include: {
      availabilities: {
        where: {
          userId: event.session.id,
        },
        orderBy: {
          day: "asc",
        },
      },
      blockedDates: {
        orderBy: {
          day: "asc",
        },
      },
    },
  });

  return roster;
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/roster/availability",
    method: "GET",
    allowType: "AUTHENTICATED",
  });
});
