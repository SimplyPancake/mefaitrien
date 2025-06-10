// Post availability
import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { type ManageMonthDto } from "~/types/dto";
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
      availabilities: {
        include: {
          user: true,
        },
      },
      blockedDates: true,
    },
  });

  const totalUsers = await prisma.user.count();

  const fullData = data ?? [];
  const dto: ManageMonthDto[] = fullData.map((d) => {
    const availCount = d.availabilities.filter((x) => x.availability != "UNAVAILABLE").length;
    const totalAvailCount = d.availabilities.length;
    const monthAssignedYet = d.status == "ASSIGNED";
    const totalFilledIn = Array.from(new Set(d.availabilities.map((aval) => aval.userId))).length;

    const percentage = Math.round((availCount / totalAvailCount) * 100);
    return {
      ...d,
      averageAvailability: percentage,
      daysWithoutCook: monthAssignedYet ? -1 : undefined,
      filledIn: totalFilledIn,
      maxAssigned: totalUsers,
    };
  });

  return dto;
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handle({
    route: "/api/cooking/roster/months",
    method: "GET",
    allowType: "AUTHENTICATED",
    role: ["ADMIN", "COOKING"],
  });
});
