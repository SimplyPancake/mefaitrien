// Post availability
import prisma from "@@/lib/prisma";
import { AvailabilityType, Role, type BlockedDay, type MonthRoster, type User } from "../../../../generated/prisma/browser";
import { fillDefaultAvailability } from "~/server/utils/functions";
import type { ExtendedMonthRoster } from "~/server/utils/functions";
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

  const allUsers = await prisma.user.findMany();
  const activeUsers = allUsers.filter((user) => user.isActive);
  const activeUserIds = new Set(activeUsers.map((user) => user.id));
  const currentDate = new Date();
  const fullData = data ?? [];
  const dto: ManageMonthDto[] = fullData.map((d) => {
    const isCurrentOrFuture =
      d.year > currentDate.getFullYear() ||
      (d.year === currentDate.getFullYear() && d.month >= currentDate.getMonth() + 1);
    const usersForRoster = isCurrentOrFuture ? activeUsers : allUsers;
    const existingAvailabilities = isCurrentOrFuture
      ? d.availabilities.filter((availability) => activeUserIds.has(availability.userId))
      : d.availabilities;
    // For each user who hasn't filled in availability, create default AVAILABLE entries
    const usersWithAvailability = new Set(existingAvailabilities.map((av) => av.userId));
    const defaultAvailabilities = usersForRoster
      .filter((user) => !usersWithAvailability.has(user.id))
      .flatMap((user) => fillDefaultAvailability(d, user));

    // Combine existing and default availabilities
    const allAvailabilities = [...existingAvailabilities, ...defaultAvailabilities];

    const availCount = allAvailabilities.filter((x) => x.availability != "UNAVAILABLE").length;
    const totalAvailCount = allAvailabilities.length;
    const monthAssignedYet = d.status == "ASSIGNED";
    const totalFilledIn = Array.from(new Set(allAvailabilities.map((aval) => aval.userId))).length;

    const percentage = Math.round((availCount / totalAvailCount) * 100);
    return {
      ...d,
      availabilities: allAvailabilities,
      averageAvailability: percentage,
      daysWithoutCook: monthAssignedYet ? -1 : undefined,
      filledIn: usersWithAvailability.size,
      maxAssigned: usersForRoster.length,
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
