// Post availability
import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { CreatedRosterMonth } from "~/types/dto";
import { H3Event } from "h3";

// Returns the months and year that rosters have been made.
let handlerFunc = async (event: H3Event) => {
  const data = await prisma.monthRoster.findMany({
    where: {
      year: {
        gte: new Date().getFullYear() - 2, // Limit to 2 years previous
      },
    },
    include: {
      availabilities: true,
      blockedDates: true,
    },
  });

  if (data) {
    return data as CreatedRosterMonth[];
  } else {
    return [] as CreatedRosterMonth[];
  }
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/cooking/roster/months",
    method: "GET",
    allowType: "AUTHENTICATED",
  });
});
